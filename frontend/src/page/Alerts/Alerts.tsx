import { useEffect, useState } from "react";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  priority: string;
  status: string;
  ioc_value: string;
  ioc_type: string;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/alerts", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setAlerts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:4000/api/alerts/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    loadAlerts();
  };

  const severityColor = (sev: string) => {
    if (sev === "Critical") return "text-red-400 border-red-800 bg-red-950";
    if (sev === "High") return "text-orange-400 border-orange-800 bg-orange-950";
    if (sev === "Medium") return "text-amber-400 border-amber-800 bg-amber-950";
    return "text-slate-400 border-slate-700 bg-slate-800";
  };

  const statusColor = (status: string) => {
    if (status === "New") return "bg-blue-600";
    if (status === "Acknowledged") return "bg-amber-600";
    if (status === "In Progress") return "bg-purple-600";
    if (status === "Resolved") return "bg-green-600";
    return "bg-slate-600";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Alerts</h1>
            <p className="text-slate-400">Actionable security alerts from correlation</p>
          </div>
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to Dashboard
          </a>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-slate-400">No alerts yet. Run correlation to generate alerts.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-5 ${severityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${statusColor(alert.status)} text-white`}>
                        {alert.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">{alert.title}</h3>
                    <p className="text-sm opacity-80 mb-3">{alert.description}</p>
                    <p className="text-xs text-slate-400">
                      IOC: <span className="font-mono">{alert.ioc_value}</span> ({alert.ioc_type}) · Priority: {alert.priority}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {["New", "Acknowledged", "In Progress", "Resolved", "Closed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(alert.id, s)}
                      disabled={alert.status === s}
                      className={`text-xs px-3 py-1 rounded-lg border ${
                        alert.status === s
                          ? "bg-slate-700 border-slate-600 text-slate-400 cursor-default"
                          : "border-slate-600 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


