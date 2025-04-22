// App.tsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";  // Asume que tienes un componente de Login

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />  {/* Ruta para Login */}
        <Route path="/dashboard" element={<Dashboard />} />  {/* Ruta para el Dashboard */}
      </Routes>
    </Router>
  );
};

export default App;
