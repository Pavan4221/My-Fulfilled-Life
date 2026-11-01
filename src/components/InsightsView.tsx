import React from 'react';
import { useApp } from '../context/AppContext';

export const InsightsView: React.FC = () => {
  const { habits, dayData, journal, setActiveView } = useApp();

  const totalHabits = habits.length;
  const completedToday = dayData.checks.length;
  const hasGratitudeToday = Boolean(dayData.gratitude?.trim());
  const hasReflectionToday = Boolean(dayData.reflection?.trim());
  const totalJournalEntries = journal.length;

  return (
    <div className="space-y-4">
      {/* View Heading */}
      <div className="py-2 px-1">
        <button
          onClick={() => setActiveView('home')}
          className="mb-3 px-3 py-1.5 rounded-xl bg-[#e5ede4] hover:bg-[#d8e3d6] text-[#30433a] text-xs font-semibold cursor-pointer transition-colors"
        >
          ← Home
        </button>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#778078]">
          YOUR WELLBEING RHYTHM
        </div>
        <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#1f3833] mt-1 mb-1">
          Insights
        </h2>
        <p className="text-sm text-[#778078]">
          Notice your wellbeing patterns over time — without turning life into a scorecard.
        </p>
      </div>

      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <h3 className="font-serif-title text-xl text-[#243b33] mb-2">Today's mindful rhythm</h3>
        <p className="text-sm text-[#67756b] leading-relaxed mb-5">
          Your quieter days matter just as much as your active days. Life isn't a checklist; it's a flow.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#e7f2e8] border border-[#d5e2d6]">
            <div className="text-xs uppercase font-bold tracking-wider text-[#496a56]">Intentions Tended</div>
            <div className="font-serif-title text-2xl text-[#194034] mt-1 font-semibold">
              {completedToday} of {totalHabits}
            </div>
            <div className="text-xs text-[#5f7869] mt-1">Gentle actions for your day</div>
          </div>

          <div className="p-4 rounded-xl bg-[#efebfa] border border-[#dfd7f2]">
            <div className="text-xs uppercase font-bold tracking-wider text-[#5f498c]">Gratitude & Presence</div>
            <div className="font-serif-title text-2xl text-[#392461] mt-1 font-semibold">
              {hasGratitudeToday && hasReflectionToday
                ? 'Both written'
                : hasGratitudeToday || hasReflectionToday
                ? 'Started'
                : 'Ready when you are'}
            </div>
            <div className="text-xs text-[#6e5899] mt-1">Reflections captured today</div>
          </div>

          <div className="p-4 rounded-xl bg-[#fbf1dd] border border-[#ede0c5]">
            <div className="text-xs uppercase font-bold tracking-wider text-[#826127]">Journal Memories</div>
            <div className="font-serif-title text-2xl text-[#573e13] mt-1 font-semibold">
              {totalJournalEntries} {totalJournalEntries === 1 ? 'entry' : 'entries'}
            </div>
            <div className="text-xs text-[#8c6e3b] mt-1">Recorded in your sanctuary</div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[#f4f2eb] border border-[#e8e5dc] text-sm text-[#5d6860] font-serif-title italic text-center">
          "Rest is not a reward for having worked; it is a fundamental need for living well. Be where your feet are."
        </div>
      </section>
    </div>
  );
};
