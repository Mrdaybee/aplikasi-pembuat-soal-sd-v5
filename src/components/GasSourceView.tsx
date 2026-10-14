import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { gasSourceCode } from '../data/gasSourceCode';

export const GasSourceView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<'Code.gs' | 'Index.html' | 'CSS.html' | 'JavaScript.html'>('Code.gs');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (selectedFile) {
      case 'Code.gs':
        return gasSourceCode.codeGs;
      case 'Index.html':
        return gasSourceCode.indexHtml;
      case 'CSS.html':
        return gasSourceCode.cssHtml;
      case 'JavaScript.html':
        return gasSourceCode.javascriptHtml;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const code = getActiveCode();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Installation Guide Banner */}
      <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-800/80 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Google Apps Script Standalone Web App Deployment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Source Code Google Apps Script (Siap Pakai & Pasang)
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Seluruh kode backend Apps Script, database Google Spreadsheet otomatis, UI HTML, CSS Times New Roman, dan JavaScript frontend telah siap 100%. Salin atau unduh file di bawah ini ke editor Apps Script Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://script.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-blue-950 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
            >
              <span>Buka Google Apps Script</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Step by step installation checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-800/60 text-xs">
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
            <div className="font-bold text-blue-300 mb-1">Langkah 1</div>
            <div>Buka Google Spreadsheet baru atau Google Apps Script (script.google.com).</div>
          </div>
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
            <div className="font-bold text-blue-300 mb-1">Langkah 2</div>
            <div>Buat 4 file dengan nama persis: <span className="font-mono text-amber-300">Code.gs</span>, <span className="font-mono text-amber-300">Index.html</span>, <span className="font-mono text-amber-300">CSS.html</span>, <span className="font-mono text-amber-300">JavaScript.html</span>.</div>
          </div>
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
            <div className="font-bold text-blue-300 mb-1">Langkah 3</div>
            <div>Jalankan fungsi <span className="font-mono text-emerald-300">initDatabase()</span> satu kali untuk menginisialisasi sheet database otomatis.</div>
          </div>
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
            <div className="font-bold text-blue-300 mb-1">Langkah 4</div>
            <div>Klik Deploy → New Deployment → Web App → Access: "Anyone". Selesai!</div>
          </div>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Editor Toolbar */}
        <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['Code.gs', 'Index.html', 'CSS.html', 'JavaScript.html'] as const).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  selectedFile === fileName
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </button>
            ))}
          </div>

          {/* Actions: Copy & Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin {selectedFile}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
              title={`Unduh file ${selectedFile}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-900 selection:bg-blue-600 selection:text-white">
          <pre>
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>

      {/* Database Sheet Architecture Documentation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Info className="w-5 h-5 text-blue-700" />
          <span>Struktur Tabel Database Spreadsheet yang Dibuat Otomatis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>Sheet: DATA_UJIAN</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">Identitas Ujian</span>
            </div>
            <p className="text-slate-600 mb-3">Menyimpan metadata kop surat, sekolah, jenjang kelas, dan status pengerjaan.</p>
            <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 space-y-1">
              <div>1. ID_UJIAN (Primary Key)</div>
              <div>2. NAMA_INSTANSI</div>
              <div>3. NAMA_SEKOLAH</div>
              <div>4. NAMA_UJIAN</div>
              <div>5. TAHUN_AJARAN</div>
              <div>6. MATA_PELAJARAN</div>
              <div>7. KELAS</div>
              <div>8. HARI_TANGGAL</div>
              <div>9. PETUNJUK_PENGERJAAN</div>
              <div>10. STATUS</div>
              <div>11. LOGO_KIRI_URL & LOGO_KANAN_URL</div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>Sheet: BUTIR_SOAL</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">Bank & Butir Soal</span>
            </div>
            <p className="text-slate-600 mb-3">Menyimpan setiap butir soal, opsi A-D, kunci jawaban, dan kisi-kisi kurikulum.</p>
            <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 space-y-1">
              <div>1. ID_SOAL (Primary Key)</div>
              <div>2. ID_UJIAN (Foreign Key)</div>
              <div>3. NOMOR_SOAL</div>
              <div>4. JENIS_SOAL (PG / ISIAN / ESAI)</div>
              <div>5. PERTANYAAN</div>
              <div>6. OPSI_A, OPSI_B, OPSI_C, OPSI_D</div>
              <div>7. KUNCI_JAWABAN</div>
              <div>8. MATERI</div>
              <div>9. TUJUAN_PEMBELAJARAN</div>
              <div>10. INDIKATOR_SOAL</div>
              <div>11. LEVEL_KOGNITIF (C1 - C6)</div>
              <div>12. BOBOT_NILAI</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Fungsi initDatabase() di Code.gs akan otomatis membuat kedua sheet di atas jika belum ada.</span>
        </div>
      </div>
    </div>
  );
};
