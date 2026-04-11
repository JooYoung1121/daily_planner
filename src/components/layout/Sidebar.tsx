import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settingsStore';

export function Sidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const navOrder = useSettingsStore((s) => s.navOrder);
  const customPages = useSettingsStore((s) => s.customPages);
  const navigate = useNavigate();

  // Merge built-in nav items with custom pages, respecting order
  const orderedItems = useMemo(() => {
    const builtIn = NAV_ITEMS.map((item) => ({
      ...item,
      isCustom: false as const,
    }));
    const custom = customPages
      .filter((p) => p.visible)
      .map((p) => ({
        label: p.label,
        path: p.path,
        icon: FileText, // default icon for custom pages
        isCustom: true as const,
      }));

    const all = [...builtIn, ...custom];

    if (navOrder.length === 0) return all;

    // Sort by navOrder, unordered items go to the end
    return all.sort((a, b) => {
      const ai = navOrder.indexOf(a.path);
      const bi = navOrder.indexOf(b.path);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return 1;
      return ai - bi;
    });
  }, [navOrder, customPages]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <button
          onClick={() => navigate('/')}
          className={cn('flex items-center gap-2 rounded-md hover:opacity-80 transition-opacity', collapsed && 'hidden')}
        >
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">DP</span>
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground">Daily Planner</h1>
        </button>
        {collapsed && (
          <button onClick={() => navigate('/')} className="rounded-lg bg-primary p-1.5 hover:opacity-80 transition-opacity">
            <span className="text-[10px] font-bold text-primary-foreground">DP</span>
          </button>
        )}
        <button onClick={toggleSidebar} className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent">
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {orderedItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}
          </p>
        )}
      </div>
    </aside>
  );
}
