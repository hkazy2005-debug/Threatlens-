import { useEffect, useState } from "react";

interface Incident {
  id: number;
  incident_number: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
}

interface IncidentDetail {
  incident: Incident;
  alerts: any[];
  iocs: any[];
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IncidentDetail | null>(null);

  const loadIncidents = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/incidents", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setIncidents([]);
        setLoading(false);
      });
  };

  const viewIncident = async (id: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:4000/api/incidents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSelected(data);
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const severityColor = (sev: string) => {
    if (sev === "Critical") return "text-red-400";
    if (sev === "High") return "text-orange-400";
    if (sev === "Medium") return "text-amber-400";
    return "text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Incidents</h1>
            <p className="text-slate-400">Investigation case files</p>
          </div>
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to Dashboard
          </a>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <p className="text-slate-400">No incidents yet. Create one from an alert.</p>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="px-5 py-3">Number</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-slate-800/50 text-white">
                    <td className="px-5 py-3 font-mono text-sm">{inc.incident_number}</td>
                    <td className="px-5 py-3">{inc.title}</td>
                    <td className={`px-5 py-3 font-medium ${severityColor(inc.severity)}`}>
                      {inc.severity}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{inc.status}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => viewIncident(inc.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {selected.incident.incident_number}: {selected.incident.title}
            </h2>
            <p className="text-slate-400 text-sm mb-4">{selected.incident.description}</p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-slate-300 font-semibold mb-2">Linked Alerts</h3>
                {selected.alerts.map((a) => (
                  <div key={a.id} className="text-sm text-slate-400 mb-1">
                    • {a.title} ({a.status})
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-slate-300 font-semibold mb-2">Linked IOCs</h3>
                {selected.iocs.map((i) => (
                  <div key={i.id} className="text-sm text-slate-400 mb-1 font-mono">
                    • {i.value} ({i.type})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
