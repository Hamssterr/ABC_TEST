import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, FileText } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/config/navigation";
import { HealthIndicator } from "@/components/shared/health-indicator";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground hover:bg-muted"
          aria-label="Mở menu điều hướng">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-72 p-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full">
        <SheetHeader className="p-5 border-b border-sidebar-border/80 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-white text-base font-bold tracking-tight">
                ABC Quotation
              </SheetTitle>
              <p className="text-xs text-sidebar-foreground/60">
                Hệ thống Báo giá
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-sidebar-foreground/50">
            Quản lý
          </div>
          <nav className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.matchPrefix);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
                  )}
                  aria-current={isActive ? "page" : undefined}>
                  <Icon className="size-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-sidebar-border/80 bg-sidebar/50">
          <HealthIndicator />
        </div>
      </SheetContent>
    </Sheet>
  );
}
