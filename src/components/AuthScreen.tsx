import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, continueAsGuest, isLoadingAuth } = useApp();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const res = await signInWithGoogle();
    setIsSigningIn(false);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="card-calm p-7 bg-[#fffdf8]">
        <h2 className="font-serif-title text-2xl font-medium text-[#253931] mb-2">
          A little space for a fulfilled life
        </h2>
        <p className="text-sm text-[#778078] leading-relaxed mb-6">
          Sign in to keep your intentions, gratitude and journal safely synced across your devices.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn || isLoadingAuth}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#718b78] hover:bg-[#607766] active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
          {isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-normal">
            <p className="font-medium mb-1">Notice</p>
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#e8e5dc]" />
          <span className="text-xs text-[#778078] uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#e8e5dc]" />
        </div>

        <button
          onClick={continueAsGuest}
          className="w-full py-2.5 px-4 rounded-xl bg-[#e5ede4] hover:bg-[#d5e2d3] text-[#303b35] font-semibold text-sm transition-colors cursor-pointer"
        >
          Continue in Private Local Mode
        </button>

        <p className="text-xs text-[#778078] mt-5 leading-normal">
          Your journal is private. When signed in, your data is synced securely via Firebase. In local mode, data remains safely in your browser.
        </p>
      </div>
    </div>
  );
};
