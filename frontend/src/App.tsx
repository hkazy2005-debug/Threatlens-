import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from"./page/LOGINpage/Login";
import Dashboard from "./page/DAShB/Dashboard";
import IOCManagement from "./page/IOCs/IOCManagement";
import Alerts from "./page/Alerts/Alerts";
import Incidents from "./page/Incidents/Incidents";
import Hunting from "./page/Hunting/Hunting";

function App() {
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/iocs" element={<IOCManagement />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/hunting" element={<Hunting />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;







