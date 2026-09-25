import { FileText } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            ABC Quotation
          </span>
        </div>
      </div>

      <MobileSidebar />
    </header>
  );
}
