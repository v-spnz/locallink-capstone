import { useState } from "react";
import { Routes, Route, Navigate, NavLink, Link } from "react-router-dom";
import mockBusinesses from "../../data/mockBusinesses";
import { getDistanceKm } from "../../utils/distance";
import LoginPage from "../auth/LoginPage";
import ProtectedRoute from "../../auth/ProtectedRoute";
import Loyalty from "./Loyalty";
import Jobs from "./Jobs";
import Profile from "./Profile";
import Home from "./Home";

const styles = {
  main: {
    minHeight: "calc(100vh - 60px)",
    background: "var(--bg)",
    padding: "40px 24px",
  },
  content: { maxWidth: 860, margin: "0 auto", width: "100%" },
};

export default function CustomerPortal() {
  return (
    <>
      <CustomerNav />
      <main style={styles.main}>
        <div style={styles.content}>
          <Routes>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="jobs" element={<Jobs />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function CustomerNav() {
  const navigationItems = [
    ["/home", "Home"],
    ["/loyalty", "Loyalty"],
    ["/jobs", "Services"],
    ["/profile", "Profile"],
  ];

  return (
    <nav className="nav">
      <Link className="nav-logo" to="/home">
        Local<span className="logo-link">Link</span>
      </Link>
      <div className="nav-links">
        {navigationItems.map(([to, label]) => (
          <NavLink
            key={to}
            className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
