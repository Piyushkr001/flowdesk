// app/dashboard/layout.tsx
import * as React from "react";
import DashboardSidebar from "./_components/SideBar";

export default function DashBoardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="w-full">
      {/* Container: full width on mobile, centered & bounded on lg+ */}
      <div className="mx-auto w-full lg:max-w-7xl">
        {/* Mobile: stack. Desktop: side-by-side */}
        <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:gap-6 lg:pt-6">
          {/* Sidebar wrapper:
              - On mobile it stays on top
              - On desktop it becomes sticky for better UX */}
          <aside className="w-full lg:w-70 lg:shrink-0 lg:sticky lg:top-6">
            <DashboardSidebar />
          </aside>

          {/* Content area */}
          <main className="min-w-0 flex-1 pb-10 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
