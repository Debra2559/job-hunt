import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Compass, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f7f6f1] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Number */}
        <div className="relative inline-block mb-8">
          <div className="text-[140px] leading-none font-serif font-light text-emerald-900 tracking-tight select-none">
            404
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-emerald-700/40" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3 text-emerald-800">
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-xs tracking-[0.3em] uppercase">Lost in the map</span>
        </div>

        <h1 className="text-2xl font-medium text-stone-900 mb-3">
          这条路径还没有铺好
        </h1>
        <p className="text-stone-500 text-sm mb-1 font-mono">
          {location.pathname}
        </p>
        <p className="text-stone-600 mb-10 leading-relaxed">
          看起来你走到了地图之外。回到主线，继续你的旅程。
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-900 hover:bg-emerald-800 text-white text-sm rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          回到职业地图
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
