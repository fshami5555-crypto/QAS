import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@netlify/neon";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const sql = neon(process.env.NETLIFY_DATABASE_URL!);

async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        phone TEXT,
        national_id TEXT,
        role TEXT, -- 'admin', 'merchant', 'customer', 'financier'
        status TEXT DEFAULT 'active'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER REFERENCES users(id),
        name TEXT,
        description TEXT,
        original_price REAL,
        image_url TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id),
        merchant_id INTEGER REFERENCES users(id),
        financier_id INTEGER REFERENCES users(id),
        status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'modification_requested'
        total_price REAL,
        installment_plan INTEGER, -- 6 or 12
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        price REAL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS order_documents (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        type TEXT, -- 'id_front', 'id_back', 'social_security', 'salary_slip'
        file_path TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;

    // Seed some data
    const seedUsers = [
      { email: "admin@qistati.com", password: "admin123", name: "Super Admin", role: "admin" },
      { email: "merchant@test.com", password: "pass123", name: "Electronics Store", role: "merchant" },
      { email: "financier@test.com", password: "pass123", name: "Quick Finance Co", role: "financier" },
      { email: "customer@test.com", password: "pass123", name: "Ahmad Ali", role: "customer" }
    ];

    for (const u of seedUsers) {
      await sql`
        INSERT INTO users (email, password, name, role) 
        VALUES (${u.email}, ${u.password}, ${u.name}, ${u.role})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    const products = await sql`SELECT COUNT(*) as count FROM products`;
    if (parseInt(products[0].count) === 0) {
      const merchants = await sql`SELECT id FROM users WHERE role = 'merchant' LIMIT 1`;
      if (merchants.length > 0) {
        const merchantId = merchants[0].id;
        await sql`
          INSERT INTO products (merchant_id, name, description, original_price, image_url) 
          VALUES (${merchantId}, 'iPhone 15 Pro', 'Latest Apple iPhone with Titanium design.', 999, 'https://picsum.photos/seed/iphone/400/400')
        `;
        await sql`
          INSERT INTO products (merchant_id, name, description, original_price, image_url) 
          VALUES (${merchantId}, 'MacBook Air M2', 'Supercharged by M2 chip.', 1199, 'https://picsum.photos/seed/macbook/400/400')
        `;
      }
    }

    await sql`INSERT INTO settings (key, value) VALUES ('site_name', 'قسطني') ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO settings (key, value) VALUES ('site_logo', 'https://i.ibb.co/pjybBgHC/logo.png') ON CONFLICT (key) DO NOTHING`;

    console.log("Database initialization and seeding complete.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

async function startServer() {
  await initDb();
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);
    try {
      const users = await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password}`;
      if (users.length > 0) {
        const user = users[0];
        console.log(`Login success: ${email} (Role: ${user.role})`);
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        console.log(`Login failed: ${email} (Invalid credentials)`);
        res.status(401).json({ error: "خطأ في البريد الإلكتروني أو كلمة المرور" });
      }
    } catch (error) {
      console.error(`Login error for ${email}:`, error);
      res.status(500).json({ error: "حدث خطأ في الخادم أثناء تسجيل الدخول" });
    }
  });

  app.post("/api/register", async (req, res) => {
    const { email, password, name, phone, national_id, role = 'customer' } = req.body;
    console.log(`Registration attempt: ${email}`);
    try {
      const users = await sql`
        INSERT INTO users (email, password, name, phone, national_id, role) 
        VALUES (${email}, ${password}, ${name}, ${phone}, ${national_id}, ${role})
        RETURNING *
      `;
      const user = users[0];
      console.log(`Registration success: ${email} (ID: ${user.id})`);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error(`Registration error for ${email}:`, error);
      if (error.code === '23505') { // Postgres unique constraint violation
        res.status(400).json({ error: "البريد الإلكتروني مسجل مسبقاً" });
      } else {
        res.status(500).json({ error: "حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً." });
      }
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await sql`SELECT * FROM products`;
      console.log(`Fetched ${products.length} products`);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "حدث خطأ أثناء جلب المنتجات" });
    }
  });

  app.post("/api/products", async (req, res) => {
    const { merchant_id, name, description, original_price, image_url } = req.body;
    try {
      const products = await sql`
        INSERT INTO products (merchant_id, name, description, original_price, image_url) 
        VALUES (${merchant_id}, ${name}, ${description}, ${original_price}, ${image_url})
        RETURNING id
      `;
      res.json({ id: products[0].id });
    } catch (error) {
      res.status(500).json({ error: "Error adding product" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    const { role, userId } = req.query;
    try {
      let orders;
      if (role === 'customer') {
        orders = await sql`SELECT * FROM orders WHERE customer_id = ${userId}`;
      } else if (role === 'merchant') {
        orders = await sql`SELECT * FROM orders WHERE merchant_id = ${userId}`;
      } else {
        orders = await sql`SELECT * FROM orders`;
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Error fetching orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const { customer_id, merchant_id, items, total_price, installment_plan, documents } = req.body;
    try {
      const financiers = await sql`SELECT id FROM users WHERE role = 'financier' LIMIT 1`;
      const financierId = financiers[0]?.id;
      
      const orders = await sql`
        INSERT INTO orders (customer_id, merchant_id, financier_id, total_price, installment_plan) 
        VALUES (${customer_id}, ${merchant_id}, ${financierId}, ${total_price}, ${installment_plan})
        RETURNING id
      `;
      const orderId = orders[0].id;

      for (const item of items) {
        await sql`INSERT INTO order_items (order_id, product_id, price) VALUES (${orderId}, ${item.id}, ${item.price})`;
      }

      if (documents) {
        for (const [type, path] of Object.entries(documents)) {
          await sql`INSERT INTO order_documents (order_id, type, file_path) VALUES (${orderId}, ${type}, ${path})`;
        }
      }

      res.json({ id: orderId });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Error creating order" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const { status } = req.body;
    try {
      await sql`UPDATE orders SET status = ${status} WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error updating order" });
    }
  });

  // Admin Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await sql`SELECT * FROM settings`;
      const settingsMap = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ error: "Error fetching settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const { site_name, site_logo } = req.body;
    try {
      if (site_name) await sql`INSERT INTO settings (key, value) VALUES ('site_name', ${site_name}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      if (site_logo) await sql`INSERT INTO settings (key, value) VALUES ('site_logo', ${site_logo}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error updating settings" });
    }
  });

  // Admin User Management
  app.get("/api/users", async (req, res) => {
    try {
      const users = await sql`SELECT id, email, name, role, status FROM users`;
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await sql`DELETE FROM users WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await sql`DELETE FROM products WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error deleting product" });
    }
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
