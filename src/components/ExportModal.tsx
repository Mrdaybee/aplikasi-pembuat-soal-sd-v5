import React, { useState } from 'react';
import { 
  X, 
  FileCheck, 
  Download, 
  FileText, 
  Table as TableIcon, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Printer,
  FileCode2,
  Sparkles,
  Layers
} from 'lucide-react';
import { ExamIdentity, Question } from '../types';
import { exportNaskahSoalDocx, exportKisiKisiDocx, exportKunciJawabanDocx } from '../utils/docxExport';
import { 
  exportNaskahSoalPdf, 
  exportKisiKisiPdf, 
  exportKunciJawabanPdf, 
  openPrintDirect 
} from '../utils/pdfExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: ExamIdentity;
  questions: Question[];
  onMarkExported: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  identity,
  questions,
  onMarkExported,
}) => {
  const [activeFormatTab, setActiveFormatTab] = useState<'word' | 'pdf'>('pdf');
  const [naskahLayout, setNaskahLayout] = useState<'2kolom' | '1kolom'>('2kolom');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanSchool = (identity.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const cleanUjian = (identity.namaUjian || 'Ujian').replace(/[^a-zA-Z0-9 ]/g, '').trim();

  // Validation
  const hasSchoolName = Boolean(identity.namaSekolah?.trim());
  const hasExamName = Boolean(identity.namaUjian?.trim());
  const hasQuestions = questions.length > 0;
  const incompleteQuestions = questions.filter(q => !q.pertanyaan?.trim());

  // Handler Download Single DOCX
  const handleDownloadSingleDocx = async (type: 'naskah' | 'kisi' | 'kunci') => {
    try {
      setExportError(null);
      setDownloading(`docx-${type}`);
      if (type === 'naskah') {
        await exportNaskahSoalDocx(identity, questions, naskahLayout);
      } else if (type === 'kisi') {
        await exportKisiKisiDocx(identity, questions);
      } else if (type === 'kunci') {
        await exportKunciJawabanDocx(identity, questions);
      }
      onMarkExported();
    } catch (err) {
      console.error('Error downloading docx:', err);
      setExportError('Gagal membuat dokumen Word: ' + String(err));
    } finally {
      setDownloading(null);
    }
  };

  // Handler Download All DOCX
  const handleDownloadAllDocx = async () => {
    try {
      setExportError(null);
      setDownloading('docx-all');
      await exportNaskahSoalDocx(identity, questions, naskahLayout);
      await new Promise(r => setTimeout(r, 600));
      await exportKisiKisiDocx(identity, questions);
      await new Promise(r => setTimeout(r, 600));
      await exportKunciJawabanDocx(identity, questions);
      onMarkExported();
    } catch (err) {
      console.error('Error downloading all docx:', err);
      setExportError('Gagal membuat dokumen Word: ' + String(err));
    } finally {
      setDownloading(null);
    }
  };

  // Handler Download Single PDF
  const handleDownloadSinglePdf = async (type: 'naskah' | 'kisi' | 'kunci') => {
    try {
      setExportError(null);
      setDownloading(`pdf-${type}`);
      if (type === 'naskah') {
        await exportNaskahSoalPdf(identity, questions, naskahLayout);
      } else if (type === 'kisi') {
        await exportKisiKisiPdf(identity, questions);
      } else if (type === 'kunci') {
        await exportKunciJawabanPdf(identity, questions);
      }
      onMarkExported();
    } catch (err) {
      console.error('Error downloading pdf:', err);
      setExportError('Gagal membuat dokumen PDF: ' + String(err));
    } finally {
      setDownloading(null);
    }
  };

  // Handler Download All PDF
  const handleDownloadAllPdf = async () => {
    try {
      setExportError(null);
      setDownloading('pdf-all');
      await exportNaskahSoalPdf(identity, questions, naskahLayout);
      await new Promise(r => setTimeout(r, 750));
      await exportKisiKisiPdf(identity, questions);
      await new Promise(r => setTimeout(r, 750));
      await exportKunciJawabanPdf(identity, questions);
      onMarkExported();
    } catch (err) {
      console.error('Error downloading all pdf:', err);
      setExportError('Gagal membuat paket dokumen PDF: ' + String(err));
    } finally {
      setDownloading(null);
    }
  };

  // Handler Print Direct (Native Vector Print to PDF)
  const handlePrint = (type: 'naskah' | 'kisi' | 'kunci') => {
    openPrintDirect(type, identity, questions, naskahLayout);
    onMarkExported();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Pusat Ekspor Dokumen Ujian</span>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  2 Versi: PDF & Word
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih format yang diinginkan: PDF (Presisi 100% Anti-Berantakan) atau Word (.docx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pemilihan Versi Format (Word vs PDF) */}
        <div className="bg-slate-100/90 p-2 border-b border-slate-200 flex items-center gap-2">
          <button
            id="tab-export-pdf"
            type="button"
            onClick={() => setActiveFormatTab('pdf')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeFormatTab === 'pdf'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Versi PDF (.pdf) — Rekomendasi Resmi</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
              activeFormatTab === 'pdf' ? 'bg-red-700 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              Anti-Berantakan
            </span>
          </button>

          <button
            id="tab-export-word"
            type="button"
            onClick={() => setActiveFormatTab('word')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeFormatTab === 'word'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Versi Word (.docx) — Bisa Diedit</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Error Banner jika ekspor gagal */}
          {exportError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Terjadi Kendala Ekspor:</span>
                <p className="mt-0.5 text-rose-700">{exportError}</p>
              </div>
              <button
                onClick={() => setExportError(null)}
                className="text-rose-500 hover:text-rose-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Pengaturan Pilihan Layout Naskah (2 Kolom vs 1 Kolom) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Tata Letak Naskah Soal:
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {naskahLayout === '2kolom' 
                  ? 'Format 2 kolom mengalir hemat kertas ujian resmi sekolah dasar.' 
                  : 'Format 1 kolom memanjang, sangat mudah diedit dan 100% stabil di semua aplikasi.'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setNaskahLayout('2kolom')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  naskahLayout === '2kolom'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Kolom (Hemat Kertas)
              </button>
              <button
                type="button"
                onClick={() => setNaskahLayout('1kolom')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  naskahLayout === '1kolom'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Kolom (Standar Rapi)
              </button>
            </div>
          </div>

          {/* Catatan Validasi Kualitas */}
          {(!hasSchoolName || !hasExamName || !hasQuestions || incompleteQuestions.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Catatan Pengecekan Kualitas Dokumen:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-700">
                  {!hasSchoolName && <li>Nama sekolah belum diisi lengkap pada Identitas.</li>}
                  {!hasExamName && <li>Nama ujian belum diisi.</li>}
                  {!hasQuestions && <li>Belum ada butir soal yang ditambahkan.</li>}
                  {incompleteQuestions.length > 0 && (
                    <li>Terdapat {incompleteQuestions.length} butir soal dengan teks pertanyaan kosong.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB KONTEN 1: VERSI PDF
             ======================================================== */}
          {activeFormatTab === 'pdf' && (
            <div className="space-y-3">
              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3 text-red-950 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <b>Keunggulan Versi PDF:</b> Layout terkunci sempurna di semua perangkat, font Times New Roman asli, kop garis ganda resmi, dan tidak akan bergeser saat dicetak.
                </span>
              </div>

              {/* PDF Card 1: Naskah Soal */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-red-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>1. Naskah Soal Ujian (PDF)</span>
                      <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-semibold">
                        {naskahLayout === '2kolom' ? '2 Kolom A4' : '1 Kolom A4'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cleanSchool} - {cleanUjian} - Naskah Soal.pdf
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Kop Surat Garis Ganda, Identitas Kotak, Diagram Rapi, Pilihan A/B/C/D</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    title="Cetak atau Simpan PDF resolusi tinggi langsung"
                    onClick={() => handlePrint('naskah')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => handleDownloadSinglePdf('naskah')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {downloading === 'pdf-naskah' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Unduh .PDF</span>
                  </button>
                </div>
              </div>

              {/* PDF Card 2: Kisi-Kisi Soal */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-red-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>2. Tabel Kisi-Kisi Penulisan Soal (PDF)</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                        A4 Landscape
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cleanSchool} - {cleanUjian} - Kisi-Kisi.pdf
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>10 Kolom Bergaris: Materi, TP, Indikator, Level Kognitif & Bobot</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    title="Cetak langsung Kisi-Kisi Landscape"
                    onClick={() => handlePrint('kisi')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => handleDownloadSinglePdf('kisi')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {downloading === 'pdf-kisi' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Unduh .PDF</span>
                  </button>
                </div>
              </div>

              {/* PDF Card 3: Kunci Jawaban & Rubrik */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-red-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>3. Kunci Jawaban & Rubrik Penskoran (PDF)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        A4 Portrait
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cleanSchool} - {cleanUjian} - Kunci Jawaban.pdf
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Kunci PG, Kunci Isian & Rubrik Penilaian Esai Lengkap</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    title="Cetak langsung Kunci Jawaban"
                    onClick={() => handlePrint('kunci')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => handleDownloadSinglePdf('kunci')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {downloading === 'pdf-kunci' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Unduh .PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB KONTEN 2: VERSI WORD (.DOCX)
             ======================================================== */}
          {activeFormatTab === 'word' && (
            <div className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-blue-950 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <b>Versi Word (.docx) Telah Dioptimasi:</b> Dilengkapi section mengalir tanpa lompat halaman kosong, logo kop surat, garis ganda resmi, dan tabel bergaris rapi.
                </span>
              </div>

              {/* DOCX Card 1: Naskah Soal */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>1. File Naskah Soal Ujian (.docx)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                        {naskahLayout === '2kolom' ? '2 Kolom Mengalir' : '1 Kolom Rapi'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cleanSchool} - {cleanUjian} - Naskah Soal.docx
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Times New Roman, Kop Surat Ganda, Identitas Kotak, Gambar Proporsional</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => handleDownloadSingleDocx('naskah')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                >
                  {downloading === 'docx-naskah' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh .DOCX</span>
                </button>
              </div>

              {/* DOCX Card 2: Kisi-Kisi Soal */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>2. File Kisi-Kisi Penulisan Soal (.docx)</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                        Tabel Landscape
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cleanSchool} - {cleanUjian} - Kisi-Kisi.docx
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Border Solid, Lebar Kolom Ditentukan, Text Wrap Rapih</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => handleDownloadSingleDocx('kisi')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                >
                  {downloading === 'docx-kisi' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh .DOCX</span>
                </button>
              </div>

              {/* DOCX Card 3: Kunci Jawaban & Rubrik */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>3. File Kunci Jawaban & Pedoman Penskoran (.docx)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        Rubrik Nilai
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cleanSchool} - {cleanUjian} - Kunci Jawaban.docx
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tabel bergaris jelas untuk PG, Isian & Rubrik Esai</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => handleDownloadSingleDocx('kunci')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                >
                  {downloading === 'docx-kunci' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh .DOCX</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal dengan Tombol Unduh Massal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Total {questions.length} butir soal siap diekspor ke {activeFormatTab === 'pdf' ? 'PDF' : 'Microsoft Word'}.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Tutup
            </button>

            {activeFormatTab === 'pdf' ? (
              <button
                type="button"
                disabled={downloading !== null}
                onClick={handleDownloadAllPdf}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {downloading === 'pdf-all' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Menyiapkan Paket PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh Semua Dokumen PDF (.pdf)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={downloading !== null}
                onClick={handleDownloadAllDocx}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {downloading === 'docx-all' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengunduh 3 File Word...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh Semua File Word (.docx)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
