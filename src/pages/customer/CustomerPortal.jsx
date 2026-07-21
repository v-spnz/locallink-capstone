import { useState } from "react";
import Modal from "../../components/Modal";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";
import mockBusinesses from "../../data/mockBusinesses";
import { getDistanceKm } from "../../utils/distance";
import LoginPage from "../auth/LoginPage";
import ProtectedRoute from "../../auth/ProtectedRoute";
import { supabase } from "../../lib/supabase";

export default function CustomerPortal() {
  return (
    <>
      <CustomerNav />
      <main style={styles.main}>
        <div style={styles.content}>
          <Routes>
            {/* All Navigates use absolute paths (/home not "home") to prevent loop */}
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
  return (
    <nav className="nav">
      <Link className="nav-logo" to="/home">
        Local<span className="logo-link">Link</span>
      </Link>
      <div className="nav-links">
        <NavLink
          className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
          to="/home"
        >
          Home
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
          to="/loyalty"
        >
          Loyalty
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
          to="/jobs"
        >
          Services
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
          to="/profile"
        >
          Profile
        </NavLink>
      </div>
    </nav>
  );
}

// Default user location: Auckland CBD
const USER_LOCATION = { lat: -36.8485, lng: 174.7633 };

const styles = {
  main: {
    minHeight: "calc(100vh - 60px)",
    background: "var(--bg)",
    padding: "40px 24px",
  },
  content: { maxWidth: 860, margin: "0 auto", width: "100%" },
};

function Login() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      setIsLoggingOut(false);
      return;
    }

    navigate("/login", { replace: true });
  }
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <div
        className="page-header"
        style={{ textAlign: "center", marginBottom: 32 }}
      >
        <h2>Welcome to LocalLink</h2>
        <p>Sign in to discover local businesses and track your rewards.</p>
      </div>
      <div className="todo-note">
        <span>📝</span> Auth flow to be implemented — fields are placeholders
        only.
      </div>
      <div className="tab-row" style={{ margin: "0 auto 24px" }}>
        <button className="tab-btn active">Login</button>
        <button className="tab-btn">Register</button>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          className="form-input"
          type="email"
          placeholder="you@email.com"
          disabled
        />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          className="form-input"
          type="password"
          placeholder="••••••••"
          disabled
        />
      </div>
      <button
        className="btn-primary"
        style={{ width: "100%", marginTop: 8 }}
        onClick={() => navigate("/home")}
      >
        Sign In →
      </button>
    </div>
  );
}

function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [radius, setRadius] = useState(5); // US009: default search radius in km
  const filters = [
    "All",
    "Food & Drink",
    "Retail",
    "Services",
    "Health",
    "Trades",
  ];

  // US009: calculate distance for each business, filter by radius + category, sort nearest first
  const businessesWithDistance = mockBusinesses
    .map((biz) => ({
      ...biz,
      distance: getDistanceKm(
        // attach distance (km) to each business
        USER_LOCATION.lat,
        USER_LOCATION.lng,
        biz.lat,
        biz.lng,
      ),
    }))
    .filter((biz) => biz.distance <= radius) // only keep businesses within selected radius
    .filter((biz) => activeFilter === "All" || biz.category === activeFilter) // apply category filter
    .sort((a, b) => a.distance - b.distance); // sort closest first
  return (
    <>
      <div className="page-header">
        <p
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}
        >
          Welcome Back
        </p>
        <h2>Discover Local</h2>
        <p>Find businesses near you and explore what's on.</p>
      </div>
      <div className="pill-filter-row">
        {filters.map((f) => (
          <button
            key={f}
            className={`pill${activeFilter === f ? " active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {/* US009: radius slider - lets consumer adjust search range from 1 to 20 km */}
      <div className="radius-control">
        <div className="radius-header">
          <span className="radius-label">Search Radius</span>
          <span className="radius-value">{radius} km</span>{" "}
          {/* this displays current radius value */}
        </div>
        <input
          type="range"
          className="radius-slider"
          min={1}
          max={20}
          step={1}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))} // this updates radius state on drag
        />
        <div className="radius-ticks">
          <span>1 km</span>
          <span>10 km</span>
          <span>20 km</span>
        </div>
      </div>
      <div className="map-placeholder">
        <span className="map-placeholder-label">Map Preview</span>
      </div>
      {/* US009: filtered business list - replaces old "Hot Deals" placeholder */}
      <div className="placeholder-section">
        {/* Header row: title on left, result count on right */}
        <div
          className="placeholder-section-title is-complete"
          style={{ justifyContent: "space-between" }}
        >
          <span>Businesses Near You</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--text-muted)",
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            {/* dynamic count based on how many businesses pass the filters */}
            {businessesWithDistance.length} result
            {businessesWithDistance.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* US009: show empty state if no businesses within radius, otherwise render list */}
        {businessesWithDistance.length === 0 ? (
          <div className="empty-state">
            No Businesses found within {radius} km. Try increasing your radius.
          </div>
        ) : (
          <div className="business-grid">
            {businessesWithDistance.map((biz) => (
              <div className="business-card" key={biz.id}>
                {/* category icon from getCategoryEmoji helper */}
                <div className="business-card-icon">
                  {getCategoryEmoji(biz.category)}
                </div>
                {/* business info: name, ctageory tag, description */}
                <div className="business-card-body">
                  <div className="business-card-name">{biz.name}</div>
                  <div className="business-card-category">{biz.category}</div>
                  <div className="business-card-desc">{biz.description}</div>
                </div>
                {/* distance badge - calculated via Haversine, line 87 */}
                <div className="business-card-distance">
                  {biz.distance.toFixed(1)} km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Business Detail View</div>
        <div className="placeholder-box tall">
          Business detail panel — component TBD
        </div>
      </div>
    </>
  );
}

function Loyalty() {
  const [tab, setTab] = useState("inprogress");
  return (
    <>
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your stamp cards and points across local businesses.</p>
      </div>
      <div
        className="card"
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            Total Points
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--blue)" }}>
            —
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Placeholder
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}
          >
            Gold Member
          </div>
          <div className="progress-bar-track" style={{ width: 160 }}>
            <div className="progress-bar-fill" style={{ width: "64%" }} />
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
          >
            180 pts to Platinum
          </div>
        </div>
      </div>
      <div className="tab-row">
        <button
          className={`tab-btn${tab === "inprogress" ? " active" : ""}`}
          onClick={() => setTab("inprogress")}
        >
          In Progress
        </button>
        <button
          className={`tab-btn${tab === "completed" ? " active" : ""}`}
          onClick={() => setTab("completed")}
        >
          Completed
        </button>
      </div>
      {tab === "inprogress" ? (
        <div className="placeholder-section">
          <div className="placeholder-section-title">In Progress</div>
          <div className="placeholder-grid">
            {[1, 2, 3].map((i) => (
              <div className="placeholder-card" key={i}>
                <div className="placeholder-icon" />
                <div className="placeholder-bar short" style={{ margin: 0 }} />
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${30 + i * 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Completed</div>
          <div className="placeholder-box">
            Completed programmes list — component TBD
          </div>
        </div>
      )}
    </>
  );
}

function Jobs() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [postedJob, setPostedJob] = useState(null);
  const [jobStatus, setJobStatus] = useState("Not Posted");
  const [showModal, setShowModal] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [locationError, setLocationError] = useState("");

  function validateForm() {
    if (!jobTitle) {
      setTitleError("Please enter a job title.");
      return false;
    }
    if (!jobDescription) {
      setDescriptionError("Please enter a job description.");
      return false;
    }
    if (!tradeCategory) {
      setCategoryError("Please enter a trade category.");
      return false;
    }
    if (!jobLocation) {
      setLocationError("Please enter a job location.");
      return false;
    }
    setTitleError("");
    setDescriptionError("");
    setCategoryError("");
    setLocationError("");
    return true;
  }
  function submitJob() {
    if (!validateForm()) {
      return false;
    } else {
      setShowModal(true);
      setPostedJob({
        title: jobTitle,
        description: jobDescription,
        category: tradeCategory,
        location: jobLocation,
      });
      setJobStatus("Job Posted");
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Services</h2>
        <p>
          Post a job and receive quotes from local tradespeople in your area.
        </p>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title is-complete">Post a Job</div>
        <div className="form-group">
          <label className="form-label">Job Title</label>
          <input
            className="form-input"
            value={jobTitle}
            onChange={(e) => {
              setJobTitle(e.target.value);
              setTitleError("");
            }}
            placeholder="e.g. Leaking tap repair"
          />
          {titleError && <div className="error">{titleError}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setDescriptionError("");
            }}
            placeholder="Describe the job…"
          />
          {descriptionError && <div className="error">{descriptionError}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Trade Category</label>
          <input
            className="form-input"
            value={tradeCategory}
            onChange={(e) => {
              setTradeCategory(e.target.value);
              setCategoryError("");
            }}
            placeholder="Plumbing / Electrical / Carpentry…"
          />
          {categoryError && <div className="error">{categoryError}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Job Location</label>
          <input
            className="form-input"
            value={jobLocation}
            onChange={(e) => {
              setJobLocation(e.target.value);
              setLocationError("");
            }}
            placeholder="Enter your location…"
          />
          {locationError && <div className="error">{locationError}</div>}
        </div>
        <button className="btn-primary" onClick={submitJob}>
          Post Job
        </button>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Quotes Received</div>
        <div className="placeholder-box">Quotes list — component TBD</div>
      </div>
      <div className="placeholder-section">
        <div
          className="placeholder-section-title"
          style={{ color: jobStatus === "Job Posted" ? "green" : "red" }}
        >
          Job Status: {jobStatus}
        </div>
        <div className="placeholder-bar medium" />
        <div className="placeholder-bar short" />
        {postedJob && (
          <div className="job-status">
            <div>
              <strong>Job Title:</strong> {postedJob.title}
            </div>
            <div>
              <strong>Description:</strong> {postedJob.description}
            </div>
            <div>
              <strong>Category:</strong> {postedJob.category}
            </div>
            <div>
              <strong>Location:</strong> {postedJob.location}
            </div>
          </div>
        )}
      </div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      setLogoutError("Unable to log out. Please try again.");
      setIsLoggingOut(false);
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your personal details and location preferences.</p>
      </div>

      <div className="placeholder-section">
        <div className="placeholder-section-title is-complete">
          Profile Details
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" disabled placeholder="Your Name" />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" disabled placeholder="you@email.com" />
        </div>
      </div>

      <div className="placeholder-section">
        <div className="placeholder-section-title">Location Range Filter</div>
        <div className="placeholder-box">
          Range filter slider — component TBD
        </div>
      </div>

      {logoutError && <div className="error">{logoutError}</div>}

      <button
        type="button"
        className="btn-danger"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "Logging out…" : "Log Out"}
      </button>
    </>
  );
}

// Helper: emoji icon for categories
function getCategoryEmoji(category) {
  const map = {
    "Food & Drink": "\u{1F354}", // hamburger emoji
    Retail: "\u{1F6CD}\u{FE0F}", // shopping bags emoji
    Services: "\u{2702}\u{FE0F}", // scissors emoji
    Health: "\u{1F3E5}", // hospital emoji
    Trades: "\u{1F527}", // wrench emoji
  };
  return map[category] || "\u{1F4CD}"; // map pin emoji
}
