import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <form style={{ display: "flex", flexDirection: "column", gap: "12px", width: "300px" }}>
        <h1>ThreatLens Login</h1>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Log In</button>
        <Link to="/dashboard">Go to Dashboard (temporary link)</Link>
      </form>
    </div>
  );
}
