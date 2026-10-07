import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, ShieldAlert, Sliders, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Monitor', path: '/monitor', icon: Activity },
    { name: 'Investigate', path: '/investigate', icon: ShieldAlert },
    { name: 'Configure', path: '/configure', icon: Sliders },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-[#121821] border-r border-[#243041] transition-all duration-300 select-none z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#243041] h-16 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0 shadow-sm shadow-teal-500/10">
          <ShieldCheck className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight text-[#E6EDF3] truncate">
              SentinelVision AI
            </span>
            <span className="text-[10px] font-mono text-[#8B98A9] uppercase tracking-wider">
              Safety Console
            </span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 font-semibold shadow-sm'
                    : 'text-[#8B98A9] hover:text-[#E6EDF3] hover:bg-[#18202B]'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* One-line USP badge at bottom of sidebar when expanded */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-[#18202B]/80 border border-[#243041] text-[11px] text-[#8B98A9] leading-relaxed">
          <p className="font-semibold text-teal-400 text-xs mb-1">SentinelVision AI</p>
          "Doesn't just detect workers — explains unsafe behaviour over time."
        </div>
      )}

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-[#243041] flex items-center justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#8B98A9] hover:text-[#E6EDF3] hover:bg-[#18202B] transition-colors w-full flex items-center justify-center"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
