import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import Admin from './pages/Admin.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Help from './pages/Help.jsx';

function NotFound() {
  return (
    <div className="container">
      <h1>Page not found</h1>
      <Link to="/">Back to the shop</Link>
    </div>
  );
}

export default function App() {
  return (
    <WishlistProvider>
      <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div><strong>Shop</strong><p className="muted small">Thoughtful finds, inspired by Ethiopian style.</p></div>
          <nav aria-label="Customer service"><Link to="/help">Help & returns</Link><Link to="/orders">Order tracking</Link><Link to="/">Shop products</Link></nav>
          <span className="muted small">Prices shown in ETB where configured.</span>
        </div>
      </footer>
      </>
    </WishlistProvider>
  );
}
