import React from 'react';
import { useApp } from '../context/AppContext';
import { APP_VERSION } from '../version';

export const Header: React.FC = () => {
  const { todayFormatted } = useApp();

  return (
    <header className="pt-6 pb-4 px-1">
      <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#778078]">
        A gentle check-in · {todayFormatted}
      </div>
      <h1 className="font-serif-title font-medium text-3xl sm:text-4xl tracking-tight my-2 text-[#24332b] flex items-center gap-2">
        <span>My Fulfilled Life</span>
        <span aria-hidden="true" className="text-2xl sm:text-3xl">🌿</span>
      </h1>
      <div className="text-[#778078] text-sm">
        Live well. Be grateful. Enjoy the little things.
      </div>
      <div className="text-[10px] text-[#9a9b91] font-mono mt-2" aria-label={`App version ${APP_VERSION}`}>
        v{APP_VERSION}
      </div>
    </header>
  );
};
