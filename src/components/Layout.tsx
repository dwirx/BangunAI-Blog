import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();
  const isGraphRoute = location.pathname.startsWith("/graph");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${isGraphRoute ? "min-h-0 overflow-hidden" : ""}`}>
        <Outlet />
      </main>
      {!isGraphRoute && <Footer />}
    </div>
  );
}
