import { useEffect, useState } from "react";
import { Brain, Moon, Sun, Menu, LogOut, User as UserIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const NAV = ["Home", "Features", "Languages", "Research", "About"];

export function SiteHeader() {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:flex lg:justify-between">
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-soft">
            <Brain className="h-5 w-5" />
          </span>
          <span className="truncate font-display text-lg font-bold">AI News Summarizer</span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-secondary/50 text-xs font-medium">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-primary font-bold">
                  {user.name ? user.name[0].toUpperCase() : <UserIcon className="h-3 w-3" />}
                </span>
                <span className="truncate max-w-[120px] font-semibold text-foreground">
                  {user.name || user.email}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" title="Verified Account" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                onClick={() => openAuthModal("signin")}
              >
                Login
              </Button>
              <Button
                className="hidden bg-gradient-brand shadow-soft sm:inline-flex"
                onClick={() => openAuthModal("signup")}
              >
                Sign Up
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="animate-fade-in border-t border-border bg-background px-4 py-3 lg:hidden space-y-3">
          <div className="space-y-1">
            {NAV.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex gap-2">
            {isAuthenticated ? (
              <Button variant="outline" className="w-full gap-2 text-destructive" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sign Out ({user?.name || "Account"})
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); openAuthModal("signin"); }}>
                  Login
                </Button>
                <Button className="flex-1 bg-gradient-brand" onClick={() => { setOpen(false); openAuthModal("signup"); }}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
