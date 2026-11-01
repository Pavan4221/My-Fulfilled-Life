import React from 'react';
import { useApp } from '../context/AppContext';
import { ViewType } from '../types';

interface TileDef {
  id: ViewType;
  title: string;
  icon: string;
  description: string;
  actionText: string;
  bgClass: string;
}

const tiles: TileDef[] = [
  {
    id: 'checkin',
    title: 'Daily Check-In',
    icon: '☀️',
    description: 'Intentions, gratitude and reflection',
    actionText: 'Open Check-In →',
    bgClass: 'bg-[#e7f2e8] hover:bg-[#dceddd]'
  },
  {
    id: 'journal',
    title: 'Journal',
    icon: '✎',
    description: 'Capture thoughts and moments to remember',
    actionText: 'Write in Journal →',
    bgClass: 'bg-[#efebfa] hover:bg-[#e4ddf6]'
  },
  {
    id: 'insights',
    title: 'Insights',
    icon: '✧',
    description: 'Notice your wellbeing patterns over time',
    actionText: 'Explore Insights →',
    bgClass: 'bg-[#fbf1dd] hover:bg-[#f5e6c7]'
  },
  {
    id: 'intentions',
    title: 'My Intentions',
    icon: '🌱',
    description: 'Shape a list that feels meaningful to you',
    actionText: 'Manage Intentions →',
    bgClass: 'bg-[#fffdf8] hover:bg-[#f6f2e8]'
  },
  {
    id: 'ai',
    title: 'AI Companion',
    icon: '✧',
    description: 'A gentle partner for reflection',
    actionText: 'Open Companion →',
    bgClass: 'bg-[#e5f0ef] hover:bg-[#d4e7e5]'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙',
    description: 'Your account and personal data',
    actionText: 'Open Settings →',
    bgClass: 'bg-[#f0f0e9] hover:bg-[#e3e3da]'
  }
];

export const HomeView: React.FC = () => {
  const {
    user,
    habits,
    dayData,
    syncStatus,
    signOutUser,
    setActiveView,
    allCompleted
  } = useApp();

  const count = dayData.checks.length;
  const total = Math.max(habits.length, 1);
  const percent = Math.round((count / total) * 100);

  return (
    <div className="space-y-4">
      {/* Overview Welcome Card */}
      <section className="card-calm p-5 sm:p-6 bg-transparent border-0 shadow-none !p-0">
        <div className="welcome-gradient p-5 sm:p-7 rounded-[22px] border border-[#d8e5df] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5a7065]">
              YOUR SPACE, YOUR PACE
            </div>
            <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#123f3c] my-1.5 leading-snug">
              A fulfilled life is made of little moments.
            </h2>
            <p className="text-sm text-[#5d6b63]">
              There is no perfect score to reach. Start wherever you are today.
            </p>
          </div>

          <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#d0ded6]">
            <strong className="block text-sm font-semibold text-[#1f3833]">
              {user?.displayName || user?.email || 'Mindful Friend'}
            </strong>
            <div
              className={`text-xs my-1 ${
                syncStatus.isError ? 'text-amber-800' : 'text-[#64756c]'
              }`}
            >
              {syncStatus.text}
            </div>
            <button
              onClick={signOutUser}
              className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-[#e5ede4] hover:bg-[#d6e3d5] text-[#303b35] font-medium transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {/* Summary Stats Card */}
      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-[#e5ede4] rounded-2xl p-4">
            <strong className="block font-serif-title text-2xl sm:text-3xl text-[#20362c]">
              {count}/{habits.length}
            </strong>
            <span className="text-xs text-[#67756b]">intentions tended today</span>
          </div>

          <div className="bg-[#e5ede4] rounded-2xl p-4">
            <strong className="block font-serif-title text-2xl sm:text-3xl text-[#20362c]">
              {percent}%
            </strong>
            <span className="text-xs text-[#67756b]">of today's intentions</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#ecebe4] rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-[#718b78] transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        {allCompleted && (
          <div className="mt-3 text-xs text-[#4b6a55] font-serif-title italic text-center">
            You've tended all your gentle intentions today. Well done! 🌿
          </div>
        )}
      </section>

      {/* Home Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => {
              setActiveView(tile.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`
              ${tile.bgClass} card-calm p-5 sm:p-6 text-left flex flex-col justify-between
              min-h-[160px] sm:min-h-[190px] border border-[#e4e7dd] transition-all duration-150 cursor-pointer group shadow-sm hover:shadow-md
            `}
          >
            <div>
              <span className="text-2xl mb-2 block">{tile.icon}</span>
              <strong className="block font-serif-title text-xl text-[#194b45] font-semibold group-hover:text-[#0b3833]">
                {tile.title}
              </strong>
              <span className="text-xs sm:text-sm text-[#687a73] mt-1 block">
                {tile.description}
              </span>
            </div>

            <em className="not-italic text-xs font-bold text-[#194b45] mt-4 flex items-center gap-1">
              {tile.actionText}
            </em>
          </button>
        ))}
      </div>
    </div>
  );
};
