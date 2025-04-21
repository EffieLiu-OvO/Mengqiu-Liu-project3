// frontend/src/components/NavBar.js
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NavBar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 检查本地存储中是否有用户信息
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    // 清除本地存储中的用户信息和令牌
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
            多人对战
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/game"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            AI练习
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/rules"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            规则
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/scores"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            排行榜
          </NavLink>
        </li>
        {user ? (
          <>
            <li className="user-info">
              <span className="username">{user.username}</span>
            </li>
            <li>
              <button className="logout-button" onClick={handleLogout}>
                注销
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
                登录
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                注册
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
