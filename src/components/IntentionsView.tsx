import React, { useState, useEffect } from 'react';
import { useApp, DEFAULTS } from '../context/AppContext';
import { IntentionItem } from '../types';

export const IntentionsView: React.FC = () => {
  const {
    habits,
    intentionsList,
    saveHabits,
    updateIntentionItem,
    setActiveView
  } = useApp();

  const [mode, setMode] = useState<'cards' | 'bulk'>('cards');
  const [bulkText, setBulkText] = useState(habits.join('\n'));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setBulkText(habits.join('\n'));
  }, [habits]);

  const handleBulkSave = async () => {
    const list = bulkText.split('\n').map((x) => x.trim()).filter(Boolean);
    if (!list.length) {
      alert('Keep at least one intention, or add a new one.');
      return;
    }
    setIsSaving(true);
    setStatus('Saving intentions…');
    const success = await saveHabits(list);
    setIsSaving(false);
    if (success) {
      setStatus('Intentions saved ✓');
      setMode('cards');
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus('Could not save intentions.');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset your intentions to the default list?')) {
      await saveHabits(DEFAULTS);
      setBulkText(DEFAULTS.join('\n'));
      setStatus('Restored gentle defaults ✓');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleToggleReminder = async (item: IntentionItem) => {
    const nextState = !item.reminderEnabled;
    await updateIntentionItem(item.id, { reminderEnabled: nextState });
    setStatus(nextState ? `Reminder enabled for "${item.name}"` : `Reminder turned off`);
    setTimeout(() => setStatus(null), 2500);
  };

  const handleTimeChange = async (item: IntentionItem, newTime: string) => {
    await updateIntentionItem(item.id, { reminderTime: newTime });
  };

  const handleRecurrenceChange = async (item: IntentionItem, recurrence: string) => {
    await updateIntentionItem(item.id, { reminderDays: [recurrence] });
  };

  const handleNoteChange = async (item: IntentionItem, newNote: string) => {
    await updateIntentionItem(item.id, { reminderNote: newNote });
  };

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
          MAKE SPACE FOR WHAT MATTERS
        </div>
        <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#1f3833] mt-1 mb-1">
          My Intentions
        </h2>
        <p className="text-sm text-[#778078]">
          Keep the intentions that feel right for this season of life, and set gentle lock-screen reminders.
        </p>
      </div>

      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        {/* Mode Selector */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e8e5dc] mb-4 flex-wrap gap-2">
          <div className="flex rounded-xl bg-[#f0eee6] p-1 text-xs">
            <button
              onClick={() => setMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                mode === 'cards'
                  ? 'bg-white text-[#20362c] shadow-xs font-semibold'
                  : 'text-[#68736a] hover:text-[#20362c]'
              }`}
            >
              Intention Reminders
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-white text-[#20362c] shadow-xs font-semibold'
                  : 'text-[#68736a] hover:text-[#20362c]'
              }`}
            >
              Bulk Text Editor
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="text-xs text-[#778078] hover:text-[#2d4239] transition-colors cursor-pointer"
          >
            Restore defaults
          </button>
        </div>

        {status && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#e5ede4] text-xs text-[#2b4c3b] font-medium flex items-center justify-between">
            <span>{status}</span>
            <button onClick={() => setStatus(null)} className="text-[#5b7367] hover:text-[#2b4c3b]">
              ✕
            </button>
          </div>
        )}

        {/* Cards Mode: Individual intentions with custom reminders */}
        {mode === 'cards' && (
          <div className="space-y-3">
            <div className="text-xs text-[#778078] mb-2 leading-relaxed">
              Click the bell icon on any intention to schedule a dedicated gentle push notification.
            </div>

            {intentionsList.map((item, index) => {
              const isEditing = editingId === item.id;
              const recurrence = item.reminderDays?.[0] || 'daily';

              return (
                <div
                  key={item.id}
                  className={`
                    p-3.5 sm:p-4 rounded-xl border transition-all
                    ${
                      item.reminderEnabled
                        ? 'bg-[#f4f8f4] border-[#cce0d1]'
                        : 'bg-[#faf8f3] border-[#e8e5dc]'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xs font-serif-title font-semibold text-[#808d82] w-5">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium text-[#253931] truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.reminderEnabled && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#e0ecdf] text-[#294c39]">
                          {item.reminderTime || '09:00'} · {recurrence}
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleReminder(item)}
                        title={item.reminderEnabled ? 'Reminder Active' : 'Enable Reminder'}
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer
                          ${
                            item.reminderEnabled
                              ? 'bg-[#718b78] text-white shadow-xs'
                              : 'bg-[#ece9e0] text-[#778078] hover:bg-[#dedad0]'
                          }
                        `}
                      >
                        {item.reminderEnabled ? '🔔' : '🔕'}
                      </button>

                      <button
                        onClick={() => setEditingId(isEditing ? null : item.id)}
                        className="text-xs text-[#778078] hover:text-[#303b35] px-2 py-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                      >
                        {isEditing ? 'Close' : 'Configure'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded reminder configuration panel */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-[#e2dfd5] text-xs space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="font-semibold text-[#303b35]">
                          Reminder Time:
                        </label>
                        <input
                          type="time"
                          value={item.reminderTime || '09:00'}
                          onChange={(e) => handleTimeChange(item, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-[#cfcdc5] bg-white text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="font-semibold text-[#303b35]">
                          Recurrence:
                        </label>
                        <div className="flex gap-1.5">
                          {['daily', 'weekdays', 'weekends'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleRecurrenceChange(item, opt)}
                              className={`px-2.5 py-1 rounded-md text-[11px] capitalize cursor-pointer transition-colors ${
                                recurrence === opt
                                  ? 'bg-[#718b78] text-white font-medium'
                                  : 'bg-[#e9e6dd] text-[#55635a] hover:bg-[#ddd9ce]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#303b35] mb-1">
                          Gentle Notification Note:
                        </label>
                        <input
                          type="text"
                          value={item.reminderNote || ''}
                          onChange={(e) => handleNoteChange(item, e.target.value)}
                          placeholder="A gentle reminder for yourself…"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfcdc5] bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-3">
              <button
                onClick={() => setMode('bulk')}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#b8c7ba] hover:border-[#718b78] text-[#5a7161] hover:text-[#253931] text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                + Add or rearrange intentions (Bulk editor)
              </button>
            </div>
          </div>
        )}

        {/* Bulk Mode */}
        {mode === 'bulk' && (
          <div>
            <p className="text-xs text-[#778078] mb-3 leading-relaxed">
              Add, edit or reorder intentions below — one intention per line (up to 15). Existing reminder schedules will stay linked.
            </p>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Take a mindful pause\nMove in a way that feels good\nAdd your own intention…`}
              rows={9}
              className="w-full border border-[#e8e5dc] bg-[#fffefa] focus:bg-white focus:border-[#718b78] rounded-xl p-3 text-sm text-[#303b35] outline-none transition-all resize-y font-sans leading-relaxed"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleBulkSave}
                disabled={isSaving}
                className="py-2.5 px-4 rounded-xl bg-[#718b78] hover:bg-[#607766] disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                {isSaving ? 'Saving…' : 'Save intentions list'}
              </button>

              <button
                onClick={() => setMode('cards')}
                className="py-2.5 px-3 rounded-xl bg-[#e5ede4] hover:bg-[#d8e3d6] text-[#303b35] font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
