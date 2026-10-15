import { useState } from 'react';
import { ShieldCheck, History, Sparkles, User as UserIcon, Trash2, LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
  historyCount: number;
  onOpenAuth?: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export function Navbar({
  onOpenHistory,
  historyCount,
  onOpenAuth,
  userEmail,
  onLogout,
  onDeleteAccount,
}: NavbarProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (onDeleteAccount) {
      onDeleteAccount();
      setShowConfirmDelete(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-5 sm:px-8 py-3.5 flex items-center justify-between transition-colors material-elevation-1">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 rounded-2xl border border-blue-500/20 shadow-xs flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              PhishGuard <span className="text-blue-600 dark:text-blue-400">AI</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
              <Sparkles className="w-3 h-3 text-blue-500" /> Hybrid Engine
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium hidden xs:block">
            Intelligent Phishing & Social Engineering Awareness
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">

        {/* History Drawer Trigger */}
        <button
          onClick={onOpenHistory}
          className="relative inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-full border border-slate-200 dark:border-slate-700/80 transition-colors material-state-layer cursor-pointer"
          aria-label="View message history"
        >
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-blue-600 rounded-full shadow-xs">
              {historyCount}
            </span>
          )}
        </button>

        {/* User / Guest Status */}
        {userEmail ? (
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[12px] text-slate-600 dark:text-slate-300 font-medium bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              {userEmail}
            </span>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-colors material-state-layer cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Delete Account button */}
            {onDeleteAccount && (
              <>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full border border-rose-200/80 dark:border-rose-900/40 transition-colors material-state-layer cursor-pointer"
                  title="Delete account & permanently purge all history"
                  aria-label="Delete account"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {showConfirmDelete && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full material-elevation-4 space-y-4 animate-material-fade">
                      <h4 className="font-bold text-[16px] text-slate-900 dark:text-white">
                        Delete Account Permanently?
                      </h4>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        This will permanently delete your account and all associated phishing analysis history records from MongoDB Atlas. This action cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          onClick={() => setShowConfirmDelete(false)}
                          className="px-4 py-2 text-xs font-medium rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 material-state-layer cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          className="px-4 py-2 text-xs font-medium rounded-full bg-rose-600 hover:bg-rose-700 text-white material-state-layer cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full border border-blue-200 dark:border-blue-900/60 transition-colors material-state-layer cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In / Guest</span>
          </button>
        )}
      </div>
    </header>
  );
}
