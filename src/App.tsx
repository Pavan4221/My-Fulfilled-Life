import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { HomeView } from './components/HomeView';
import { CheckInView } from './components/CheckInView';
import { JournalView } from './components/JournalView';
import { IntentionsView } from './components/IntentionsView';
import { AICompanionView } from './components/AICompanionView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';

export const AppContent: React.FC = () => {
  const { user, isLoadingAuth, activeView } = useApp();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f4f1e9] p-6 text-center">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full border-3 border-[#718b78]/30 border-t-[#718b78] animate-spin mx-auto" />
          <div className="text-sm font-serif-title italic text-[#778078]">
            Opening your space…
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[760px] mx-auto px-4 py-8">
        <Header />
        <AuthScreen />
        <footer className="text-center text-[#778078] font-serif-title italic text-xs py-8">
          Be where your feet are. Let today be enough. ♡
        </footer>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1440px] mx-auto py-3 px-3.5 max-md:pl-[68px] max-md:pr-3.5 md:px-8">
      <Header />

      <div className="flex flex-col md:flex-row gap-5 lg:gap-8 items-start mt-2">
        <Sidebar />

        <div className="flex-1 min-w-0 w-full">
          {activeView === 'home' && <HomeView />}
          {activeView === 'checkin' && <CheckInView />}
          {activeView === 'journal' && <JournalView />}
          {activeView === 'intentions' && <IntentionsView />}
          {activeView === 'ai' && <AICompanionView />}
          {activeView === 'insights' && <InsightsView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </div>

      <footer className="text-center text-[#778078] font-serif-title italic text-xs py-10">
        Be where your feet are. Let today be enough. ♡
      </footer>
    </main>
  );
};

export default function App() {
  return <AppContent />;
}
