import { useEffect, useState } from "react";

interface IOC {
  id: number;
  value: string;
  type: string;
  severity: string;
  confidence: number;
  status: string;
  created_at: string;
}

export default function IOCManagement() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [value, setValue] = useState("");
  const [type, setType] = useState("IP");
  const [severity, setSeverity] = useState("Medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    const loadIOCs = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/iocs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIocs(data);
        } else {
          setIocs([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setIocs([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadIOCs();
  }, []);

    const handleAddIOC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setError("");

    const res = await fetch("http://localhost:4000/api/iocs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, type, severity, confidence: 50 }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add IOC");
      return;
    }

    setValue("");
    loadIOCs();
  };

  const severityColor = (sev: string) => {
    if (sev === "Critical") return "text-red-400";
    if (sev === "High") return "text-orange-400";
    if (sev === "Medium") return "text-amber-400";
    return "text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-1">IOC Management</h1>
        <p className="text-slate-400 mb-8">Manage indicators of compromise</p>

        {/* Add IOC Form */}
        <form
          onSubmit={handleAddIOC}
          className="rounded-xl bg-slate-900 border border-slate-800 p-5 mb-8 flex flex-wrap gap-3 items-end"
        >
                    {error && (
            <div className="w-full rounded-lg bg-red-950 border border-red-800 px-4 py-2 text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-slate-300 mb-1">IOC Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 45.10.20.30"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>IP</option>
              <option>Domain</option>
              <option>URL</option>
              <option>MD5</option>
              <option>SHA-1</option>
              <option>SHA-256</option>
              <option>Email</option>
              <option>CVE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Add IOC
          </button>
        </form>

        {/* IOC Table */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          {loading ? (
            <p className="text-slate-400 p-5">Loading IOCs...</p>
          ) : iocs.length === 0 ? (
            <p className="text-slate-400 p-5">No IOCs yet. Add one above.</p>
          ) : (
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
                {iocs.map((ioc) => (
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
          )}
        </div>
      </div>
    </div>
  );
}

