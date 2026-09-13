"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Menu } from "lucide-react";
import { brand } from "@/config/brand";
import { mainNav, routes } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Responsive site header. Mobile-first: logo + actions always visible,
 * full navigation appears from `sm` up (bottom tab bar lands in Phase 2).
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href={routes.home}
          className="focus-ring rounded-md"
          aria-label={`${brand.name} — home`}
        >
          <Logo size={30} />
        </Link>

        {/* Desktop nav */}
        <TooltipProvider delayDuration={200}>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {mainNav.map((item) => {
              if (item.soon) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <span
                        aria-disabled="true"
                        className="flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground/70"
                      >
                        {item.label}
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                          Soon
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Planned for Phase {item.phase} — will activate once the
                      Knowledge Base is connected.
                    </TooltipContent>
                  </Tooltip>
                );
              }
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-secondary font-medium text-secondary-foreground"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </TooltipProvider>

        <div className="flex items-center gap-1.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden border-gold/50 text-gold-foreground hover:bg-gold/10 hover:text-gold-foreground sm:inline-flex"
          >
            <Link href={routes.download}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Get the App
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="border-gold/50 text-gold-foreground hover:bg-gold/10 sm:hidden"
            aria-label="Download the Android app"
          >
            <Link href={routes.download}>
              <Download className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <ThemeToggle />
          {/* Mobile menu placeholder — real sheet navigation lands in Phase 2 */}
          <span className="md:hidden" aria-hidden="true">
            <Button variant="ghost" size="icon" disabled aria-label="Menu (coming in Phase 2)">
              <Menu className="h-5 w-5" />
            </Button>
          </span>
        </div>
      </div>
    </header>
  );
}
