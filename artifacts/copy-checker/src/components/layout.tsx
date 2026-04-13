import { Link, useLocation } from "wouter";
import { Calendar as CalendarIcon, CheckSquare, Settings, ClipboardCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Calendar", icon: CalendarIcon },
    { href: "/mark-check", label: "Mark as Checked", icon: ClipboardCheck },
    { href: "/progress", label: "Progress", icon: CheckSquare },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/about", label: "About", icon: Heart },
  ];

  return (
    <div className="w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-primary flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          Trackify
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Copy Checker</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover-elevate"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6">
        <div className="bg-sidebar-accent rounded-xl p-4">
          <p className="text-xs text-sidebar-accent-foreground font-medium mb-1">Quote of the day</p>
          <p className="text-sm text-sidebar-foreground italic">"Teaching is the greatest act of optimism."</p>
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const links = [
    { href: "/", label: "Calendar", icon: CalendarIcon },
    { href: "/mark-check", label: "Mark as Checked", icon: ClipboardCheck },
    { href: "/progress", label: "Progress", icon: CheckSquare },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/about", label: "About", icon: Heart },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background pb-safe z-50">
      <div className="flex justify-around p-2">
        {links.map((link) => {
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg min-w-[4rem]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <link.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
