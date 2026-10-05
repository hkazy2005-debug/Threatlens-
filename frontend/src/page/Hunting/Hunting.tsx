import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import PageHeader from "../../components/PageHeader";

interface IOC {
  id: number;
  value: string;
  type: string;
  severity: string;
  confidence: number;
  status: string;
}

export default function Hunting() {
  const [allIOCs, setAllIOCs] = useState<IOC[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/iocs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAllIOCs(Array.isArray(data) ? data : []))
      .catch(() => setAllIOCs([]));
  }, []);

  const filtered = allIOCs.filter((ioc) => {
    const matchesSearch = ioc.value.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || ioc.type === typeFilter;
    const matchesSeverity = severityFilter === "All" || ioc.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const severityColor = (sev: string) => {
    if (sev === "Critical") return "text-red-400";
    if (sev === "High") return "text-orange-400";
    if (sev === "Medium") return "text-amber-400";
    return "text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <PageHeader title="Threat Hunting" subtitle="Search and filter all known indicators" />

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IOC value..."
            className="flex-1 min-w-[200px] rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
          >
            <option>All</option>
            <option>IP</option>
            <option>Domain</option>
            <option>URL</option>
            <option>MD5</option>
            <option>SHA-1</option>
            <option>SHA-256</option>
            <option>Email</option>
            <option>CVE</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        <p className="text-slate-400 text-sm mb-3">
          {filtered.length} of {allIOCs.length} indicators shown
        </p>

        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ioc) => (
                <tr key={ioc.id} className="border-b border-slate-800/50 text-white">
                  <td className="px-5 py-3 font-mono text-sm">{ioc.value}</td>
                  <td className="px-5 py-3">{ioc.type}</td>
                  <td className={`px-5 py-3 font-medium ${severityColor(ioc.severity)}`}>
                    {ioc.severity}
                  </td>
                  <td className="px-5 py-3">{ioc.confidence}%</td>
                  <td className="px-5 py-3 text-slate-300">{ioc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
