import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-heading font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Halaman tidak ditemukan</p>
        <a href="/" className="text-accent text-sm underline hover:opacity-80">
          Kembali ke Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
