import { Link } from "react-router-dom";
export default function NotFound() {
  return <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white"><h1 className="text-6xl font-bold mb-4">404</h1><p className="text-gray-400 mb-6">Page not found.</p><Link to="/" className="text-blue-400 hover:underline">Go home</Link></main>;
}
