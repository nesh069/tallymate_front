import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import GroupDetail from "./pages/GroupDetail";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Balances from "./pages/Balances";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/groups/:groupId/balances" element={<Balances />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
