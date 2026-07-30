import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Balances from "./pages/Balances";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationBell from "./components/NotificationBell";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex items-center justify-between px-6 py-3 bg-zinc-900 text-zinc-100">
        <Link to="/" className="text-lg font-semibold">
          TallyMate
        </Link>
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </nav>

      <Routes>
        <Route
          path="/groups/:groupId/balances"
          element={
            <ProtectedRoute>
              <Balances />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
