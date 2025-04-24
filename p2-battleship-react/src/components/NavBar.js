import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NavBar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-title">Battleship</div>
      <ul className="navbar-links">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/games"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Multiplayer - New game
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/game"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            AI Practice
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/rules"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Rules
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/scores"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Leaderboard
          </NavLink>
        </li>
        {user ? (
          <>
            <li className="user-info">
              <span className="username">{user.username}</span>
            </li>
            <li>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Login
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Register
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
