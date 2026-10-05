import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import Navbar from "../../components/Navbar";
import PageHeader from "../../components/PageHeader";


export default function Dashboard() {
  const [status, setStatus] = useState("Checking backend...");
  const [totalIOCs, setTotalIOCs] = useState<number | null>(null);
  const [criticalIOCs, setCriticalIOCs] = useState<number | null>(null);
  const [severityData, setSeverityData] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Could not reach backend."));

       const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/iocs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setTotalIOCs(data.length);
        setCriticalIOCs(data.filter((ioc: any) => ioc.severity === "Critical").length);

        const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        data.forEach((ioc: any) => {
          if (counts[ioc.severity] !== undefined) counts[ioc.severity]++;
        });
        setSeverityData(Object.entries(counts).map(([name, count]) => ({ name, count })));
      })
      .catch(() => {
        setTotalIOCs(0);
        setCriticalIOCs(0);
      });
  }, []);

  return   (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <PageHeader
          title="ThreatLens Dashboard"
          subtitle="SOC Analyst Overview"
          action={
            <div className="flex gap-3">
              <Link
                to="/iocs"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-500 transition-colors"
              >
                Manage IOCs
              </Link>
              <Link
                to="/alerts"
                className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white font-medium hover:bg-slate-700 transition-colors"
              >
                View Alerts
              </Link>
            </div>
          }
        />

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
          <h2 className="text-white font-semibold mb-4">IOC Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {severityData.map((entry, index) => {
                  const colors: Record<string, string> = {
                    Critical: "#f87171",
                    High: "#fb923c",
                    Medium: "#fbbf24",
                    Low: "#94a3b8",
                  };
                  return <Cell key={index} fill={colors[entry.name]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

               <div className="mt-6 flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              status.includes("running") ? "bg-green-400" : "bg-red-400"
            } animate-pulse`}
          />
          <span className="text-slate-500">{status}</span>
        </div>
      </div>
    </div>
  );
}



