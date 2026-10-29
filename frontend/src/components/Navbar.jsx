import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem('shop_language') || 'en');
  function changeLanguage(next) { setLanguage(next); localStorage.setItem('shop_language', next); document.documentElement.lang = next; document.documentElement.classList.toggle('ethiopic-font', next === 'am'); }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          Shop
        </Link>
        <nav className="nav-links">
          <label className="language-switch" aria-label="Language"><span className="small">Language</span><select value={language} onChange={(e) => changeLanguage(e.target.value)}><option value="en">English</option><option value="am">አማርኛ</option></select></label>
          <NavLink to="/" end>
            {language === 'am' ? 'ምርቶች' : 'Products'}
          </NavLink>
          {user && <NavLink to="/orders">{language === 'am' ? 'ትዕዛዞቼ' : 'My orders'}</NavLink>}
          {isAdmin && <NavLink to="/admin">{language === 'am' ? 'አስተዳዳሪ' : 'Admin'}</NavLink>}
          <NavLink to="/help">{language === 'am' ? 'እገዛ' : 'Help'}</NavLink>
          <NavLink to="/wishlist">{language === 'am' ? 'የተቀመጡ' : 'Saved'}{wishlist.items.length > 0 && <span className="cart-count">{wishlist.items.length}</span>}</NavLink>
          <NavLink to="/cart">
            {language === 'am' ? 'ጋሪ' : 'Cart'}
            {count > 0 && <span className="cart-count">{count}</span>}
          </NavLink>
          {user ? (
            <>
              <span className="nav-user">{user.fullName}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
