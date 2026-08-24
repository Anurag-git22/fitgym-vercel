import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
// layout.css is imported globally via src/styles/global.css

/**
 * DashboardLayout
 * Wraps all protected pages with the sidebar + topbar shell.
 * Sidebar can be collapsed (desktop) or toggled (mobile).
 */
export default function DashboardLayout({ children }) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  return (
    <div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="app-main">
        <Topbar onMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
