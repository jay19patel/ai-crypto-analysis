import Image from "next/image";
import Link from "next/link";
import TradingDataVisualization from "./components/TradingDataVisualization";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">📊 Trading Dashboard</h1>
          <Link 
            href="/account"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2"
          >
            <span>💰</span>
            <span>My Account</span>
          </Link>
        </div>
      </div>
      <TradingDataVisualization />
    </div>
  );
}
