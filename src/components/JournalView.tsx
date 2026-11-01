import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const JournalView: React.FC = () => {
  const { journal, addJournalEntry, deleteJournalEntry, setActiveView } = useApp();
  const [entryText, setEntryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = entryText.trim();
    if (!trimmed) {
      setStatusMessage('Write a thought or moment first.');
      return;
    }
    setIsSaving(true);
    setStatusMessage('Saving entry…');
    const success = await addJournalEntry(trimmed);
    setIsSaving(false);

    if (success) {
      setEntryText('');
      setStatusMessage('Entry saved and synced ✓');
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage('Could not save. Check your connection.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this journal entry?')) {
      setDeletingId(id);
      await deleteJournalEntry(id);
      setDeletingId(null);
    }
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
          THOUGHTS & MEMORIES
        </div>
        <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#1f3833] mt-1 mb-1">
          Your Journal
        </h2>
        <p className="text-sm text-[#778078]">
          Write freely, reflect deeply and capture the moments you want to remember.
        </p>
      </div>

      {/* Composer Card */}
      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <textarea
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="Write freely. There is no format to follow…"
          rows={4}
          className="w-full border border-[#e8e5dc] bg-[#fffefa] focus:bg-white focus:border-[#718b78] rounded-xl p-3 text-sm text-[#303b35] outline-none transition-all resize-y"
        />

        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !entryText.trim()}
            className="py-2.5 px-4 rounded-xl bg-[#718b78] hover:bg-[#607766] disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {isSaving ? 'Saving…' : 'Save journal entry'}
          </button>

          {statusMessage && (
            <span className="text-xs text-[#778078]" role="status">
              {statusMessage}
            </span>
          )}
        </div>

        {/* Entries List */}
        <div className="mt-8 pt-6 border-t border-[#e8e5dc] space-y-4">
          <h3 className="font-serif-title text-lg text-[#233830]">Past entries</h3>

          {journal.length === 0 ? (
            <div className="py-8 text-center text-[#778078] font-serif-title italic text-sm">
              Your first entry can start whenever you feel ready.
            </div>
          ) : (
            <div className="space-y-4">
              {journal.map((entry) => {
                const dateObj = entry.createdAt?.toDate
                  ? entry.createdAt.toDate()
                  : new Date(entry.createdAtISO || Date.now());

                const formattedDate = dateObj.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                });

                return (
                  <article
                    key={entry.id}
                    className="p-4 rounded-xl bg-[#faf8f2] border border-[#e8e5dc] relative group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#778078]">
                      <time dateTime={dateObj.toISOString()}>{formattedDate}</time>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-xs text-[#a34e43] hover:text-[#7d362d] font-medium opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {deletingId === entry.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-[#303b35] whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
