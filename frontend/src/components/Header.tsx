import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { session, signOut } = useAuth();

  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">JobLens</Link>
        </div>
        <ul className="nav-links">
          {session ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/jobs">Jobs</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><button onClick={() => signOut()}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;