import { useState } from "react";
import { Routes, Route, Navigate, NavLink, Link } from "react-router-dom";
import mockBusinesses from "../../data/mockBusinesses";
import { getDistanceKm } from "../../utils/distance";
import LoginPage from "../auth/LoginPage";
import ProtectedRoute from "../../auth/ProtectedRoute";
import Loyalty from "./Loyalty";
import Jobs from "./Jobs";
import Profile from "./Profile";

const USER_LOCATION = { lat: -36.8485, lng: 174.7633 };

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

function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [radius, setRadius] = useState(5);
  const filters = ["All", "Food & Drink", "Retail", "Services", "Health", "Trades"];

  const businessesWithDistance = mockBusinesses
    .map((business) => ({
      ...business,
      distance: getDistanceKm(
        USER_LOCATION.lat,
        USER_LOCATION.lng,
        business.lat,
        business.lng,
      ),
    }))
    .filter((business) => business.distance <= radius)
    .filter(
      (business) => activeFilter === "All" || business.category === activeFilter,
    )
    .sort((firstBusiness, secondBusiness) => firstBusiness.distance - secondBusiness.distance);

  return (
    <>
      <div className="page-header">
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
          Welcome Back
        </p>
        <h2>Discover Local</h2>
        <p>Find businesses near you and explore what's on.</p>
      </div>

      <div className="pill-filter-row">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`pill${activeFilter === filter ? " active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="radius-control">
        <div className="radius-header">
          <span className="radius-label">Search Radius</span>
          <span className="radius-value">{radius} km</span>
        </div>
        <input
          type="range"
          className="radius-slider"
          min={1}
          max={20}
          step={1}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <div className="radius-ticks"><span>1 km</span><span>10 km</span><span>20 km</span></div>
      </div>

      <div className="map-placeholder"><span className="map-placeholder-label">Map Preview</span></div>

      <div className="placeholder-section">
        <div className="placeholder-section-title is-complete" style={{ justifyContent: "space-between" }}>
          <span>Businesses Near You</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "none", letterSpacing: "normal" }}>
            {businessesWithDistance.length} result{businessesWithDistance.length !== 1 ? "s" : ""}
          </span>
        </div>
        {businessesWithDistance.length === 0 ? (
          <div className="empty-state">No Businesses found within {radius} km. Try increasing your radius.</div>
        ) : (
          <div className="business-grid">
            {businessesWithDistance.map((business) => (
              <div className="business-card" key={business.id}>
                <div className="business-card-icon">{getCategoryEmoji(business.category)}</div>
                <div className="business-card-body">
                  <div className="business-card-name">{business.name}</div>
                  <div className="business-card-category">{business.category}</div>
                  <div className="business-card-desc">{business.description}</div>
                </div>
                <div className="business-card-distance">{business.distance.toFixed(1)} km</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="placeholder-section">
        <div className="placeholder-section-title">Business Detail View</div>
        <div className="placeholder-box tall">Business detail panel — component TBD</div>
      </div>
    </>
  );
}

function getCategoryEmoji(category) {
  const categoryIcons = {
    "Food & Drink": "🍔",
    Retail: "🛍️",
    Services: "✂️",
    Health: "🏥",
    Trades: "🔧",
  };

  return categoryIcons[category] || "📍";
}
