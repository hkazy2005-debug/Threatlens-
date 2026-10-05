import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import PageHeader from "../../components/PageHeader";


interface IOC {
  severity: string;
  type: string;
}
interface Alert {
  severity: string;
  status: string;
}
interface Incident {
  severity: string;
  status: string;
}

export default function Executive() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("http://localhost:4000/api/iocs", { headers }).then((r) => r.json()),
      fetch("http://localhost:4000/api/alerts", { headers }).then((r) => r.json()),
      fetch("http://localhost:4000/api/incidents", { headers }).then((r) => r.json()),
    ])
      .then(([iocsData, alertsData, incidentsData]) => {
        setIocs(Array.isArray(iocsData) ? iocsData : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const countBy = <T,>(items: T[], key: keyof T) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const val = String(item[key]);
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  };

  const severityCounts = countBy(iocs, "severity");
  const maxSeverity = Math.max(1, ...Object.values(severityCounts));
  const severityOrder = ["Critical", "High", "Medium", "Low"];
  const severityBarColor: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-amber-500",
    Low: "bg-slate-500",
  };

  const openIncidents = incidents.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length;
  const openAlerts = alerts.filter((a) => a.status !== "Resolved" && a.status !== "Closed").length;
  const criticalCount = severityCounts["Critical"] || 0;

  const typeCounts = countBy(iocs, "type");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading executive summary...</p>
      </div>
    );
  }

  return (
     
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <PageHeader title="Executive Summary" subtitle="High-level threat posture overview" />

        {/* Top-line numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 p-6">
            <p className="text-slate-400 text-sm mb-1">Total Threats Tracked</p>
            <p className="text-4xl font-bold text-white">{iocs.length}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-red-950 to-slate-900 border border-red-900/50 p-6">
            <p className="text-red-300 text-sm mb-1">Critical Threats</p>
            <p className="text-4xl font-bold text-red-400">{criticalCount}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-900/50 p-6">
            <p className="text-amber-300 text-sm mb-1">Open Investigations</p>
            <p className="text-4xl font-bold text-amber-400">{openIncidents}</p>
          </div>
        </div>

        {/* Threat severity breakdown */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">Threat Severity Breakdown</h2>
          <div className="flex flex-col gap-4">
            {severityOrder.map((sev) => {
              const count = severityCounts[sev] || 0;
              const pct = Math.round((count / maxSeverity) * 100);
              return (
                <div key={sev}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{sev}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${severityBarColor[sev]} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Threat categories */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-white font-semibold mb-4">Threat Categories</h2>
            <div className="flex flex-col gap-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{type}</span>
                  <span className="text-white text-sm font-semibold bg-slate-800 px-3 py-1 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational status */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-white font-semibold mb-4">Operational Status</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Open Alerts</span>
                <span className="text-amber-400 font-semibold">{openAlerts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Open Incidents</span>
                <span className="text-blue-400 font-semibold">{openIncidents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Total Alerts Generated</span>
                <span className="text-white font-semibold">{alerts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Total Incidents Filed</span>
                <span className="text-white font-semibold">{incidents.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
