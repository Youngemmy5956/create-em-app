import Link from "next/link";
export default function Navbar() {
  return <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between"><Link href="/" className="font-bold text-lg text-white">test-next</Link><div className="flex gap-6 text-sm text-gray-400"><Link href="/" className="hover:text-white transition">Home</Link></div></nav>;
}
