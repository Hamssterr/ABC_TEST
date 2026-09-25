import { Link, useLocation } from "react-router-dom";
import { FileText } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/config/navigation";
import { HealthIndicator } from "@/components/shared/health-indicator";
import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const location = useLocation();

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen sticky top-0 h-screen select-none"
      aria-label="Thanh điều hướng chính">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/80">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0">
          <FileText className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-base text-white tracking-tight leading-tight truncate">
            ABC Quotation
          </span>
          <span className="text-xs text-sidebar-foreground/60 leading-tight">
            Hệ thống Báo giá
          </span>
        </div>
      </div>

      {/* Navigation section */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div>
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
                  )}
                  aria-current={isActive ? "page" : undefined}>
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-white" : "text-sidebar-foreground/70",
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer with Health Indicator */}
      <div className="p-3 border-t border-sidebar-border/80 bg-sidebar/50">
        <HealthIndicator />
      </div>
    </aside>
  );
}
