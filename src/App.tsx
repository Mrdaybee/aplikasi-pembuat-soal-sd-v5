import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lock, ShieldCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DraftList } from './components/DraftList';
import { ExamIdentityForm } from './components/ExamIdentityForm';
import { QuestionEditor } from './components/QuestionEditor';
import { ExamPreview } from './components/ExamPreview';
import { ExportModal } from './components/ExportModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ExamDraft, ExamIdentity, Question, ExamStatus } from './types';
import { initialDrafts, getTemplateExam } from './data/sampleExam';
import { cloudDeleteDraft, cloudListDrafts, cloudLogout, cloudSaveDraft, CloudSession } from './services/cloudApi';

const STORAGE_KEY_DRAFTS = 'gas_soal_sd_drafts_v2';
const STORAGE_KEY_ACTIVE = 'gas_soal_sd_active_id_v2';
const STORAGE_KEY_ADMIN_AUTH = 'gas_admin_logged_in_v1';
const STORAGE_KEY_CLOUD_SESSION = 'gas_cloud_session_v1';

export default function App() {
  // 1. Initial State from localStorage or initialDrafts
  const [drafts, setDrafts] = useState<ExamDraft[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load drafts from localStorage:', e);
    }
    return initialDrafts;
  });

  const [activeExamId, setActiveExamId] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedActive) return savedActive;
    } catch (e) {
      // ignore
    }
    return initialDrafts[0]?.identity.examId || 'EXAM-KD1-SAS-2026';
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [cloudSession, setCloudSession] = useState<CloudSession | null>(() => {
    try { const saved = sessionStorage.getItem(STORAGE_KEY_CLOUD_SESSION); return saved ? JSON.parse(saved) : null; }
    catch { return null; }
  });
  const [pendingProtectedTab, setPendingProtectedTab] = useState<'admin' | 'drafts' | 'editor' | 'preview' | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<ExamDraft | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'info' | 'success' | 'warning' } | null>(null);

  // Default view is for regular user (Editor Soal)
  const [activeTab, setActiveTab] = useState<'admin' | 'drafts' | 'editor' | 'preview'>('editor');
  const [autosaveState, setAutosaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedText, setLastSavedText] = useState<string>('Tersimpan');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const isAuthenticated = Boolean(cloudSession);

  useEffect(() => {
    if (!cloudSession) return;
    cloudListDrafts(cloudSession.token).then(remoteDrafts => {
      setDrafts(remoteDrafts);
      setActiveExamId(remoteDrafts[0]?.identity.examId || '');
    }).catch(() => setAutosaveState('error'));
  }, [cloudSession]);

  // Active Draft object
  const activeDraft = useMemo(() => {
    const found = drafts.find(d => d.identity.examId === activeExamId);
    return found || drafts[0] || null;
  }, [drafts, activeExamId]);

  // Save changes to localStorage with debouncing (Autosave requirement)
  const isFirstMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setAutosaveState('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
        if (activeExamId) {
          localStorage.setItem(STORAGE_KEY_ACTIVE, activeExamId);
        }
        if (cloudSession) {
          const changedDraft = drafts.find(d => d.identity.examId === activeExamId);
          if (changedDraft) await cloudSaveDraft(cloudSession.token, changedDraft);
        }
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAutosaveState('saved');
        setLastSavedText(`Tersimpan pukul ${timeStr}`);
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveState('error');
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [drafts, activeExamId, cloudSession]);

  // Manual save handler
  const handleManualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
      if (activeExamId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE, activeExamId);
      }
      if (cloudSession && activeDraft) void cloudSaveDraft(cloudSession.token, activeDraft);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutosaveState('saved');
      setLastSavedText(`Tersimpan pukul ${timeStr}`);
    } catch (e) {
      setAutosaveState('error');
    }
  };

  // Update active exam identity
  const handleUpdateIdentity = (updated: Partial<ExamIdentity>) => {
    if (!activeDraft) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    setDrafts(prev =>
      prev.map(d => {
        if (d.identity.examId === activeExamId) {
          return {
            ...d,
            identity: {
              ...d.identity,
              ...updated,
              updatedAt: nowStr,
            },
          };
        }
        return d;
      })
    );
  };

  // Update questions
  const handleUpdateQuestions = (questions: Question[]) => {
    if (!activeDraft) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    setDrafts(prev =>
      prev.map(d => {
        if (d.identity.examId === activeExamId) {
          return {
            ...d,
            identity: {
              ...d.identity,
              status: d.identity.status === 'Sudah Diekspor' ? 'Sedang Dikerjakan' : d.identity.status,
              updatedAt: nowStr,
            },
            questions,
          };
        }
        return d;
      })
    );
  };

  // Create new blank exam
  const handleCreateNewExam = () => {
    const timestamp = Date.now();
    const newId = `EXAM-${timestamp}`;
    const newDraft: ExamDraft = {
      identity: {
        examId: newId,
        namaInstansi: 'PEMERINTAH KOTA / DINAS PENDIDIKAN',
        namaSekolah: 'SD NEGERI CONTOH 01',
        namaUjian: 'PENILAIAN SUMATIF AKHIR SEMESTER (SAS)',
        tahunAjaran: '2026/2027',
        mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
        namaSiswa: '......................................................',
        kelas: 'IV (Empat)',
        hariTanggal: 'Senin, 08 Desember 2026',
        petunjukPengerjaan: '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa kelengkapan lembar naskah soal.',
        logoKiriUrl: '',
        logoKananUrl: '',
        status: 'Baru',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      },
      questions: [
        {
          questionId: `Q-${timestamp}-1`,
          examId: newId,
          nomorSoal: 1,
          jenisSoal: 'PG',
          pertanyaan: '',
          opsiA: '',
          opsiB: '',
          opsiC: '',
          opsiD: '',
          kunciJawaban: 'A',
          materi: '',
          tujuanPembelajaran: '',
          indikatorSoal: '',
          levelKognitif: 'C1',
          bobotNilai: 1,
        },
      ],
    };

    setDrafts(prev => [newDraft, ...prev]);
    setActiveExamId(newId);
    setActiveTab('editor');
  };

  // Select draft to continue
  const handleSelectDraft = (examId: string) => {
    setActiveExamId(examId);
    setActiveTab('editor');
  };

  // Delete draft
  const handleDeleteDraft = (examId: string) => {
    if (drafts.length <= 1) {
      setToastMessage({ text: 'Tidak dapat menghapus semua draf. Sisakan minimal 1 draf ujian.', type: 'warning' });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    const target = drafts.find(d => d.identity.examId === examId);
    if (target) {
      setDraftToDelete(target);
    }
  };

  const confirmDeleteDraft = () => {
    if (!draftToDelete) return;
    const deletedId = draftToDelete.identity.examId;
    const remaining = drafts.filter(d => d.identity.examId !== deletedId);
    setDrafts(remaining);
    if (cloudSession) void cloudDeleteDraft(cloudSession.token, deletedId);
    if (activeExamId === deletedId) {
      setActiveExamId(remaining[0]?.identity.examId || '');
    }
    setDraftToDelete(null);
    setToastMessage({ text: 'Draf ujian berhasil dihapus.', type: 'success' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Duplicate draft
  const handleDuplicateDraft = (examId: string) => {
    const target = drafts.find(d => d.identity.examId === examId);
    if (!target) return;

    const timestamp = Date.now();
    const newId = `EXAM-DUP-${timestamp}`;
    const duplicate: ExamDraft = {
      identity: {
        ...target.identity,
        examId: newId,
        namaUjian: `${target.identity.namaUjian} (Salinan)`,
        status: 'Baru',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      },
      questions: target.questions.map((q, idx) => ({
        ...q,
        questionId: `Q-DUP-${idx + 1}-${timestamp}`,
        examId: newId,
      })),
    };

    setDrafts(prev => [duplicate, ...prev]);
    setActiveExamId(newId);
  };

  // Load template preset
  const handleLoadTemplate = (type: 'matematika' | 'ipas' | 'bahasa') => {
    const template = getTemplateExam(type);
    setDrafts(prev => [template, ...prev]);
    setActiveExamId(template.identity.examId);
    setActiveTab('editor');
  };

  // Mark as exported
  const handleMarkExported = () => {
    handleUpdateIdentity({ status: 'Sudah Diekspor' });
  };

  // Update status & catatan supervisi from Admin Dashboard
  const handleUpdateDraftStatus = (examId: string, status: ExamStatus, catatanSupervisi?: string) => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setDrafts(prev =>
      prev.map(d => {
        if (d.identity.examId === examId) {
          return {
            ...d,
            identity: {
              ...d.identity,
              status,
              ...(catatanSupervisi !== undefined ? { catatanSupervisi } : {}),
              updatedAt: nowStr,
            },
          };
        }
        return d;
      })
    );
  };

  // Admin authentication handlers
  const handleTabSelect = (tab: 'admin' | 'drafts' | 'editor' | 'preview') => {
    if (!isAuthenticated || (tab === 'admin' && cloudSession?.user.role !== 'admin')) {
      setPendingProtectedTab(tab);
      setIsAdminLoginModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleAdminLoginSuccess = (session: CloudSession) => {
    setCloudSession(session);
    setIsAdminLoggedIn(session.user.role === 'admin');
    sessionStorage.setItem(STORAGE_KEY_CLOUD_SESSION, JSON.stringify(session));
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
    } catch {
      // ignore
    }
    setIsAdminLoginModalOpen(false);
    setActiveTab(session.user.role === 'admin' ? (pendingProtectedTab || 'admin') : (pendingProtectedTab === 'admin' ? 'editor' : pendingProtectedTab || 'editor'));
    setPendingProtectedTab(null);
  };

  const handleAdminLogout = () => {
    if (cloudSession) void cloudLogout(cloudSession.token);
    setCloudSession(null);
    sessionStorage.removeItem(STORAGE_KEY_CLOUD_SESSION);
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    } catch {
      // ignore
    }
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation & Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabSelect}
        openExportModal={() => {
          if (!isAdminLoggedIn) {
            setPendingProtectedTab('preview');
            setIsAdminLoginModalOpen(true);
            return;
          }
          setIsExportModalOpen(true);
        }}
        autosaveState={autosaveState}
        lastSavedText={lastSavedText}
        onManualSave={handleManualSave}
        activeExamTitle={
          activeDraft
            ? `${activeDraft.identity.namaSekolah || 'Sekolah'} - ${activeDraft.identity.mataPelajaran || 'Ujian'}`
            : ''
        }
        isAdminLoggedIn={isAuthenticated}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!isAuthenticated && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Login Diperlukan</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Editor identitas dan soal, daftar draf ujian, serta pratinjau dokumen hanya dapat diakses setelah login.
            </p>
            <button
              type="button"
              onClick={() => {
                setPendingProtectedTab(activeTab === 'admin' ? 'admin' : activeTab);
                setIsAdminLoginModalOpen(true);
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Login untuk Melanjutkan
            </button>
          </div>
        )}
        {/* Tab 0: Dashboard Admin Pemantau Guru */}
        {isAdminLoggedIn && activeTab === 'admin' && (
          isAdminLoggedIn ? (
            <AdminDashboard
              drafts={drafts}
              onSelectDraft={(examId) => {
                setActiveExamId(examId);
              }}
              onOpenEditor={(examId) => {
                setActiveExamId(examId);
                setActiveTab('editor');
              }}
              onOpenPreview={(examId) => {
                setActiveExamId(examId);
                setActiveTab('preview');
              }}
              onUpdateDraftStatus={handleUpdateDraftStatus}
              onCreateNewExam={() => {
                handleCreateNewExam();
                setActiveTab('editor');
              }}
              cloudToken={cloudSession?.token}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Akses Terbatas: Khusus Administrator
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                Halaman pemantauan progres guru dan rekapitulasi penyusunan soal SDN Kedung Dalam 1 hanya dapat diakses oleh Kepala Sekolah atau Tim Kurikulum.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Kembali ke Editor Soal
                </button>
                <button
                  id="btn-trigger-login-page"
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login Administrator</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* Tab 1: Editor Identitas & Butir Soal (Tampilan Utama User) */}
        {isAuthenticated && activeTab === 'editor' && activeDraft && (
          <div className="space-y-6">
            <ExamIdentityForm
              identity={activeDraft.identity}
              onChange={handleUpdateIdentity}
            />

            <QuestionEditor
              questions={activeDraft.questions}
              onChange={handleUpdateQuestions}
            />
          </div>
        )}

        {/* Tab 2: Daftar Draf */}
        {isAuthenticated && activeTab === 'drafts' && (
          <DraftList
            drafts={drafts}
            activeExamId={activeExamId}
            onSelectDraft={handleSelectDraft}
            onCreateNew={handleCreateNewExam}
            onDeleteDraft={handleDeleteDraft}
            onDuplicateDraft={handleDuplicateDraft}
            onExportDraft={(draft) => {
              setActiveExamId(draft.identity.examId);
              setIsExportModalOpen(true);
            }}
            onLoadTemplate={handleLoadTemplate}
          />
        )}

        {/* Tab 3: Pratinjau Dokumen 2 Kolom, Kisi-Kisi, Kunci */}
        {isAuthenticated && activeTab === 'preview' && activeDraft && (
          <ExamPreview
            identity={activeDraft.identity}
            questions={activeDraft.questions}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}

      </main>

      {/* Ekspor 3 File Word Modal */}
      {isAuthenticated && activeDraft && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          identity={activeDraft.identity}
          questions={activeDraft.questions}
          onMarkExported={handleMarkExported}
        />
      )}

      {/* Modal Login Admin Khusus */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Modal Konfirmasi Hapus Draf Ujian */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Hapus Draf Ujian Ini?</h3>
              <p className="text-xs text-slate-600 font-semibold">
                "{draftToDelete.identity.namaUjian || 'Ujian Tanpa Judul'}"
              </p>
              <p className="text-xs text-slate-500">
                Mata pelajaran: {draftToDelete.identity.mataPelajaran} ({draftToDelete.identity.kelas}). Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteDraft}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Ya, Hapus Draf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-medium ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
