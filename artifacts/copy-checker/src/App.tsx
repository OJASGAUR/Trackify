import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import About from "@/pages/about";

import { StoreProvider } from "@/hooks/use-store";
import { Sidebar, MobileNav } from "@/components/layout";
import Calendar from "@/pages/calendar";
import ProgressDashboard from "@/pages/progress";
import MarkCheck from "@/pages/mark-check";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/mark-check" component={MarkCheck} />
      <Route path="/progress" component={ProgressDashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/about" component={About} />
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
            <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden justify-center">
              <div className="flex w-full max-w-[1280px] min-h-full">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative flex flex-col pb-24 md:pb-0">
                  <Router />
                </main>
                <MobileNav />
              </div>
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
