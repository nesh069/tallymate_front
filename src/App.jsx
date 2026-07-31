import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProfilePage } from "./pages/ProfilePage";
import { FriendsPage } from "./pages/FriendsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupDetail } from "./pages/GroupDetail";
import Balances from "./pages/Balances";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/groups/:groupId/balances" element={<Balances />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
