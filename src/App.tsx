import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Store, 
  CreditCard, 
  User, 
  LogOut, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  ChevronRight,
  ShoppingCart,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Role = 'admin' | 'merchant' | 'customer' | 'financier';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  national_id?: string;
  role: Role;
}

interface Product {
  id: number;
  name: string;
  description: string;
  original_price: number;
  image_url: string;
  merchant_id: number;
}

interface Order {
  id: number;
  customer_id: number;
  merchant_id: number;
  financier_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'modification_requested';
  total_price: number;
  installment_plan: 6 | 12;
  created_at: string;
}

// --- Constants ---
const COMMISSION_RATE = 0.05; // 5%
const INTEREST_RATE = 0.09; // 9%
const TOTAL_MARKUP = COMMISSION_RATE + INTEREST_RATE;

// --- Components ---

const Navbar = ({ user, onLogout, cartCount, onOpenCart, onLoginClick }: { user: User | null, onLogout: () => void, cartCount: number, onOpenCart: () => void, onLoginClick: () => void }) => (
  <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20 items-center">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <img 
            src="https://i.ibb.co/pjybBgHC/logo.png" 
            alt="Qistni Logo" 
            className="h-12 w-auto object-contain"
            onError={(e) => {
              // Fallback if direct link fails
              e.currentTarget.src = "https://i.ibb.co/vX8Yyv0/qistni-placeholder.png";
            }}
          />
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-black text-blue-900 tracking-tight">قسطني</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Qistni</span>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-slate-600 ml-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <User size={18} className="text-blue-600" />
                <span className="text-sm font-bold">{user.name}</span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {user.role === 'customer' ? 'عميل' : user.role === 'merchant' ? 'تاجر' : user.role === 'financier' ? 'شركة تمويل' : 'مدير'}
                </span>
              </div>
              {user.role === 'customer' && (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onOpenCart}
                  className="relative p-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-colors"
                >
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </motion.button>
              )}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onLogout}
                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
              >
                <LogOut size={22} />
              </motion.button>
            </>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLoginClick}
              className="bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/20"
            >
              تسجيل الدخول
            </motion.button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  key?: React.Key;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const totalPrice = product.original_price * (1 + TOTAL_MARKUP);
  const monthly6 = (totalPrice / 6).toFixed(2);
  const monthly12 = (totalPrice / 12).toFixed(2);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group"
    >
      <div className="aspect-[4/5] relative overflow-hidden">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-blue-600 shadow-lg">
          تقسيط ميسر
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-slate-900 mb-2">{product.name}</h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{product.description}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-blue-50 p-3 rounded-3xl text-center">
            <span className="block text-[10px] text-blue-400 font-bold uppercase mb-1">6 أشهر</span>
            <span className="text-lg font-black text-blue-700">{monthly6} <span className="text-xs">د.أ</span></span>
          </div>
          <div className="bg-amber-50 p-3 rounded-3xl text-center">
            <span className="block text-[10px] text-amber-500 font-bold uppercase mb-1">12 شهر</span>
            <span className="text-lg font-black text-amber-700">{monthly12} <span className="text-xs">د.أ</span></span>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAddToCart(product)}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200"
        >
          <Plus size={20} />
          إضافة للسلة
        </motion.button>
      </div>
    </motion.div>
  );
};

const OrderStatusBadge = ({ status }: { status: Order['status'] }) => {
  const configs = {
    pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700', icon: Clock },
    approved: { label: 'تمت الموافقة', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
    modification_requested: { label: 'مطلوب تعديل', color: 'bg-blue-100 text-blue-700', icon: FileText },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
};

const Hero = ({ onShopNow }: { onShopNow: () => void }) => (
  <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden mb-20 shadow-2xl shadow-blue-900/20">
    <div className="absolute inset-0 opacity-30">
      <img 
        src="https://picsum.photos/seed/finance/1920/1080?blur=1" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent" />
    </div>
    
    {/* Floating Blobs */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -mr-48 -mt-48 animate-pulse" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 blur-[100px] rounded-full -ml-48 -mb-48 animate-pulse" />

    <div className="relative px-10 py-24 lg:py-40 flex flex-col items-center text-center lg:items-start lg:text-right max-w-4xl mr-auto lg:mr-16">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="inline-flex items-center gap-3 bg-blue-500/20 border border-blue-500/30 px-6 py-2 rounded-full text-blue-300 text-sm font-black mb-8 backdrop-blur-md"
      >
        <CreditCard size={18} />
        <span>قسط مشترياتك بكل سهولة وأمان مع قسطني</span>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="text-6xl lg:text-8xl font-black text-white mb-8 leading-[1.05] tracking-tight"
      >
        اشترِ اليوم.. <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">وادفع لاحقاً</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-slate-300 text-xl mb-12 max-w-2xl leading-relaxed font-medium"
      >
        منصة قسطني توفر لك تجربة تسوق ذكية وممتعة. احصل على أحدث المنتجات الآن ووزع التكلفة على دفعات شهرية مريحة تناسب نمط حياتك.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="flex flex-wrap gap-6"
      >
        <motion.button 
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShopNow}
          className="bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black text-xl hover:bg-blue-600 transition-all shadow-2xl shadow-blue-700/40 flex items-center gap-3"
        >
          ابدأ التسوق الآن
          <ChevronRight className="rotate-180" />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05, bg: "rgba(255,255,255,0.2)" }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 text-white border border-white/20 px-10 py-5 rounded-[2rem] font-black text-xl transition-all backdrop-blur-md"
        >
          تعرف علينا أكثر
        </motion.button>
      </motion.div>
    </div>
  </div>
);

const HowItWorks = () => (
  <div className="py-32 border-t border-slate-200 relative overflow-hidden">
    {/* Decorative Blobs */}
    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100/50 blur-[80px] rounded-full -ml-32 -mt-32" />
    <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-100/50 blur-[80px] rounded-full -mr-32 -mb-32" />

    <div className="text-center mb-20 relative">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl lg:text-5xl font-black text-slate-900 mb-6"
      >
        كيف تعمل قسطني؟
      </motion.h2>
      <p className="text-slate-500 text-lg">ثلاث خطوات بسيطة تفصلك عن امتلاك ما تحلم به</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
      {[
        {
          icon: ShoppingBag,
          title: "اختر منتجاتك",
          desc: "تصفح مئات المنتجات من أفضل التجار وأضف ما تحتاجه إلى سلة المشتريات.",
          color: "bg-blue-100 text-blue-600",
          blob: "bg-blue-400"
        },
        {
          icon: FileText,
          title: "قدم طلب التقسيط",
          desc: "اختر خطة الدفع (6 أو 12 شهراً) وارفع الوثائق المطلوبة في أقل من دقيقتين.",
          color: "bg-amber-100 text-amber-600",
          blob: "bg-amber-400"
        },
        {
          icon: CheckCircle,
          title: "استلم واستمتع",
          desc: "بمجرد موافقة شركة التمويل، سيقوم التاجر بتجهيز طلبك وتوصيله إليك فوراً.",
          color: "bg-blue-100 text-blue-600",
          blob: "bg-blue-400"
        }
      ].map((step, idx) => (
        <motion.div 
          key={idx} 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.2 }}
          className="relative text-center group"
        >
          <div className="relative mb-8">
            <div className={`w-24 h-24 ${step.color} rounded-[2rem] flex items-center justify-center mx-auto group-hover:rotate-12 transition-transform duration-500 shadow-xl`}>
              <step.icon size={40} />
            </div>
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${step.blob} rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-black text-xs`}>
              {idx + 1}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">{step.title}</h3>
          <p className="text-slate-500 leading-relaxed text-lg">{step.desc}</p>
          {idx < 2 && (
            <div className="hidden md:block absolute top-12 -left-8 text-slate-200 animate-float">
              <ChevronRight size={48} className="rotate-180" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'orders' | 'merchant' | 'financier' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    phone: '', 
    national_id: '',
    id_front: null as File | null,
    id_back: null as File | null,
    social_security: null as File | null,
    salary_slip: null as File | null
  });
  const [pendingCheckout, setPendingCheckout] = useState<{ plan: 6 | 12 } | null>(null);
  const [newProductForm, setNewProductForm] = useState({ name: '', description: '', original_price: '', image_url: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (user.role === 'merchant') setView('merchant');
      if (user.role === 'financier') setView('financier');
      if (user.role === 'admin') setView('admin');
    } else {
      setView('home');
    }
  }, [user]);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchOrders = async () => {
    if (!user) return;
    const res = await fetch(`/api/orders?role=${user.role}&userId=${user.id}`);
    const data = await res.json();
    setOrders(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      setIsLoginModalOpen(false);
      if (pendingCheckout) {
        handleCheckout(pendingCheckout.plan, userData);
      }
    } else {
      alert('خطأ في بيانات الدخول');
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we would upload files to a storage service
    // For this demo, we'll simulate the upload by using the file names
    const documents = {
      id_front: registerForm.id_front?.name || 'simulated_path_front.jpg',
      id_back: registerForm.id_back?.name || 'simulated_path_back.jpg',
      social_security: registerForm.social_security?.name || 'simulated_path_ss.pdf',
      salary_slip: registerForm.salary_slip?.name || 'simulated_path_salary.pdf',
    };

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        phone: registerForm.phone,
        national_id: registerForm.national_id
      })
    });

    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      setIsLoginModalOpen(false);
      
      if (pendingCheckout) {
        // Proceed with checkout using the new user and documents
        await submitOrder(pendingCheckout.plan, userData, documents);
      }
    } else {
      const data = await res.json();
      alert(data.error || 'خطأ في التسجيل');
    }
  };

  const handleCheckout = async (plan: 6 | 12, currentUser = user) => {
    if (!currentUser) {
      setPendingCheckout({ plan });
      setAuthMode('register');
      setIsLoginModalOpen(true);
      return;
    }
    await submitOrder(plan, currentUser);
  };

  const submitOrder = async (plan: 6 | 12, currentUser: User, documents?: any) => {
    const originalTotal = cart.reduce((sum, p) => sum + p.original_price, 0);
    const totalWithMarkup = originalTotal * (1 + TOTAL_MARKUP);

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: currentUser.id,
        merchant_id: cart[0].merchant_id,
        items: cart.map(p => ({ id: p.id, price: p.original_price })),
        total_price: totalWithMarkup,
        installment_plan: plan,
        documents: documents || {
          id_front: 'existing_doc_front.jpg',
          id_back: 'existing_doc_back.jpg',
          social_security: 'existing_doc_ss.pdf',
          salary_slip: 'existing_doc_salary.pdf'
        }
      })
    });

    if (res.ok) {
      alert('تم تقديم طلب التقسيط بنجاح! بانتظار مراجعة شركة التمويل.');
      setCart([]);
      setIsCartOpen(false);
      setView('orders');
      setPendingCheckout(null);
      fetchOrders();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newProductForm,
        merchant_id: user.id,
        original_price: parseFloat(newProductForm.original_price)
      })
    });
    if (res.ok) {
      setNewProductForm({ name: '', description: '', original_price: '', image_url: '' });
      fetchProducts();
    }
  };

  const updateOrderStatus = async (orderId: number, status: Order['status']) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchOrders();
    }
  };

  return (
    <div className="min-h-screen font-arabic">
      <Navbar 
        user={user} 
        onLogout={() => setUser(null)} 
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
      />

      {/* Background Decorations */}
      <div className="bg-blob w-[500px] h-[500px] bg-blue-400 top-[-10%] right-[-10%]" />
      <div className="bg-blob w-[400px] h-[400px] bg-amber-400 bottom-[-10%] left-[-10%]" />
      <div className="bg-blob w-[300px] h-[300px] bg-rose-400 top-[40%] left-[-5%]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs for Customer */}
        {user?.role === 'customer' && (
          <div className="flex gap-4 mb-8 border-b border-slate-200">
            <button 
              onClick={() => setView('home')}
              className={`pb-4 px-2 font-bold text-sm transition-all ${view === 'home' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              المتجر
            </button>
            <button 
              onClick={() => setView('orders')}
              className={`pb-4 px-2 font-bold text-sm transition-all ${view === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              طلباتي
            </button>
          </div>
        )}

        {/* Home View (Product Listing) */}
        {view === 'home' && (
          <div>
            <Hero onShopNow={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })} />
            
            <div id="products-section" className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">المنتجات المميزة</h2>
                <p className="text-slate-500">اكتشف أحدث المنتجات المتاحة للتقسيط الفوري</p>
              </div>
              <div className="flex gap-2">
                {['الكل', 'إلكترونيات', 'أثاث', 'أجهزة منزلية'].map(cat => (
                  <button key={cat} className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all">
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>

            <HowItWorks />
          </div>
        )}

        {/* Customer Orders View */}
        {view === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">تتبع طلبات التقسيط</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الطلب</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">القيمة الإجمالية</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">خطة الدفع</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.total_price.toFixed(2)} د.أ</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.installment_plan} شهراً</td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا يوجد طلبات حالية</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Merchant View */}
        {view === 'merchant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">منتجاتي</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.filter(p => p.merchant_id === user?.id).map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                    <img src={product.image_url} className="w-20 h-20 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-slate-900">{product.name}</h4>
                      <p className="text-sm text-slate-500">السعر الأصلي: {product.original_price} د.أ</p>
                      <p className="text-xs text-blue-600 font-bold mt-1">سعر التقسيط: {(product.original_price * (1 + TOTAL_MARKUP)).toFixed(2)} د.أ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit">
              <h3 className="text-xl font-bold text-slate-900 mb-6">إضافة منتج جديد</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنتج</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newProductForm.name}
                    onChange={e => setNewProductForm({...newProductForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">السعر الأصلي (كاش)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newProductForm.original_price}
                    onChange={e => setNewProductForm({...newProductForm, original_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رابط الصورة</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newProductForm.image_url}
                    onChange={e => setNewProductForm({...newProductForm, image_url: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">وصف المنتج</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                    value={newProductForm.description}
                    onChange={e => setNewProductForm({...newProductForm, description: e.target.value})}
                  ></textarea>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                  نشر المنتج
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Financier View */}
        {view === 'financier' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">طلبات التمويل الواردة</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الطلب</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">العميل</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">المبلغ الإجمالي</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الخطة</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">عميل رقم {order.customer_id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.total_price.toFixed(2)} د.أ</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.installment_plan} شهراً</td>
                      <td className="px-6 py-4">
                        {order.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'approved')}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              قبول
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'rejected')}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                            >
                              رفض
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'modification_requested')}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              نواقص
                            </button>
                          </div>
                        ) : (
                          <OrderStatusBadge status={order.status} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Login/Register Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {authMode === 'login' ? 'مرحباً بك مجدداً' : 'إنشاء حساب جديد للتقسيط'}
                  </h2>
                  <p className="text-slate-500">
                    {authMode === 'login' ? 'سجل دخولك لمتابعة عمليات التقسيط الخاصة بك.' : 'قم بتعبئة البيانات التالية لتقديم طلب التقسيط.'}
                  </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    دخول
                  </button>
                  <button 
                    onClick={() => setAuthMode('register')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    تسجيل
                  </button>
                </div>
              </div>
              
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="example@test.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                    <input 
                      type="password" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    دخول
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الرباعي</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={registerForm.name}
                        onChange={e => setRegisterForm({...registerForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الوطني</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={registerForm.national_id}
                        onChange={e => setRegisterForm({...registerForm, national_id: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                      <input 
                        type="tel" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={registerForm.phone}
                        onChange={e => setRegisterForm({...registerForm, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                      <input 
                        type="email" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={registerForm.email}
                        onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={registerForm.password}
                        onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b pb-2">الوثائق المطلوبة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">صورة الهوية (الأمامية)</label>
                        <input 
                          type="file" 
                          required
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={e => setRegisterForm({...registerForm, id_front: e.target.files?.[0] || null})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">صورة الهوية (الخلفية)</label>
                        <input 
                          type="file" 
                          required
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={e => setRegisterForm({...registerForm, id_back: e.target.files?.[0] || null})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">كشف الضمان الاجتماعي</label>
                        <input 
                          type="file" 
                          required
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={e => setRegisterForm({...registerForm, social_security: e.target.files?.[0] || null})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">كشف الراتب (آخر 3 شهور)</label>
                        <input 
                          type="file" 
                          required
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={e => setRegisterForm({...registerForm, salary_slip: e.target.files?.[0] || null})}
                        />
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    إرسال الطلب وإنشاء الحساب
                  </button>
                </form>
              )}
              
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 italic">
                  تجربة: customer@test.com / pass123<br/>
                  تاجر: merchant@test.com / pass123<br/>
                  تمويل: financier@test.com / pass123
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="text-blue-600" />
                  سلة المشتريات
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <ChevronRight />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <img src={item.image_url} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.original_price} د.أ</p>
                    </div>
                    <button 
                      onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="text-slate-300" size={40} />
                    </div>
                    <p className="text-slate-400">السلة فارغة حالياً</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">المجموع الكلي (تقسيط):</span>
                    <span className="text-2xl font-black text-blue-700">
                      {(cart.reduce((sum, p) => sum + p.original_price, 0) * (1 + TOTAL_MARKUP)).toFixed(2)} د.أ
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleCheckout(6)}
                      className="bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex flex-col items-center"
                    >
                      <span className="text-xs opacity-70">تقسيط على</span>
                      6 أشهر
                    </button>
                    <button 
                      onClick={() => handleCheckout(12)}
                      className="bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex flex-col items-center"
                    >
                      <span className="text-xs opacity-70">تقسيط على</span>
                      12 شهراً
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">بالنقر على أحد الخيارات، سيتم تحويلك لرفع الوثائق المطلوبة.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
