import Image from "next/image";
import TradingDataVisualization from "./components/TradingDataVisualization";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <TradingDataVisualization />
    </div>
  );
}
