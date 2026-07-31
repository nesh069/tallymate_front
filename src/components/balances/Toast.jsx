export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-indigo-500 text-white px-4 py-3 rounded-lg shadow-lg">
      {message}
      <button onClick={onClose} className="ml-3 text-zinc-200">✕</button>
    </div>
  );
}