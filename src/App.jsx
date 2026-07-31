import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FriendsPage } from "./pages/FriendsPage";
import { GroupDetail } from "./pages/GroupDetail";
import { GroupsPage } from "./pages/GroupsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SignupPage } from "./pages/SignupPage";

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/signup' element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path='/profile' element={<ProfilePage />} />
        <Route path='/friends' element={<FriendsPage />} />
        <Route path='/groups' element={<GroupsPage />} />
        <Route path='/groups/:groupId' element={<GroupDetail />} />
      </Route>
      <Route path='/' element={<Navigate to='/profile' replace />} />
      <Route path='*' element={<Navigate to='/profile' replace />} />
    </Routes>
  );
}
