import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("qistati.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    phone TEXT,
    national_id TEXT,
    role TEXT, -- 'admin', 'merchant', 'customer', 'financier'
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER,
    name TEXT,
    description TEXT,
    original_price REAL,
    image_url TEXT,
    FOREIGN KEY(merchant_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    merchant_id INTEGER,
    financier_id INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'modification_requested'
    total_price REAL,
    installment_plan INTEGER, -- 6 or 12
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(merchant_id) REFERENCES users(id),
    FOREIGN KEY(financier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS order_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    type TEXT, -- 'id_front', 'id_back', 'social_security', 'salary_slip'
    file_path TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );
`);

// Seed some data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run("admin@qistati.com", "admin123", "Super Admin", "admin");
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run("merchant@test.com", "pass123", "Electronics Store", "merchant");
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run("financier@test.com", "pass123", "Quick Finance Co", "financier");
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run("customer@test.com", "pass123", "Ahmad Ali", "customer");

  const merchantId = 2;
  db.prepare("INSERT INTO products (merchant_id, name, description, original_price, image_url) VALUES (?, ?, ?, ?, ?)").run(
    merchantId,
    "iPhone 15 Pro",
    "Latest Apple iPhone with Titanium design.",
    999,
    "https://picsum.photos/seed/iphone/400/400"
  );
  db.prepare("INSERT INTO products (merchant_id, name, description, original_price, image_url) VALUES (?, ?, ?, ?, ?)").run(
    merchantId,
    "MacBook Air M2",
    "Supercharged by M2 chip.",
    1199,
    "https://picsum.photos/seed/macbook/400/400"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { email, password, name, phone, national_id, role = 'customer' } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (email, password, name, phone, national_id, role) VALUES (?, ?, ?, ?, ?, ?)").run(
        email, password, name, phone, national_id, role
      );
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: "البريد الإلكتروني مسجل مسبقاً" });
      } else {
        res.status(500).json({ error: "حدث خطأ أثناء التسجيل" });
      }
    }
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { merchant_id, name, description, original_price, image_url } = req.body;
    const result = db.prepare("INSERT INTO products (merchant_id, name, description, original_price, image_url) VALUES (?, ?, ?, ?, ?)").run(
      merchant_id, name, description, original_price, image_url
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/orders", (req, res) => {
    const { role, userId } = req.query;
    let orders;
    if (role === 'customer') {
      orders = db.prepare("SELECT * FROM orders WHERE customer_id = ?").all(userId);
    } else if (role === 'merchant') {
      orders = db.prepare("SELECT * FROM orders WHERE merchant_id = ?").all(userId);
    } else if (role === 'financier') {
      orders = db.prepare("SELECT * FROM orders").all();
    } else {
      orders = db.prepare("SELECT * FROM orders").all();
    }
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const { customer_id, merchant_id, items, total_price, installment_plan, documents } = req.body;
    const financier = db.prepare("SELECT id FROM users WHERE role = 'financier' LIMIT 1").get() as any;
    
    const result = db.prepare("INSERT INTO orders (customer_id, merchant_id, financier_id, total_price, installment_plan) VALUES (?, ?, ?, ?, ?)").run(
      customer_id, merchant_id, financier.id, total_price, installment_plan
    );
    const orderId = result.lastInsertRowid;

    for (const item of items) {
      db.prepare("INSERT INTO order_items (order_id, product_id, price) VALUES (?, ?, ?)").run(orderId, item.id, item.price);
    }

    if (documents) {
      for (const [type, path] of Object.entries(documents)) {
        db.prepare("INSERT INTO order_documents (order_id, type, file_path) VALUES (?, ?, ?)").run(orderId, type, path);
      }
    }

    res.json({ id: orderId });
  });

  app.patch("/api/orders/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
