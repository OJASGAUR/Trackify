import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { StoreProvider } from "@/hooks/use-store";
import { Sidebar, MobileNav } from "@/components/layout";
import Calendar from "@/pages/calendar";
import ProgressDashboard from "@/pages/progress";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/progress" component={ProgressDashboard} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pb-16 md:pb-0">
                <Router />
              </main>
              <MobileNav />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
