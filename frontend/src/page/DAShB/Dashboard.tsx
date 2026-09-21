import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [status, setStatus] = useState("Checking backend...");
  const [totalIOCs, setTotalIOCs] = useState<number | null>(null);
  const [criticalIOCs, setCriticalIOCs] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Could not reach backend."));

    fetch("http://localhost:4000/api/iocs")
      .then((res) => res.json())
      .then((data) => {
        setTotalIOCs(data.length);
        setCriticalIOCs(data.filter((ioc: any) => ioc.severity === "Critical").length);
      })
      .catch(() => {
        setTotalIOCs(0);
        setCriticalIOCs(0);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">ThreatLens Dashboard</h1>
            <p className="text-slate-400">SOC Analyst Overview</p>
          </div>
          <Link
            to="/iocs"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            Manage IOCs
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Total IOCs</p>
            <p className="text-3xl font-bold text-white mt-1">
              {totalIOCs === null ? "—" : totalIOCs}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Critical IOCs</p>
            <p className="text-3xl font-bold text-red-400 mt-1">
              {criticalIOCs === null ? "—" : criticalIOCs}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Active Alerts</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">—</p>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Open Incidents</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">—</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-slate-400 text-sm">Backend Connection Status</p>
          <p className="text-white mt-1">{status}</p>
        </div>
      </div>
    </div>
  );
}

 