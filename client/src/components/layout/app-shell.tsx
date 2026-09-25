import { Outlet } from "react-router-dom";
import { DesktopSidebar } from "./desktop-sidebar";
import { Topbar } from "./topbar";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (240px) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Topbar */}
        <Topbar />

        {/* Content Outlet */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
