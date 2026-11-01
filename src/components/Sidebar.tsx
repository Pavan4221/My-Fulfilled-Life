import React, { useState } from 'react';
import { ViewType } from '../types';
import { useApp } from '../context/AppContext';

interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'checkin', label: 'Check-In', icon: '☑' },
  { id: 'journal', label: 'Journal', icon: '▤' },
  { id: 'ai', label: 'AI Companion', icon: '✧' },
  { id: 'intentions', label: 'My Intentions', icon: '🌱' },
  { id: 'insights', label: 'Insights', icon: '✦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useApp();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleNavClick = (view: ViewType) => {
    setActiveView(view);
    setMobileExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mobile Backdrop when expanded */}
      {mobileExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      <aside
        className={`
          sidebar-gradient text-[#f4fbf8] shadow-xl transition-all duration-200 z-30
          /* Mobile styling: fixed on left */
          max-md:fixed max-md:left-2 max-md:top-3 max-md:bottom-3 max-md:rounded-2xl max-md:flex max-md:flex-col
          ${mobileExpanded ? 'max-md:w-[210px] max-md:p-3' : 'max-md:w-[52px] max-md:p-2'}
          /* Desktop styling: sticky column */
          md:sticky md:top-4 md:flex md:flex-col md:w-[230px] lg:w-[260px] md:min-h-[calc(100vh-120px)] md:p-5 md:rounded-3xl
        `}
        aria-label="App Navigation"
      >
        {/* Mobile Toggle Button */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 mx-auto mb-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-lg transition-colors cursor-pointer"
          onClick={() => setMobileExpanded((prev) => !prev)}
          aria-label={mobileExpanded ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={mobileExpanded}
        >
          {mobileExpanded ? '‹' : '☰'}
        </button>

        {/* Brand Mark */}
        <div className="text-center pb-4 md:pb-6 font-serif-title">
          <div
            className={`
              mark-gradient mx-auto rounded-full grid place-items-center text-white font-bold border-2 border-white/60 shadow-sm
              ${mobileExpanded ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs md:w-[72px] md:h-[72px] md:text-2xl'}
              transition-all
            `}
          >
            MFL
          </div>
          <div
            className={`
              mt-2 font-medium tracking-tight text-[#eaf5f1] text-sm md:text-base md:block
              ${mobileExpanded ? 'block' : 'hidden'}
            `}
          >
            My Fulfilled Life
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`
                  flex items-center gap-3 rounded-xl transition-all font-medium cursor-pointer text-left
                  ${mobileExpanded ? 'px-3 py-2.5 justify-start' : 'p-2 justify-center md:px-3 md:py-2.5 md:justify-start'}
                  ${
                    isSelected
                      ? 'bg-white/25 text-white shadow-xs font-semibold'
                      : 'text-[#eaf5f1]/80 hover:bg-white/15 hover:text-white'
                  }
                `}
              >
                <span className="w-6 text-center text-lg shrink-0">{item.icon}</span>
                <span
                  className={`text-sm whitespace-nowrap md:inline ${
                    mobileExpanded ? 'inline' : 'hidden'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`
            mt-auto pt-4 border-t border-white/20 text-[#d7e8e2] text-xs font-serif-title italic md:block
            ${mobileExpanded ? 'block px-1' : 'hidden'}
          `}
        >
          Be where your feet are. ♡
        </div>
      </aside>
    </>
  );
};
