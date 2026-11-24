import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Swords,
  FlaskConical,
  GraduationCap,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/challenges', label: 'Challenges', icon: Swords },
    { to: '/app/lab', label: 'Lab Mode', icon: FlaskConical },
    { to: '/app/learn', label: 'Learn', icon: GraduationCap },
    { to: '/app/achievements', label: 'Achievements', icon: Trophy },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'border-r border-border bg-surface flex flex-col transition-[width] duration-150 ease-out select-none z-20',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group relative',
                  isActive
                    ? 'bg-surface-raised text-text-primary border border-border/80'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/60 border border-transparent'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 text-text-muted group-hover:text-text-primary" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-xs text-text-muted hover:text-text-secondary hover:bg-surface-raised border border-transparent hover:border-border transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
