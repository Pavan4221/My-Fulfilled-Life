import React from 'react';
import { useApp } from '../context/AppContext';

export const CheckInView: React.FC = () => {
  const {
    habits,
    intentionsList,
    dayData,
    toggleHabit,
    updateGratitude,
    updateReflection,
    dayStatus,
    setActiveView
  } = useApp();

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
          A MOMENT FOR YOURSELF
        </div>
        <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#1f3833] mt-1 mb-1">
          Daily Check-In
        </h2>
        <p className="text-sm text-[#778078]">
          Notice what matters today — intentions, gratitude and reflection.
        </p>
      </div>

      {/* Habits Card */}
      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif-title text-xl text-[#243b33]">
            Today's gentle intentions
          </h3>
          <button
            onClick={() => setActiveView('intentions')}
            className="text-xs text-[#5f7566] hover:text-[#253931] font-medium transition-colors cursor-pointer"
          >
            Configure Reminders 🔔
          </button>
        </div>
        <p className="text-xs text-[#778078] mb-4">
          A few simple ideas to begin with. Keep the ones that matter and make this list your own.
        </p>

        <div className="space-y-1">
          {habits.map((habit, index) => {
            const isChecked = dayData.checks.includes(index);
            const inputId = `habit-${index}`;
            const intentionConfig = intentionsList[index];

            return (
              <div
                key={`${habit}-${index}`}
                onClick={() => toggleHabit(index)}
                className={`
                  flex items-center gap-3 py-2.5 px-2 rounded-xl transition-colors cursor-pointer border-b border-[#e8e5dc] last:border-b-0
                  hover:bg-[#f6f5ef] ${isChecked ? 'text-[#90978f]' : 'text-[#303b35]' }
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all text-xs font-bold
                    ${
                      isChecked
                        ? 'bg-[#718b78] border-[#718b78] text-white shadow-xs'
                        : 'bg-white border-[#b7c2b5]'
                    }
                  `}
                >
                  {isChecked && '✓'}
                </div>
                <label
                  htmlFor={inputId}
                  className={`text-sm flex-1 cursor-pointer select-none flex items-center justify-between gap-2 ${
                    isChecked ? 'line-through text-[#90978f]' : ''
                  }`}
                >
                  <span>{habit}</span>
                  {intentionConfig?.reminderEnabled && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#e8f1e8] text-[#4b6d57] shrink-0 font-normal">
                      🔔 {intentionConfig.reminderTime || '09:00'}
                    </span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gratitude Card */}
      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <h3 className="font-serif-title text-xl text-[#243b33] mb-1">
          A moment of gratitude
        </h3>
        <p className="text-xs font-serif-title italic text-[#778078] mb-3">
          What are you appreciating today?
        </p>
        <textarea
          value={dayData.gratitude}
          onChange={(e) => updateGratitude(e.target.value)}
          placeholder="A person, a small comfort, something your body let you do…"
          rows={3}
          className="w-full border border-[#e8e5dc] bg-[#fffefa] focus:bg-white focus:border-[#718b78] rounded-xl p-3 text-sm text-[#303b35] outline-none transition-all resize-y"
        />
      </section>

      {/* Evening Reflection Card */}
      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <h3 className="font-serif-title text-xl text-[#243b33] mb-1">
          Evening reflection
        </h3>
        <p className="text-xs font-serif-title italic text-[#778078] mb-3">
          What made you smile? When were you fully present? What can you let go of?
        </p>
        <textarea
          value={dayData.reflection}
          onChange={(e) => updateReflection(e.target.value)}
          placeholder="A few honest lines are enough…"
          rows={3}
          className="w-full border border-[#e8e5dc] bg-[#fffefa] focus:bg-white focus:border-[#718b78] rounded-xl p-3 text-sm text-[#303b35] outline-none transition-all resize-y"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#778078]" role="status">
            {dayStatus}
          </span>
        </div>
      </section>
    </div>
  );
};
