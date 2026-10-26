import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

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
          <NavLink to="/" end>
            Products
          </NavLink>
          {user && <NavLink to="/orders">My orders</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/cart">
            Cart
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
