import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";

const Index = lazy(() => import("./pages/Index"));
const Writing = lazy(() => import("./pages/Writing"));
const Articles = lazy(() => import("./pages/Articles"));
const Read = lazy(() => import("./pages/Read"));
const ReadDetail = lazy(() => import("./pages/ReadDetail"));
const About = lazy(() => import("./pages/About"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/writing" element={<Writing />} />
              <Route path="/writing/:slug" element={<ArticleDetail />} />
              <Route path="/artikel" element={<Articles />} />
              <Route path="/artikel/:slug" element={<ArticleDetail />} />
              <Route path="/read" element={<Read />} />
              <Route path="/read/:slug" element={<ReadDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
