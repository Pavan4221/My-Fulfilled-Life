import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AICompanionView: React.FC = () => {
  const { habits, dayData, journal, todayKey, setActiveView } = useApp();
  const [promptText, setPromptText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getDailyPrompt = () => {
    const done = habits.filter((_, i) => dayData.checks.includes(i));
    const open = habits.filter((_, i) => !dayData.checks.includes(i));

    return `You are my kind, thoughtful personal wellbeing companion. Help me live with gratitude, presence, balance and contentment — not maximize productivity or make me feel guilty.

My daily check-in for ${todayKey}:
Intentions completed: ${done.length}/${habits.length}
Completed: ${done.join('; ') || 'None recorded'}
Still open: ${open.join('; ') || 'None'}

Gratitude:
${dayData.gratitude || 'Not written yet'}

Evening reflection:
${dayData.reflection || 'Not written yet'}

Please respond warmly and briefly. Reflect what went well, notice one useful pattern, offer one gentle suggestion for tomorrow, and remind me that an imperfect day can still be a good day.`;
  };

  const getWeeklyPrompt = () => {
    const since = new Date();
    since.setDate(since.getDate() - 6);

    const entries = journal
      .filter((e) => {
        const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAtISO || 0);
        return d >= since;
      })
      .map((e) => {
        const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAtISO);
        return `${d.toLocaleDateString()}: ${e.text}`;
      });

    return `You are my thoughtful wellbeing companion. Help me build a fulfilled life through gratitude, presence, relationships, health, curiosity and rest — not productivity pressure.

Journal entries from the last seven days:
${entries.join('\n\n') || 'No journal entries recorded.'}

Please offer a concise weekly reflection: meaningful moments to appreciate, patterns that support or drain wellbeing, and one gentle experiment for next week. Avoid judgement or turning this into a performance review.`;
  };

  const copyPrompt = async (text: string) => {
    setPromptText(text);
    setShowPreview(true);
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage('Prompt copied to clipboard. Review it in the preview before sharing.');
    } catch (e) {
      setStatusMessage('Preview ready. Select and copy the text below.');
    }
  };

  const openExternalAI = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
          THOUGHTFUL REFLECTION
        </div>
        <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#1f3833] mt-1 mb-1">
          Your AI Companion
        </h2>
        <p className="text-sm text-[#778078]">
          A gentle conversation about the life you're living — not another productivity score.
        </p>
      </div>

      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8]">
        <p className="text-xs text-[#778078] mb-4 leading-relaxed">
          Choose what to share. Nothing is sent automatically; you have total control to review or edit before sharing.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => copyPrompt(getDailyPrompt())}
            className="py-2.5 px-4 rounded-xl bg-[#718b78] hover:bg-[#607766] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Copy daily reflection prompt
          </button>

          <button
            onClick={() => copyPrompt(getWeeklyPrompt())}
            className="py-2.5 px-4 rounded-xl bg-[#e5ede4] hover:bg-[#d8e3d6] text-[#303b35] font-semibold text-xs transition-colors cursor-pointer"
          >
            Copy weekly reflection prompt
          </button>
        </div>

        {/* Handoff shortcuts */}
        <div className="mt-4 pt-4 border-t border-[#e8e5dc] flex flex-wrap items-center gap-2 text-xs text-[#778078]">
          <span>Open companion site:</span>
          <button
            onClick={() => openExternalAI('https://gemini.google.com')}
            className="px-2.5 py-1 rounded-lg bg-[#e5f0ef] hover:bg-[#d4e7e5] text-[#194b45] font-medium transition-colors cursor-pointer"
          >
            Gemini ↗
          </button>
          <button
            onClick={() => openExternalAI('https://chatgpt.com')}
            className="px-2.5 py-1 rounded-lg bg-[#f0f0e9] hover:bg-[#e4e4dd] text-[#303b35] font-medium transition-colors cursor-pointer"
          >
            ChatGPT ↗
          </button>
        </div>

        {/* Toggle prompt preview */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setShowPreview((prev) => !prev)}
            className="text-xs text-[#778078] hover:text-[#303b35] underline underline-offset-4 py-1 cursor-pointer transition-colors"
          >
            {showPreview ? 'Hide prompt preview' : 'Preview shared prompt'}
          </button>
        </div>

        {showPreview && (
          <div className="mt-3">
            <textarea
              value={promptText || getDailyPrompt()}
              readOnly
              rows={8}
              aria-label="AI prompt preview"
              className="w-full border border-[#e8e5dc] bg-[#f9f8f4] text-[#303b35] rounded-xl p-3 text-xs font-mono leading-relaxed outline-none"
            />
          </div>
        )}

        {statusMessage && (
          <p className="text-xs text-[#52775f] mt-3 font-medium" role="status">
            {statusMessage}
          </p>
        )}
      </section>
    </div>
  );
};
