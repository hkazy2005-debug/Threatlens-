import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import PageHeader from "../../components/PageHeader";

interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  resource: string;
  result: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/audit-logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLogs([]);
        setLoading(false);
      });
  }, []);

  const actionColor = (action: string) => {
    if (action === "LOGIN") return "bg-blue-950 text-blue-300 border-blue-800";
    if (action.includes("CREATE")) return "bg-green-950 text-green-300 border-green-800";
    if (action.includes("UPDATE")) return "bg-amber-950 text-amber-300 border-amber-800";
    if (action.includes("DELETE")) return "bg-red-950 text-red-300 border-red-800";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

   return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <PageHeader title="Audit Logs" subtitle="Record of security-relevant actions" />

        {loading ? (
          <p className="text-slate-400">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-400">No audit logs yet.</p>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 text-white">
                    <td className="px-5 py-3 text-sm text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm">{log.user_email || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded border ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400 font-mono">{log.resource || "—"}</td>
                    <td className="px-5 py-3 text-sm text-green-400">{log.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
