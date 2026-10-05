import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/iocs", label: "IOCs" },
    { to: "/alerts", label: "Alerts" },
    { to: "/incidents", label: "Incidents" },
    { to: "/hunting", label: "Hunting" },
    { to: "/executive", label: "Executive" },
    { to: "/audit-logs", label: "Audit Logs" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-lg">ThreatLens</span>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === link.to
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}
