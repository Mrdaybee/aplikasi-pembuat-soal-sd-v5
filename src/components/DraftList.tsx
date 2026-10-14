import React from 'react';
import { 
  Plus, 
  FolderOpen, 
  Trash2, 
  Download, 
  Copy, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { ExamDraft, ExamStatus } from '../types';

interface DraftListProps {
  drafts: ExamDraft[];
  activeExamId: string;
  onSelectDraft: (examId: string) => void;
  onCreateNew: () => void;
  onDeleteDraft: (examId: string) => void;
  onDuplicateDraft: (examId: string) => void;
  onExportDraft: (draft: ExamDraft) => void;
  onLoadTemplate: (templateType: 'matematika' | 'ipas' | 'bahasa') => void;
}

export const DraftList: React.FC<DraftListProps> = ({
  drafts,
  activeExamId,
  onSelectDraft,
  onCreateNew,
  onDeleteDraft,
  onDuplicateDraft,
  onExportDraft,
  onLoadTemplate,
}) => {
  const totalDrafts = drafts.length;
  const totalQuestions = drafts.reduce((acc, d) => acc + d.questions.length, 0);
  const totalExported = drafts.filter(d => d.identity.status === 'Sudah Diekspor').length;

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'Sudah Diekspor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Sudah Diekspor
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3" /> Selesai
          </span>
        );
      case 'Sedang Dikerjakan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Sedang Dikerjakan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <AlertCircle className="w-3 h-3" /> Baru
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalDrafts}</div>
            <div className="text-xs text-slate-500 font-medium">Total Draf Ujian</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalQuestions}</div>
            <div className="text-xs text-slate-500 font-medium">Total Butir Soal Terdata</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalExported}</div>
            <div className="text-xs text-slate-500 font-medium">Naskah Siap / Telah Diekspor</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Daftar Draf Ujian Sekolah Dasar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih draf untuk melanjutkan penyusunan soal atau klik "Buat Ujian Baru".
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Templates */}
          <div className="dropdown relative group">
            <button
              id="btn-template-preset"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              + Muat Contoh Soal SD
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              <button
                onClick={() => onLoadTemplate('matematika')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                📐 Matematika Kelas 4 SD
              </button>
              <button
                onClick={() => onLoadTemplate('ipas')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                🌱 IPAS Kelas 4 SD (Lengkap)
              </button>
              <button
                onClick={() => onLoadTemplate('bahasa')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                📖 Bahasa Indonesia Kelas 5 SD
              </button>
            </div>
          </div>

          <button
            id="btn-create-new-exam"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Buat Ujian Baru
          </button>
        </div>
      </div>

      {/* Drafts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-3 w-10 text-center">No.</th>
                <th className="py-3 px-4">Nama Ujian</th>
                <th className="py-3 px-3">Nama Sekolah</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-2 text-center">Kelas</th>
                <th className="py-3 px-2 text-center">Tahun</th>
                <th className="py-3 px-2 text-center text-blue-700 font-bold">PG</th>
                <th className="py-3 px-2 text-center text-emerald-700 font-bold">Isian</th>
                <th className="py-3 px-2 text-center text-amber-700 font-bold">Esai</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Terakhir Disimpan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400">
                    <p className="text-sm">Belum ada draf naskah ujian.</p>
                    <p className="text-xs mt-1">Klik "+ Buat Ujian Baru" untuk memulai.</p>
                  </td>
                </tr>
              ) : (
                drafts.map((draft, idx) => {
                  const pgCount = draft.questions.filter(q => q.jenisSoal === 'PG').length;
                  const isianCount = draft.questions.filter(q => q.jenisSoal === 'ISIAN').length;
                  const esaiCount = draft.questions.filter(q => q.jenisSoal === 'ESAI').length;
                  const isCurrentActive = draft.identity.examId === activeExamId;

                  return (
                    <tr
                      key={draft.identity.examId}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrentActive ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 hover:text-blue-700 cursor-pointer" onClick={() => onSelectDraft(draft.identity.examId)}>
                          {draft.identity.namaUjian || 'Ujian Tanpa Judul'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ID: {draft.identity.examId}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {draft.identity.namaSekolah || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {draft.identity.mataPelajaran || '-'}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">
                        {draft.identity.kelas || '-'}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">
                        {draft.identity.tahunAjaran || '-'}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-blue-700 bg-blue-50/50">
                        {pgCount}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-700 bg-emerald-50/50">
                        {isianCount}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-amber-700 bg-amber-50/50">
                        {esaiCount}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(draft.identity.status)}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {draft.identity.updatedAt || draft.identity.createdAt || '-'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onSelectDraft(draft.identity.examId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                            title="Buka / Lanjutkan Pengisian"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                          <button
                            onClick={() => onDuplicateDraft(draft.identity.examId)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md"
                            title="Duplikat Draf Ujian"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onExportDraft(draft)}
                            className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md"
                            title="Ekspor 3 File Word"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteDraft(draft.identity.examId)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                            title="Hapus Draf"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
