import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("http://localhost:4000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Could not reach backend."));
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h1>ThreatLens Dashboard</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}


