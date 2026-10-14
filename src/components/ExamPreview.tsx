import React, { useState } from 'react';
import { 
  FileText, 
  Table as TableIcon, 
  KeyRound, 
  Printer, 
  Download,
  FileCheck,
  Columns,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ExamIdentity, Question } from '../types';
import { exportNaskahSoalDocx, exportKisiKisiDocx, exportKunciJawabanDocx } from '../utils/docxExport';
import { 
  exportNaskahSoalPdf, 
  exportKisiKisiPdf, 
  exportKunciJawabanPdf, 
  openPrintDirect 
} from '../utils/pdfExport';

interface ExamPreviewProps {
  identity: ExamIdentity;
  questions: Question[];
  onOpenExportModal?: () => void;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({ 
  identity, 
  questions,
  onOpenExportModal 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'naskah' | 'kisikisi' | 'kunci'>('naskah');
  const [previewLayout, setPreviewLayout] = useState<'2kolom' | '1kolom'>('2kolom');
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);

  const pgList = questions.filter(q => q.jenisSoal === 'PG');
  const isianList = questions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = questions.filter(q => q.jenisSoal === 'ESAI');

  let currentNo = 1;
  const pgNumbered = pgList.map(q => ({ ...q, noTampil: currentNo++ }));
  const isianNumbered = isianList.map(q => ({ ...q, noTampil: currentNo++ }));
  const esaiNumbered = esaiList.map(q => ({ ...q, noTampil: currentNo++ }));

  const handlePrint = () => {
    const type = activeSubTab === 'naskah' ? 'naskah' : (activeSubTab === 'kisikisi' ? 'kisi' : 'kunci');
    openPrintDirect(type, identity, questions, previewLayout);
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting('pdf');
      if (activeSubTab === 'naskah') {
        await exportNaskahSoalPdf(identity, questions, previewLayout);
      } else if (activeSubTab === 'kisikisi') {
        await exportKisiKisiPdf(identity, questions);
      } else {
        await exportKunciJawabanPdf(identity, questions);
      }
    } catch (err) {
      console.error('Gagal unduh PDF:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting('docx');
      if (activeSubTab === 'naskah') {
        await exportNaskahSoalDocx(identity, questions, previewLayout);
      } else if (activeSubTab === 'kisikisi') {
        await exportKisiKisiDocx(identity, questions);
      } else {
        await exportKunciJawabanDocx(identity, questions);
      }
    } catch (err) {
      console.error('Gagal unduh DOCX:', err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subnav & Actions */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 no-print">
        {/* Document Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            id="tab-sub-naskah"
            onClick={() => setActiveSubTab('naskah')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'naskah'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Naskah Soal ({previewLayout === '2kolom' ? '2 Kolom' : '1 Kolom'})
          </button>

          <button
            id="tab-sub-kisikisi"
            onClick={() => setActiveSubTab('kisikisi')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'kisikisi'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tabel Kisi-Kisi Soal
          </button>

          <button
            id="tab-sub-kunci"
            onClick={() => setActiveSubTab('kunci')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'kunci'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Kunci Jawaban & Rubrik
          </button>
        </div>

        {/* Layout Switcher (Only for Naskah) & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {activeSubTab === 'naskah' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px] px-1.5 font-medium hidden sm:inline flex items-center gap-1">
                <Columns className="w-3 h-3 text-slate-500" />
                Kolom:
              </span>
              <button
                type="button"
                onClick={() => setPreviewLayout('2kolom')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  previewLayout === '2kolom'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Kolom
              </button>
              <button
                type="button"
                onClick={() => setPreviewLayout('1kolom')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  previewLayout === '1kolom'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Kolom
              </button>
            </div>
          )}

          {/* Quick Print Button */}
          <button
            id="btn-print-preview"
            onClick={handlePrint}
            title="Cetak bersih atau simpan langsung ke PDF tanpa antarmuka web"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>

          {/* Quick PDF Button */}
          <button
            id="btn-export-current-pdf"
            disabled={isExporting !== null}
            onClick={handleExportPdf}
            title="Unduh dokumen ini dalam format PDF (100% rapi & anti-berantakan)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Unduh PDF</span>
          </button>

          {/* Quick Word Button */}
          <button
            id="btn-export-current-docx"
            disabled={isExporting !== null}
            onClick={handleExportDocx}
            title="Unduh dokumen ini dalam format Microsoft Word (.docx)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            {isExporting === 'docx' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Unduh Word</span>
          </button>

          {/* Full Export Center Button */}
          {onOpenExportModal && (
            <button
              id="btn-open-full-export-modal"
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Semua Dokumen (Word & PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Banner Format */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-blue-900 no-print">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <b>Tersedia 2 Versi Ekspor:</b> Gunakan <b>PDF</b> untuk hasil 100% presisi anti-berantakan, atau <b>Word (.docx)</b> jika naskah masih ingin disunting secara offline.
          </span>
        </div>
        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="font-bold underline text-blue-700 hover:text-blue-900 whitespace-nowrap shrink-0"
          >
            Buka Pilihan Format →
          </button>
        )}
      </div>

      {/* Paper Stage */}
      <div className="bg-slate-200/80 p-4 sm:p-8 rounded-xl flex justify-center overflow-x-auto">
        {/* SUBTAB 1: NASKAH SOAL (2 KOLOM ATAU 1 KOLOM) */}
        {activeSubTab === 'naskah' && (
          <div className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-xl rounded-sm font-times border border-slate-300 print:border-none print:shadow-none print:p-0">
            {/* Kop Surat Resmi */}
            <div className="flex items-center justify-between border-b-[3px] border-double border-black pb-2 mb-4">
              <div className="w-20 h-20 flex items-center justify-center">
                {identity.logoKiriUrl ? (
                  <img
                    src={identity.logoKiriUrl}
                    alt="Logo Kiri"
                    className="max-h-20 max-w-20 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 text-center p-1">
                    Logo Kiri
                  </div>
                )}
              </div>

              <div className="flex-1 text-center px-4">
                <div className="font-bold text-[12pt] uppercase tracking-wide leading-tight">
                  {identity.namaInstansi || 'PEMERINTAH KABUPATEN TANGERANG\nDINAS PENDIDIKAN'}
                </div>
                <div className="font-bold text-[14pt] uppercase tracking-wider leading-tight text-slate-900 mt-0.5">
                  {identity.namaSekolah || 'SD NEGERI KEDUNG DALAM 1'}
                </div>
                <div className="text-[9pt] italic text-slate-700 mt-1 leading-snug">
                  Alamat: Jl. Raya Mauk KM. 21, Kedung Dalam, Kec. Mauk, Kab. Tangerang, Banten
                </div>
              </div>

              <div className="w-20 h-20 flex items-center justify-center">
                {identity.logoKananUrl ? (
                  <img
                    src={identity.logoKananUrl}
                    alt="Logo Kanan"
                    className="max-h-20 max-w-20 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 text-center p-1">
                    Logo Kanan
                  </div>
                )}
              </div>
            </div>

            {/* Judul Naskah */}
            <div className="text-center mb-4">
              <div className="font-bold text-[13pt] uppercase">
                {identity.namaUjian || 'PENILAIAN SUMATIF AKHIR SEMESTER (SAS)'}
              </div>
              <div className="font-bold text-[11pt]">
                TAHUN AJARAN {identity.tahunAjaran || '2025/2026'}
              </div>
            </div>

            {/* Tabel Identitas Siswa Kotak Rapi */}
            <div className="border border-black p-3 mb-4 text-[10.5pt] grid grid-cols-2 gap-x-8 gap-y-1">
              <div>
                <span className="font-semibold inline-block w-32">Mata Pelajaran</span>
                <span>: {identity.mataPelajaran || '-'}</span>
              </div>
              <div>
                <span className="font-semibold inline-block w-32">Hari / Tanggal</span>
                <span>: {identity.hariTanggal || '-'}</span>
              </div>
              <div>
                <span className="font-semibold inline-block w-32">Kelas</span>
                <span>: {identity.kelas || '-'}</span>
              </div>
              <div>
                <span className="font-semibold inline-block w-32">Nama Siswa</span>
                <span>: ...............................................</span>
              </div>
            </div>

            {/* Petunjuk Pengerjaan */}
            <div className="mb-4">
              <div className="font-bold text-[10.5pt] uppercase mb-1">
                PETUNJUK PENGERJAAN:
              </div>
              <div className="text-[10pt] leading-relaxed whitespace-pre-line text-slate-800">
                {identity.petunjukPengerjaan || '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa kelengkapan lembar soal sebelum menjawab.\n3. Kerjakan terlebih dahulu soal yang dianggap mudah.'}
              </div>
            </div>

            <div className="border-t border-black my-4"></div>

            {/* Layout Soal Sesuai Pilihan Kolom (2 Kolom Mengalir atau 1 Kolom) */}
            <div className={previewLayout === '2kolom' ? 'columns-1 md:columns-2 gap-8 text-[11pt] leading-relaxed text-justify' : 'space-y-4 text-[11pt] leading-relaxed text-justify'}>
              {/* I. PILIHAN GANDA */}
              {pgNumbered.length > 0 && (
                <div className="break-inside-avoid-column mb-4">
                  <div className="font-bold text-[11pt] uppercase mb-1">
                    I. PILIHAN GANDA
                  </div>
                  <div className="italic text-[10pt] text-slate-700 mb-3">
                    Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling tepat!
                  </div>

                  <div className="space-y-3">
                    {pgNumbered.map((q) => (
                      <div key={q.questionId} className="break-inside-avoid mb-3">
                        <div className="flex items-start gap-1">
                          <span className="font-bold min-w-[20px]">{q.noTampil}.</span>
                          <span className="flex-1">{q.pertanyaan}</span>
                        </div>
                        {q.gambarUrl && (
                          <div className="my-2 ml-5">
                            <img
                              src={q.gambarUrl}
                              alt={q.gambarKeterangan || `Gambar Soal ${q.noTampil}`}
                              className="max-h-36 max-w-full rounded border border-slate-300 object-contain bg-white"
                            />
                            {q.gambarKeterangan && (
                              <div className="text-[9pt] italic text-slate-600 mt-0.5">
                                {q.gambarKeterangan}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="ml-5 mt-1 space-y-0.5">
                          <div>A. {q.opsiA}</div>
                          <div>B. {q.opsiB}</div>
                          <div>C. {q.opsiC}</div>
                          <div>D. {q.opsiD}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* II. ISIAN SINGKAT */}
              {isianNumbered.length > 0 && (
                <div className="break-inside-avoid-column mb-4">
                  <div className="font-bold text-[11pt] uppercase mb-1 mt-4">
                    II. ISIAN SINGKAT
                  </div>
                  <div className="italic text-[10pt] text-slate-700 mb-3">
                    Isilah titik-titik di bawah ini dengan jawaban yang tepat dan benar!
                  </div>

                  <div className="space-y-2.5">
                    {isianNumbered.map((q) => (
                      <div key={q.questionId} className="break-inside-avoid mb-2.5">
                        <div className="flex items-start gap-1">
                          <span className="font-bold min-w-[20px]">{q.noTampil}.</span>
                          <span className="flex-1">{q.pertanyaan}</span>
                        </div>
                        {q.gambarUrl && (
                          <div className="my-2 ml-5">
                            <img
                              src={q.gambarUrl}
                              alt={q.gambarKeterangan || `Gambar Soal ${q.noTampil}`}
                              className="max-h-36 max-w-full rounded border border-slate-300 object-contain bg-white"
                            />
                            {q.gambarKeterangan && (
                              <div className="text-[9pt] italic text-slate-600 mt-0.5">
                                {q.gambarKeterangan}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* III. ESAI / URAIAN */}
              {esaiNumbered.length > 0 && (
                <div className="break-inside-avoid-column mb-4">
                  <div className="font-bold text-[11pt] uppercase mb-1 mt-4">
                    III. ESAI / URAIAN
                  </div>
                  <div className="italic text-[10pt] text-slate-700 mb-3">
                    Jawablah pertanyaan-pertanyaan di bawah ini dengan uraian yang jelas dan lengkap!
                  </div>

                  <div className="space-y-3">
                    {esaiNumbered.map((q) => (
                      <div key={q.questionId} className="break-inside-avoid mb-3">
                        <div className="flex items-start gap-1">
                          <span className="font-bold min-w-[20px]">{q.noTampil}.</span>
                          <span className="flex-1">{q.pertanyaan}</span>
                        </div>
                        {q.gambarUrl && (
                          <div className="my-2 ml-5">
                            <img
                              src={q.gambarUrl}
                              alt={q.gambarKeterangan || `Gambar Soal ${q.noTampil}`}
                              className="max-h-36 max-w-full rounded border border-slate-300 object-contain bg-white"
                            />
                            {q.gambarKeterangan && (
                              <div className="text-[9pt] italic text-slate-600 mt-0.5">
                                {q.gambarKeterangan}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: KISI-KISI SOAL */}
        {activeSubTab === 'kisikisi' && (
          <div className="bg-white text-slate-900 w-[297mm] min-h-[210mm] p-8 shadow-xl rounded-sm font-times border border-slate-300 print:border-none print:shadow-none print:p-0">
            <div className="text-center mb-6">
              <div className="font-bold text-[14pt] uppercase">
                KISI-KISI PENULISAN SOAL UJIAN
              </div>
              <div className="font-bold text-[12pt] uppercase">
                {identity.namaSekolah || 'SD NEGERI KEDUNG DALAM 1'}
              </div>
              <div className="text-[10pt] mt-1 text-slate-700">
                Mata Pelajaran: {identity.mataPelajaran || '-'} | Kelas: {identity.kelas || '-'} | Tahun Ajaran: {identity.tahunAjaran || '-'}
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-[9pt]">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-black p-1.5 w-8">No</th>
                  <th className="border border-black p-1.5 w-10">No Soal</th>
                  <th className="border border-black p-1.5 w-24">Mata Pelajaran</th>
                  <th className="border border-black p-1.5 w-12">Kelas</th>
                  <th className="border border-black p-1.5 w-32">Materi Pokok</th>
                  <th className="border border-black p-1.5">Tujuan Pembelajaran (TP)</th>
                  <th className="border border-black p-1.5">Indikator Soal</th>
                  <th className="border border-black p-1.5 w-14">Level Kognitif</th>
                  <th className="border border-black p-1.5 w-20">Bentuk Soal</th>
                  <th className="border border-black p-1.5 w-12">Bobot</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={q.questionId} className="align-top">
                    <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                    <td className="border border-black p-1.5">{identity.mataPelajaran || '-'}</td>
                    <td className="border border-black p-1.5 text-center">{identity.kelas || '-'}</td>
                    <td className="border border-black p-1.5">{q.materi || '-'}</td>
                    <td className="border border-black p-1.5">{q.tujuanPembelajaran || '-'}</td>
                    <td className="border border-black p-1.5">{q.indikatorSoal || '-'}</td>
                    <td className="border border-black p-1.5 text-center font-semibold">{q.levelKognitif || 'C1'}</td>
                    <td className="border border-black p-1.5 text-center">
                      {q.jenisSoal === 'PG' ? 'Pilihan Ganda' : (q.jenisSoal === 'ISIAN' ? 'Isian Singkat' : 'Esai')}
                    </td>
                    <td className="border border-black p-1.5 text-center font-bold">{q.bobotNilai || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 3: KUNCI JAWABAN & RUBRIK */}
        {activeSubTab === 'kunci' && (
          <div className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-xl rounded-sm font-times border border-slate-300 print:border-none print:shadow-none print:p-0">
            <div className="text-center mb-6">
              <div className="font-bold text-[14pt] uppercase">
                KUNCI JAWABAN & PEDOMAN PENSKORAN
              </div>
              <div className="font-bold text-[12pt] uppercase">
                {identity.namaSekolah || 'SD NEGERI KEDUNG DALAM 1'}
              </div>
              <div className="text-[10pt] mt-1 text-slate-700">
                Mata Pelajaran: {identity.mataPelajaran || '-'} | Kelas: {identity.kelas || '-'} | Tahun Ajaran: {identity.tahunAjaran || '-'}
              </div>
            </div>

            {/* Tabel Kunci PG */}
            {pgNumbered.length > 0 && (
              <div className="mb-6">
                <div className="font-bold text-[11pt] uppercase mb-2">I. PILIHAN GANDA</div>
                <table className="w-full border-collapse border border-black text-[10pt]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-black p-2 w-14">No</th>
                      <th className="border border-black p-2">Kunci Jawaban</th>
                      <th className="border border-black p-2 w-28">Bobot Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pgNumbered.map((q) => (
                      <tr key={q.questionId}>
                        <td className="border border-black p-2 text-center">{q.noTampil}</td>
                        <td className="border border-black p-2 text-center font-bold text-[12pt] text-blue-950">
                          {q.kunciJawaban || '-'}
                        </td>
                        <td className="border border-black p-2 text-center">{q.bobotNilai || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabel Kunci Isian */}
            {isianNumbered.length > 0 && (
              <div className="mb-6">
                <div className="font-bold text-[11pt] uppercase mb-2">II. ISIAN SINGKAT</div>
                <table className="w-full border-collapse border border-black text-[10pt]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-black p-2 w-14">No</th>
                      <th className="border border-black p-2">Kunci Jawaban</th>
                      <th className="border border-black p-2 w-28">Bobot Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isianNumbered.map((q) => (
                      <tr key={q.questionId}>
                        <td className="border border-black p-2 text-center">{q.noTampil}</td>
                        <td className="border border-black p-2">{q.kunciJawaban || '-'}</td>
                        <td className="border border-black p-2 text-center">{q.bobotNilai || 2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabel Kunci & Rubrik Esai */}
            {esaiNumbered.length > 0 && (
              <div className="mb-6">
                <div className="font-bold text-[11pt] uppercase mb-2">III. ESAI / URAIAN (RUBRIK PENSKORAN)</div>
                <table className="w-full border-collapse border border-black text-[10pt]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-black p-2 w-14">No</th>
                      <th className="border border-black p-2">Pedoman Jawaban / Rubrik Penilaian</th>
                      <th className="border border-black p-2 w-28">Bobot Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {esaiNumbered.map((q) => (
                      <tr key={q.questionId} className="align-top">
                        <td className="border border-black p-2 text-center">{q.noTampil}</td>
                        <td className="border border-black p-2 whitespace-pre-line">{q.kunciJawaban || '-'}</td>
                        <td className="border border-black p-2 text-center">{q.bobotNilai || 5}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
