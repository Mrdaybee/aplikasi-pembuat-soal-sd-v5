import React from 'react';
import { 
  FileText, 
  ListOrdered, 
  Eye, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  Save,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Lock,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'admin' | 'drafts' | 'editor' | 'preview';
  setActiveTab: (tab: 'admin' | 'drafts' | 'editor' | 'preview') => void;
  openExportModal: () => void;
  autosaveState: 'saved' | 'saving' | 'error';
  lastSavedText: string;
  onManualSave: () => void;
  activeExamTitle: string;
  isAuthenticated: boolean;
  isAdminLoggedIn: boolean;
  accountDisplayName: string;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openExportModal,
  autosaveState,
  lastSavedText,
  onManualSave,
  activeExamTitle,
  isAuthenticated,
  isAdminLoggedIn,
  accountDisplayName,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">APLIKASI PEMBUAT SOAL SD</span>
                <span className="text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">GAS Ready</span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
                {activeExamTitle || 'Sistem Otomatisasi Soal 2 Kolom, Kisi-Kisi & Kunci Jawaban'}
              </p>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Autosave Status */}
            {isAuthenticated && <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 border border-slate-200">
              {autosaveState === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span className="text-amber-700">Menyimpan otomatis...</span>
                </>
              ) : autosaveState === 'error' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-rose-600">Gagal menyimpan</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{lastSavedText || 'Semua data tersimpan'}</span>
                </>
              )}
            </div>}

            {/* Manual Save */}
            {isAuthenticated && <button
              id="btn-manual-save"
              onClick={onManualSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Simpan perubahan data saat ini"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Simpan</span>
            </button>}

            {/* Ekspor Word & PDF */}
            {isAuthenticated && <button
              id="btn-nav-export"
              onClick={openExportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
              title="Buka dialog ekspor dokumen (Word & PDF)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Word & PDF</span>
            </button>}

            {/* Tombol Khusus Admin Login / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAdminLoggedIn ? 'Admin' : 'Guru'}</span>
                </div>
                <span className="hidden sm:inline max-w-36 truncate text-xs font-medium text-slate-700" title={accountDisplayName}>
                  {accountDisplayName}
                </span>
                <button
                  id="btn-nav-logout"
                  onClick={onAdminLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                  title="Keluar dari akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="pl-2 border-l border-slate-200">
                <button
                  id="btn-nav-admin-login"
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
                  title="Login khusus Administrator / Kurikulum"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Login Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 sm:space-x-3 border-t border-slate-100 overflow-x-auto py-1">
          {/* If admin is logged in, show full Admin Dashboard tab */}
          {isAdminLoggedIn ? (
            <button
              id="tab-nav-admin"
              onClick={() => setActiveTab('admin')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'admin'
                  ? 'border-indigo-700 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-700 hover:text-indigo-700 hover:border-indigo-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              <span>Dashboard Admin (Pantau Guru)</span>
            </button>
          ) : (
            <button
              id="tab-nav-admin-locked"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-indigo-700 whitespace-nowrap transition-colors"
              title="Khusus Administrator / Kurikulum. Klik untuk login."
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Dashboard Admin (Login)</span>
            </button>
          )}

          <button
            id="tab-nav-editor"
            onClick={() => setActiveTab('editor')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {isAuthenticated ? <FileText className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Editor Identitas & Soal
          </button>

          <button
            id="tab-nav-drafts"
            onClick={() => setActiveTab('drafts')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'drafts'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {isAuthenticated ? <ListOrdered className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Daftar Draf Ujian
          </button>

          <button
            id="tab-nav-preview"
            onClick={() => setActiveTab('preview')}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {isAuthenticated ? <Eye className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Pratinjau 3 Dokumen
          </button>

        </div>
      </div>
    </header>
  );
};
