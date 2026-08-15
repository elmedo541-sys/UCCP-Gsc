import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider} from "react-router-dom";
import { routers } from "./router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";

const queryClient = new QueryClient();

const App = () => {
  const [router] = useState(() => createBrowserRouter(routers));
  // Admin pages render their own theme control inside a Settings menu in the
  // header, so the floating global toggle is hidden there to avoid
  // overlapping the header's other icons (Password, Logout, etc.) on mobile.
  const [pathname, setPathname] = useState(router.state.location.pathname);
  useEffect(() => router.subscribe(state => setPathname(state.location.pathname)), [router]);
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!isAdminRoute && <ThemeToggle />}
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
};

export default App;
