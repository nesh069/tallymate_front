import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-zinc-400 mb-6">Page not found</p>
      <Link to="/" className="text-indigo-500 hover:text-indigo-400 underline">
        Go home
      </Link>
    </div>
  );
}
