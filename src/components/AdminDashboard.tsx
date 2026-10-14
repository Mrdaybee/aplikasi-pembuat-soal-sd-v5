import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  FileEdit, 
  Eye, 
  MessageSquare, 
  GraduationCap, 
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  Send,
  X,
  Plus
} from 'lucide-react';
import { ExamDraft, ExamStatus } from '../types';
import { CloudUser, cloudCreateUser, cloudDeleteUser, cloudListUsers, cloudUpdateUser } from '../services/cloudApi';

interface AdminDashboardProps {
  drafts: ExamDraft[];
  onSelectDraft: (examId: string) => void;
  onOpenEditor: (examId: string) => void;
  onOpenPreview: (examId: string) => void;
  onUpdateDraftStatus: (examId: string, status: ExamStatus, catatanSupervisi?: string) => void;
  onCreateNewExam: () => void;
  cloudToken?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  drafts,
  onSelectDraft,
  onOpenEditor,
  onOpenPreview,
  onUpdateDraftStatus,
  onCreateNewExam,
  cloudToken,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');

  // Supervisi Modal State
  const [selectedExamForReview, setSelectedExamForReview] = useState<ExamDraft | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ExamStatus>('Selesai');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [users, setUsers] = useState<CloudUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userMessage, setUserMessage] = useState('');

  React.useEffect(() => {
    if (!cloudToken) return;
    cloudListUsers(cloudToken).then(setUsers).catch(error => setUserMessage(error instanceof Error ? error.message : 'Gagal memuat akun guru.'));
  }, [cloudToken]);

  const handleCreateTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cloudToken) return;
    try {
      const user = await cloudCreateUser(cloudToken, { username: newUsername, displayName: newDisplayName, password: newPassword });
      setUsers(current => [...current, user]);
      setNewUsername(''); setNewDisplayName(''); setNewPassword('');
      setUserMessage('Akun guru berhasil dibuat dan disimpan ke Spreadsheet.');
    } catch (error) { setUserMessage(error instanceof Error ? error.message : 'Gagal membuat akun guru.'); }
  };

  const handleToggleTeacher = async (user: CloudUser) => {
    if (!cloudToken) return;
    try {
      const updated = await cloudUpdateUser(cloudToken, { userId: user.userId, active: !user.active });
      setUsers(current => current.map(item => item.userId === updated.userId ? updated : item));
    } catch (error) { setUserMessage(error instanceof Error ? error.message : 'Gagal mengubah status akun.'); }
  };

  const handleDeleteTeacher = async (user: CloudUser) => {
    if (!cloudToken || !window.confirm(`Hapus akun guru "${user.displayName}"?`)) return;
    try {
      await cloudDeleteUser(cloudToken, user.userId);
      setUsers(current => current.filter(item => item.userId !== user.userId));
      setUserMessage('Akun guru berhasil dihapus.');
    } catch (error) { setUserMessage(error instanceof Error ? error.message : 'Gagal menghapus akun guru.'); }
  };

  // Filtered Drafts
  const filteredDrafts = useMemo(() => {
    return drafts.filter((d) => {
      const id = d.identity;
      const q = searchQuery.toLowerCase();

      const matchesSearch = 
        (id.namaGuru || '').toLowerCase().includes(q) ||
        (id.mataPelajaran || '').toLowerCase().includes(q) ||
        (id.kelas || '').toLowerCase().includes(q) ||
        (id.nipGuru || '').toLowerCase().includes(q) ||
        (id.namaSekolah || '').toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'ALL' || id.status === filterStatus;
      const matchesKelas = filterKelas === 'ALL' || id.kelas.toLowerCase().includes(filterKelas.toLowerCase());

      return matchesSearch && matchesStatus && matchesKelas;
    });
  }, [drafts, searchQuery, filterStatus, filterKelas]);

  // Key Metrics
  const totalDrafts = drafts.length;
  const completedCount = drafts.filter((d) => d.identity.status === 'Selesai' || d.identity.status === 'Sudah Diekspor').length;
  const inProgressCount = drafts.filter((d) => d.identity.status === 'Sedang Dikerjakan').length;
  const needRevisionCount = drafts.filter((d) => d.identity.status === 'Perlu Revisi').length;
  const totalQuestions = drafts.reduce((acc, d) => acc + d.questions.length, 0);

  const openSupervisiModal = (draft: ExamDraft) => {
    setSelectedExamForReview(draft);
    setReviewStatus(draft.identity.status);
    setReviewNotes(draft.identity.catatanSupervisi || '');
  };

  const handleSaveSupervisi = () => {
    if (!selectedExamForReview) return;
    onUpdateDraftStatus(selectedExamForReview.identity.examId, reviewStatus, reviewNotes);
    setSelectedExamForReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 border border-blue-400/30">
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
              <span>Dinas Pendidikan Kabupaten Tangerang</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Dashboard Pemantauan & Supervisi Pembuat Soal SD
            </h2>
            <p className="text-sm text-blue-100/80 mt-1 max-w-2xl">
              SDN KEDUNG DALAM 1 — Pantau progres guru yang sudah menyusun naskah soal 2 kolom, kisi-kisi, kunci jawaban, dan lakukan telaah mutu ujian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="btn-tambah-soal-baru"
              onClick={onCreateNewExam}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Naskah Soal Baru</span>
            </button>
          </div>
        </div>
      </div>

      {cloudToken && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><h3 className="font-bold text-slate-900">Kelola Akun Guru</h3><p className="text-xs text-slate-500 mt-1">Akun tersimpan pada tab Users di Google Spreadsheet.</p></div>
            {userMessage && <span className="text-xs text-blue-700">{userMessage}</span>}
          </div>
          <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" required className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Nama guru" required className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password (minimal 8 karakter)" minLength={8} required type="password" className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="px-3 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg">Buat Akun Guru</button>
          </form>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {users.filter(user => user.role === 'teacher').map(user => (
              <div key={user.userId} className="flex items-center justify-between px-3 py-2.5 text-xs">
                <div><b>{user.displayName}</b><span className="text-slate-500 ml-2">@{user.username}</span></div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleToggleTeacher(user)} className={`px-2.5 py-1 rounded-md font-semibold ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.active ? 'Aktif' : 'Nonaktif'}</button>
                  <button type="button" onClick={() => handleDeleteTeacher(user)} className="px-2.5 py-1 rounded-md font-semibold bg-rose-100 text-rose-700">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Guru / Naskah */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Naskah Ujian</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalDrafts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Naskah terdaftar di sistem</div>
        </div>

        {/* Selesai / Siap Cetak */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Selesai & Disetujui</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Siap ekspor 3 file Word</div>
        </div>

        {/* Sedang Dikerjakan */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Sedang Dikerjakan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{inProgressCount}</div>
          <div className="text-[11px] text-blue-600 mt-1">Guru dalam proses input</div>
        </div>

        {/* Perlu Revisi */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Perlu Revisi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{needRevisionCount}</div>
          <div className="text-[11px] text-amber-600 mt-1">Ada catatan supervisi</div>
        </div>

        {/* Total Butir Soal */}
        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Total Butir Soal</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-900 mt-2">{totalQuestions}</div>
          <div className="text-[11px] text-indigo-600 mt-1">PG, Isian & Esai terakumulasi</div>
        </div>
      </div>

      {/* Filter, Search & Status Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, mata pelajaran, kelas, atau NIP..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-semibold text-slate-800 text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="Selesai">Selesai / Disetujui</option>
                <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
                <option value="Baru">Draf Baru</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-600 font-medium">Kelas:</span>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-semibold text-slate-800 text-xs"
              >
                <option value="ALL">Semua Kelas</option>
                <option value="I">Kelas I</option>
                <option value="II">Kelas II</option>
                <option value="III">Kelas III</option>
                <option value="IV">Kelas IV</option>
                <option value="V">Kelas V</option>
                <option value="VI">Kelas VI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs text-slate-600">
          <span className="text-slate-400 font-medium text-[11px]">Tampilkan Cepat:</span>
          <button
            onClick={() => { setFilterStatus('ALL'); setFilterKelas('ALL'); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterStatus === 'ALL' && filterKelas === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua ({totalDrafts})
          </button>
          <button
            onClick={() => setFilterStatus('Selesai')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterStatus === 'Selesai'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Siap Cetak ({completedCount})
          </button>
          <button
            onClick={() => setFilterStatus('Sedang Dikerjakan')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterStatus === 'Sedang Dikerjakan'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Dalam Proses ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('Perlu Revisi')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterStatus === 'Perlu Revisi'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Perlu Revisi ({needRevisionCount})
          </button>
        </div>
      </div>

      {/* Monitoring Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Daftar Pembuat Soal & Lembar Ujian
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredDrafts.length} dari {totalDrafts} berkas naskah soal guru
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-100/80 text-slate-800 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Guru Penyusun / NIP</th>
                <th className="py-3 px-4">Mata Pelajaran & Kelas</th>
                <th className="py-3 px-4">Jenis Ujian</th>
                <th className="py-3 px-4 text-center">Rincian Butir Soal</th>
                <th className="py-3 px-4 text-center">Total Bobot</th>
                <th className="py-3 px-4 text-center">Status Progres</th>
                <th className="py-3 px-4">Catatan Supervisi</th>
                <th className="py-3 px-4 text-center">Aksi Pantauan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-sm">Tidak ditemukan data yang cocok dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((draft, idx) => {
                  const id = draft.identity;
                  const pgCount = draft.questions.filter(q => q.jenisSoal === 'PG').length;
                  const isianCount = draft.questions.filter(q => q.jenisSoal === 'ISIAN').length;
                  const esaiCount = draft.questions.filter(q => q.jenisSoal === 'ESAI').length;
                  const totalScore = draft.questions.reduce((acc, q) => acc + (q.bobotNilai || 1), 0);

                  const getStatusBadge = (status: ExamStatus) => {
                    switch (status) {
                      case 'Selesai':
                      case 'Sudah Diekspor':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai
                          </span>
                        );
                      case 'Sedang Dikerjakan':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            Sedang Dikerjakan
                          </span>
                        );
                      case 'Perlu Revisi':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            Perlu Revisi
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Draf Baru
                          </span>
                        );
                    }
                  };

                  return (
                    <tr key={id.examId} className="hover:bg-slate-50/80 transition-colors">
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Guru & NIP */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {id.namaGuru || 'Guru Belum Terdata'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIP: {id.nipGuru || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Update: {id.updatedAt || id.createdAt}
                        </div>
                      </td>

                      {/* Mapel & Kelas */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {id.mataPelajaran || 'Mata Pelajaran'}
                        </div>
                        <div className="text-xs text-blue-700 font-medium">
                          Kelas {id.kelas || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {id.hariTanggal || '-'}
                        </div>
                      </td>

                      {/* Nama Ujian */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">
                          {id.namaUjian}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          TP {id.tahunAjaran}
                        </span>
                      </td>

                      {/* Rincian Butir Soal */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-slate-900 mb-1">
                          {draft.questions.length} Butir Soal
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200" title="Pilihan Ganda">
                            {pgCount} PG
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200" title="Isian Singkat">
                            {isianCount} Isian
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200" title="Esai / Uraian">
                            {esaiCount} Esai
                          </span>
                        </div>
                      </td>

                      {/* Total Bobot */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {totalScore} Poin
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(id.status)}
                      </td>

                      {/* Catatan Supervisi */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {id.catatanSupervisi ? (
                          <div className="text-xs bg-amber-50/80 text-amber-900 p-2 rounded border border-amber-200">
                            <span className="font-bold block text-[10px] text-amber-800">Catatan Review:</span>
                            {id.catatanSupervisi}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada catatan</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openSupervisiModal(draft)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                            title="Beri Catatan Supervisi / Review Kurikulum"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPreview(id.examId)}
                            className="p-1.5 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                            title="Pratinjau 3 Dokumen Ujian (Naskah, Kisi, Kunci)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditor(id.examId)}
                            className="p-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors font-medium flex items-center gap-1 text-xs"
                            title="Buka Editor Naskah & Soal"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Supervisi & Review Soal */}
      {selectedExamForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Supervisi & Telaah Soal Ujian
                  </h4>
                  <p className="text-xs text-slate-500">
                    {selectedExamForReview.identity.namaSekolah}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExamForReview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs text-slate-700">
              <div><span className="font-bold text-slate-900">Guru Penyusun:</span> {selectedExamForReview.identity.namaGuru || 'Belum diisi'} (NIP: {selectedExamForReview.identity.nipGuru || '-'})</div>
              <div><span className="font-bold text-slate-900">Mata Pelajaran:</span> {selectedExamForReview.identity.mataPelajaran} - Kelas {selectedExamForReview.identity.kelas}</div>
              <div><span className="font-bold text-slate-900">Kelengkapan:</span> {selectedExamForReview.questions.length} Butir Soal</div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Status Kelayakan Ujian:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('Selesai')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                    reviewStatus === 'Selesai'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui (Siap Cetak)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('Perlu Revisi')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                    reviewStatus === 'Perlu Revisi'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Perlu Revisi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('Sedang Dikerjakan')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                    reviewStatus === 'Sedang Dikerjakan'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Sedang Dikerjakan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('Baru')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                    reviewStatus === 'Baru'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>Draf Baru</span>
                </button>
              </div>
            </div>

            {/* Review Notes Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Catatan Supervisi / Rekomendasi Perbaikan:
              </label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Contoh: Soal nomor 3 sudah bagus dengan gambar stimulus. Periksa kembali kunci jawaban esai nomor 5 agar rubrik penskoran lebih detail..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedExamForReview(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSupervisi}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Hasil Supervisi</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
