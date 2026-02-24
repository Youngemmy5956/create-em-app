import { Link } from "react-router-dom";
export default function Navbar() {
  return <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-950"><Link to="/" className="font-bold text-lg text-white">test-react</Link><div className="flex gap-6 text-sm text-gray-400"><Link to="/" className="hover:text-white transition">Home</Link></div></nav>;
}
