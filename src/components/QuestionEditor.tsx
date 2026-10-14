import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  HelpCircle,
  Hash,
  CheckCircle2,
  BookMarked,
  Image as ImageIcon,
  Upload,
  X,
  Sliders,
  Calculator,
  Sparkles,
  Minus,
  AlertCircle
} from 'lucide-react';
import { Question, QuestionType, CognitiveLevel } from '../types';

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ questions, onChange }) => {
  const [filterType, setFilterType] = useState<'ALL' | QuestionType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMathTarget, setActiveMathTarget] = useState<{ idx: number; field: 'pertanyaan' | 'opsiA' | 'opsiB' | 'opsiC' | 'opsiD' | 'kunciJawaban' } | null>(null);
  
  // State Pengaturan Bobot Manual Massal
  const [showBatchWeight, setShowBatchWeight] = useState(false);
  const [batchPgWeight, setBatchPgWeight] = useState(1);
  const [batchIsianWeight, setBatchIsianWeight] = useState(2);
  const [batchEsaiWeight, setBatchEsaiWeight] = useState(5);

  // In-app confirm modal for deleting question (eliminates window.confirm iframe restriction)
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<{ idx: number; nomor: number } | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const mathSymbols = ['±', '×', '÷', '²', '³', '½', '¼', '¾', '°', 'π', '√', '→', '≤', '≥', '≠'];

  // Add Question
  const handleAddQuestion = (jenis: QuestionType) => {
    const newQuestion: Question = {
      questionId: `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      examId: questions[0]?.examId || '',
      nomorSoal: questions.length + 1,
      jenisSoal: jenis,
      pertanyaan: '',
      opsiA: jenis === 'PG' ? '' : '',
      opsiB: jenis === 'PG' ? '' : '',
      opsiC: jenis === 'PG' ? '' : '',
      opsiD: jenis === 'PG' ? '' : '',
      kunciJawaban: jenis === 'PG' ? 'A' : '',
      materi: '',
      tujuanPembelajaran: '',
      indikatorSoal: '',
      levelKognitif: 'C1',
      bobotNilai: jenis === 'PG' ? batchPgWeight : (jenis === 'ISIAN' ? batchIsianWeight : batchEsaiWeight),
    };

    const updated = [...questions, newQuestion];
    reindexQuestions(updated);
  };

  const reindexQuestions = (list: Question[]) => {
    const reindexed = list.map((q, idx) => ({ ...q, nomorSoal: idx + 1 }));
    onChange(reindexed);
  };

  const handleUpdateField = (idx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  // Penerapan Bobot Massal Berdasarkan Jenis Soal
  const handleApplyBatchWeight = (jenis: QuestionType, weight: number) => {
    const updated = questions.map(q => {
      if (q.jenisSoal === jenis) {
        return { ...q, bobotNilai: weight };
      }
      return q;
    });
    onChange(updated);
  };

  // Upload Gambar dari Komputer (Base64)
  const handleImageUpload = (idx: number, file: File) => {
    if (!file) return;
    setImageUploadError(null);
    if (file.size > 2 * 1024 * 1024) {
      setImageUploadError('Ukuran file gambar maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      handleUpdateField(idx, 'gambarUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  // Sisipkan Contoh Gambar Diagram SD Cepat
  const handleInsertSampleImage = (idx: number, sampleType: 'pembiasan' | 'rantai') => {
    if (sampleType === 'pembiasan') {
      const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200" viewBox="0 0 360 200"><rect width="360" height="200" fill="#f8fafc" rx="8"/><rect x="110" y="50" width="140" height="120" rx="10" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/><line x1="110" y1="95" x2="250" y2="95" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5"/><line x1="150" y1="25" x2="175" y2="95" stroke="#b45309" stroke-width="6" stroke-linecap="round"/><line x1="175" y1="95" x2="215" y2="155" stroke="#b45309" stroke-width="6" stroke-linecap="round"/><text x="180" y="185" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#0369a1">Gelas Berisi Air Bening</text></svg>');
      const updated = [...questions];
      updated[idx] = {
        ...updated[idx],
        gambarUrl: svg,
        gambarKeterangan: 'Gambar: Percobaan pensil/sendok di dalam gelas bening berisi air',
      };
      onChange(updated);
    } else {
      const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="380" height="150" viewBox="0 0 380 150"><rect width="380" height="150" fill="#f0fdf4" rx="8"/><g font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle"><rect x="10" y="50" width="65" height="40" rx="6" fill="#86efac"/><text x="42" y="75" fill="#14532d">Padi</text><text x="95" y="75" fill="#16a34a">→</text><rect x="115" y="50" width="70" height="40" rx="6" fill="#bbf7d0"/><text x="150" y="75" fill="#14532d">Belalang</text><text x="205" y="75" fill="#16a34a">→</text><rect x="225" y="50" width="65" height="40" rx="6" fill="#bbf7d0"/><text x="257" y="75" fill="#14532d">Katak</text><text x="310" y="75" fill="#16a34a">→</text><rect x="330" y="50" width="40" height="40" rx="6" fill="#fecdd3"/><text x="350" y="75" fill="#881337">Ular</text></g><text x="190" y="130" font-family="Arial" font-size="11" text-anchor="middle" fill="#166534">Bagan Rantai Makanan Ekosistem Sawah</text></svg>');
      const updated = [...questions];
      updated[idx] = {
        ...updated[idx],
        gambarUrl: svg,
        gambarKeterangan: 'Gambar: Bagan Rantai Makanan Ekosistem Sawah',
      };
      onChange(updated);
    }
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    reindexQuestions(updated);
  };

  const handleDuplicate = (idx: number) => {
    const source = questions[idx];
    const copy: Question = {
      ...source,
      questionId: `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, copy);
    reindexQuestions(updated);
  };

  const triggerDelete = (idx: number, nomor: number) => {
    setDeleteConfirmQuestion({ idx, nomor });
  };

  const confirmDelete = () => {
    if (!deleteConfirmQuestion) return;
    const updated = questions.filter((_, i) => i !== deleteConfirmQuestion.idx);
    reindexQuestions(updated);
    setDeleteConfirmQuestion(null);
  };

  const insertSymbol = (sym: string) => {
    if (!activeMathTarget) return;
    const { idx, field } = activeMathTarget;
    const currentVal = (questions[idx][field] as string) || '';
    handleUpdateField(idx, field, currentVal + sym);
  };

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    const matchesType = filterType === 'ALL' || q.jenisSoal === filterType;
    const matchesSearch =
      searchQuery === '' ||
      q.pertanyaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.indikatorSoal.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const pgCount = questions.filter((q) => q.jenisSoal === 'PG').length;
  const isianCount = questions.filter((q) => q.jenisSoal === 'ISIAN').length;
  const esaiCount = questions.filter((q) => q.jenisSoal === 'ESAI').length;
  const totalScore = questions.reduce((acc, q) => acc + (q.bobotNilai || 1), 0);

  return (
    <div className="space-y-4">
      {/* Action Header & Quick Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">2. Daftar & Input Butir Soal</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Total {questions.length} Soal
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 mt-1">
            <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {pgCount} PG
            </span>
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {isianCount} Isian Singkat
            </span>
            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {esaiCount} Esai / Uraian
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-900 font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              Total Bobot: {totalScore} Poin
            </span>
          </div>
        </div>

        {/* Add Question Buttons & Batch Weight Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-toggle-batch-weight"
            type="button"
            onClick={() => setShowBatchWeight(!showBatchWeight)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              showBatchWeight
                ? 'bg-indigo-700 text-white border-indigo-700'
                : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Atur Bobot Massal</span>
          </button>
          <button
            id="btn-add-pg"
            onClick={() => handleAddQuestion('PG')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            + Pilihan Ganda
          </button>
          <button
            id="btn-add-isian"
            onClick={() => handleAddQuestion('ISIAN')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            + Isian Singkat
          </button>
          <button
            id="btn-add-esai"
            onClick={() => handleAddQuestion('ESAI')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            + Esai / Uraian
          </button>
        </div>
      </div>

      {/* Error Alert jika upload gambar gagal/kebesaran */}
      {imageUploadError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{imageUploadError}</span>
          </div>
          <button
            onClick={() => setImageUploadError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-0.5"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Panel Pengaturan Bobot Manual Massal & Rumus Nilai */}
      {showBatchWeight && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-md">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-indigo-950">Pengaturan Bobot / Skor Manual Massal</h4>
                <p className="text-xs text-indigo-700">Tentukan nilai default untuk setiap jenis soal atau terapkan serentak.</p>
              </div>
            </div>
            <div className="text-xs text-indigo-900 bg-white/80 px-3 py-1.5 rounded-lg border border-indigo-200">
              <span className="font-semibold">Rumus Konversi Nilai: </span>
              <span className="font-mono font-bold text-indigo-800">Nilai Siswa = (Skor Diperoleh / {totalScore || 100}) × 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PG Batch */}
            <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-col justify-between gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Pilihan Ganda (PG)</span>
                <span className="text-[11px] text-blue-600 font-semibold">{pgCount} Soal</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Bobot per soal:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchPgWeight}
                  onChange={(e) => setBatchPgWeight(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 text-center font-bold text-xs px-2 py-1 border border-slate-300 rounded bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBatchWeight('PG', batchPgWeight)}
                  className="ml-auto text-xs px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Isian Batch */}
            <div className="bg-white p-3 rounded-lg border border-emerald-200 flex flex-col justify-between gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Isian Singkat</span>
                <span className="text-[11px] text-emerald-600 font-semibold">{isianCount} Soal</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Bobot per soal:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchIsianWeight}
                  onChange={(e) => setBatchIsianWeight(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 text-center font-bold text-xs px-2 py-1 border border-slate-300 rounded bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBatchWeight('ISIAN', batchIsianWeight)}
                  className="ml-auto text-xs px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Esai Batch */}
            <div className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col justify-between gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Esai / Uraian</span>
                <span className="text-[11px] text-amber-600 font-semibold">{esaiCount} Soal</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Bobot per soal:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={batchEsaiWeight}
                  onChange={(e) => setBatchEsaiWeight(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 text-center font-bold text-xs px-2 py-1 border border-slate-300 rounded bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBatchWeight('ESAI', batchEsaiWeight)}
                  className="ml-auto text-xs px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Math & Quick Symbols Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-600 font-medium">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span>Simbol Matematika:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {mathSymbols.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => insertSymbol(sym)}
              className="px-2 py-0.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400 rounded transition-colors"
              title={`Sisipkan simbol ${sym}`}
            >
              {sym}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-400 italic">
          (Klik input/textarea soal terlebih dahulu)
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({questions.length})
          </button>
          <button
            onClick={() => setFilterType('PG')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'PG'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            PG ({pgCount})
          </button>
          <button
            onClick={() => setFilterType('ISIAN')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'ISIAN'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Isian ({isianCount})
          </button>
          <button
            onClick={() => setFilterType('ESAI')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'ESAI'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Esai ({esaiCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan / materi..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">Tidak ada soal yang sesuai dengan kriteria filter.</p>
            <p className="text-xs mt-1">Gunakan tombol di atas untuk menambahkan butir soal baru.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const actualIdx = questions.findIndex((item) => item.questionId === q.questionId);

            return (
              <div
                key={q.questionId}
                className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all border-l-4 ${
                  q.jenisSoal === 'PG'
                    ? 'border-l-blue-600'
                    : q.jenisSoal === 'ISIAN'
                    ? 'border-l-emerald-600'
                    : 'border-l-amber-600'
                }`}
              >
                {/* Question Header */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      #{q.nomorSoal}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        q.jenisSoal === 'PG'
                          ? 'bg-blue-100 text-blue-800'
                          : q.jenisSoal === 'ISIAN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.jenisSoal === 'PG'
                        ? 'PILIHAN GANDA'
                        : q.jenisSoal === 'ISIAN'
                        ? 'ISIAN SINGKAT'
                        : 'ESAI / URAIAN'}
                    </span>

                    {/* Pengaturan Manual Bobot Soal (Langsung di Header Soal) */}
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-600">Bobot:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(actualIdx, 'bobotNilai', Math.max(1, (q.bobotNilai || 1) - 1))}
                        className="w-4 h-4 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600"
                        title="Kurangi 1 Poin"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.bobotNilai || 1}
                        onChange={(e) => handleUpdateField(actualIdx, 'bobotNilai', Math.max(1, Number(e.target.value) || 1))}
                        className="w-9 text-center font-bold text-xs text-indigo-700 bg-slate-50 border border-slate-200 rounded py-0.5"
                        title="Ubah manual bobot nilai soal ini"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateField(actualIdx, 'bobotNilai', (q.bobotNilai || 1) + 1)}
                        className="w-4 h-4 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600"
                        title="Tambah 1 Poin"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-medium">Poin</span>
                    </div>
                  </div>

                  {/* Actions (Reorder, Duplicate, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={actualIdx === 0}
                      onClick={() => handleMove(actualIdx, 'up')}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded disabled:opacity-30"
                      title="Naikkan Urutan Soal"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={actualIdx === questions.length - 1}
                      onClick={() => handleMove(actualIdx, 'down')}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded disabled:opacity-30"
                      title="Turunkan Urutan Soal"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(actualIdx)}
                      className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Duplikat Soal Ini"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDelete(actualIdx, q.nomorSoal)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-4 space-y-3">
                  {/* Pertanyaan Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pertanyaan Soal *
                    </label>
                    <textarea
                      rows={3}
                      value={q.pertanyaan}
                      onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'pertanyaan' })}
                      onChange={(e) => handleUpdateField(actualIdx, 'pertanyaan', e.target.value)}
                      placeholder="Tuliskan butir soal pertanyaan di sini..."
                      className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-serif"
                    />
                  </div>

                  {/* Bagian Gambar Stimulus / Ilustrasi Soal */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        Gambar Stimulus / Ilustrasi Soal (Opsional)
                      </span>
                      {q.gambarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateField(actualIdx, 'gambarUrl', '');
                            handleUpdateField(actualIdx, 'gambarKeterangan', '');
                          }}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus Gambar
                        </button>
                      )}
                    </div>

                    {q.gambarUrl ? (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-200">
                          <img
                            src={q.gambarUrl}
                            alt="Ilustrasi Soal"
                            className="max-h-36 max-w-full object-contain rounded border border-slate-200 bg-white"
                          />
                          <div className="flex-1 w-full space-y-2">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Keterangan / Caption Gambar (Misal: Gambar 1. Percobaan Sifat Cahaya)
                              </label>
                              <input
                                type="text"
                                value={q.gambarKeterangan || ''}
                                onChange={(e) => handleUpdateField(actualIdx, 'gambarKeterangan', e.target.value)}
                                placeholder="Contoh: Perhatikan gambar rantai makanan di atas untuk menjawab..."
                                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[actualIdx]?.click()}
                                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" /> Ganti Gambar
                              </button>
                              <input
                                ref={(el) => { fileInputRefs.current[actualIdx] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(actualIdx, file);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[actualIdx]?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Unggah Gambar dari Komputer</span>
                        </button>
                        <input
                          ref={(el) => { fileInputRefs.current[actualIdx] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(actualIdx, file);
                          }}
                        />

                        <input
                          type="text"
                          placeholder="Atau tempel URL gambar web (https://...)"
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleUpdateField(actualIdx, 'gambarUrl', e.target.value.trim());
                              e.target.value = '';
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              handleUpdateField(actualIdx, 'gambarUrl', e.currentTarget.value.trim());
                              e.currentTarget.value = '';
                            }
                          }}
                          className="flex-1 min-w-[200px] text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400"
                        />

                        {/* Quick Presets for Demo */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleInsertSampleImage(actualIdx, 'pembiasan')}
                            className="text-[11px] px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-medium"
                            title="Sisipkan diagram pembiasan cahaya sendok dalam air"
                          >
                            + Diagram Sains
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertSampleImage(actualIdx, 'rantai')}
                            className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-medium"
                            title="Sisipkan diagram rantai makanan sawah"
                          >
                            + Rantai Makanan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* If PILIHAN GANDA */}
                  {q.jenisSoal === 'PG' && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option A */}
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300">
                            A
                          </span>
                          <input
                            type="text"
                            value={q.opsiA}
                            onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'opsiA' })}
                            onChange={(e) => handleUpdateField(actualIdx, 'opsiA', e.target.value)}
                            placeholder="Teks Opsi A..."
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </div>

                        {/* Option B */}
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300">
                            B
                          </span>
                          <input
                            type="text"
                            value={q.opsiB}
                            onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'opsiB' })}
                            onChange={(e) => handleUpdateField(actualIdx, 'opsiB', e.target.value)}
                            placeholder="Teks Opsi B..."
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </div>

                        {/* Option C */}
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300">
                            C
                          </span>
                          <input
                            type="text"
                            value={q.opsiC}
                            onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'opsiC' })}
                            onChange={(e) => handleUpdateField(actualIdx, 'opsiC', e.target.value)}
                            placeholder="Teks Opsi C..."
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </div>

                        {/* Option D */}
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300">
                            D
                          </span>
                          <input
                            type="text"
                            value={q.opsiD}
                            onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'opsiD' })}
                            onChange={(e) => handleUpdateField(actualIdx, 'opsiD', e.target.value)}
                            placeholder="Teks Opsi D..."
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-700" />
                          <label className="text-xs font-bold text-slate-700">Kunci Jawaban PG * :</label>
                          <div className="inline-flex gap-1">
                            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleUpdateField(actualIdx, 'kunciJawaban', opt)}
                                className={`w-7 h-7 rounded font-bold text-xs transition-colors ${
                                  q.kunciJawaban === opt
                                    ? 'bg-blue-700 text-white shadow-xs'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 ml-auto">
                          <label className="text-xs font-bold text-slate-700">Bobot Skor PG:</label>
                          <div className="inline-flex items-center gap-1">
                            {[1, 2, 3].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleUpdateField(actualIdx, 'bobotNilai', val)}
                                className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                                  q.bobotNilai === val
                                    ? 'bg-blue-700 text-white font-bold border-blue-700'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.bobotNilai || 1}
                            onChange={(e) => handleUpdateField(actualIdx, 'bobotNilai', Math.max(1, Number(e.target.value) || 1))}
                            className="w-14 text-xs px-2 py-1 bg-white border border-slate-300 rounded-md text-center font-bold text-blue-700"
                            title="Atur manual bobot poin"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If ISIAN SINGKAT */}
                  {q.jenisSoal === 'ISIAN' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-emerald-900 mb-1">
                          Kunci Jawaban Isian Singkat *
                        </label>
                        <input
                          type="text"
                          value={q.kunciJawaban}
                          onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'kunciJawaban' })}
                          onChange={(e) => handleUpdateField(actualIdx, 'kunciJawaban', e.target.value)}
                          placeholder="Jawaban singkat yang tepat..."
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-emerald-900">
                            Bobot Skor Isian:
                          </label>
                          <div className="inline-flex items-center gap-1">
                            {[2, 3, 4].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleUpdateField(actualIdx, 'bobotNilai', val)}
                                className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                                  q.bobotNilai === val
                                    ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={q.bobotNilai || 2}
                          onChange={(e) => handleUpdateField(actualIdx, 'bobotNilai', Math.max(1, Number(e.target.value) || 2))}
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md text-center font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  )}

                  {/* If ESAI / URAIAN */}
                  {q.jenisSoal === 'ESAI' && (
                    <div className="space-y-2 bg-amber-50/40 p-3 rounded-lg border border-amber-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-xs font-bold text-amber-900">
                          Pedoman Jawaban / Rubrik Penskoran Esai *
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-amber-900">Bobot Skor Esai:</label>
                          <div className="inline-flex items-center gap-1">
                            {[3, 4, 5, 10].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleUpdateField(actualIdx, 'bobotNilai', val)}
                                className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                                  q.bobotNilai === val
                                    ? 'bg-amber-700 text-white font-bold border-amber-700'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.bobotNilai || 5}
                            onChange={(e) => handleUpdateField(actualIdx, 'bobotNilai', Math.max(1, Number(e.target.value) || 5))}
                            className="w-14 text-xs px-2 py-1 bg-white border border-slate-300 rounded-md text-center font-bold text-amber-700"
                          />
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={q.kunciJawaban}
                        onFocus={() => setActiveMathTarget({ idx: actualIdx, field: 'kunciJawaban' })}
                        onChange={(e) => handleUpdateField(actualIdx, 'kunciJawaban', e.target.value)}
                        placeholder="Pedoman jawaban siswa dan kriteria rubrik penskoran..."
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-hidden"
                      />
                    </div>
                  )}

                  {/* Curriculum & Kisi-kisi metadata collapse */}
                  <details className="mt-2 bg-slate-50 rounded-lg border border-slate-200 p-2.5 text-xs">
                    <summary className="cursor-pointer font-semibold text-slate-700 flex items-center gap-1.5 select-none">
                      <BookMarked className="w-3.5 h-3.5 text-blue-700" />
                      <span>Parameter Kisi-Kisi (Materi, Tujuan Pembelajaran, Indikator, Level Kognitif)</span>
                    </summary>

                    <div className="pt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Materi Pembelajaran</label>
                          <input
                            type="text"
                            value={q.materi}
                            onChange={(e) => handleUpdateField(actualIdx, 'materi', e.target.value)}
                            placeholder="Materi pokok..."
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Tujuan Pembelajaran (TP)</label>
                          <input
                            type="text"
                            value={q.tujuanPembelajaran}
                            onChange={(e) => handleUpdateField(actualIdx, 'tujuanPembelajaran', e.target.value)}
                            placeholder="Tujuan pembelajaran..."
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Indikator Soal</label>
                          <input
                            type="text"
                            value={q.indikatorSoal}
                            onChange={(e) => handleUpdateField(actualIdx, 'indikatorSoal', e.target.value)}
                            placeholder="Disajikan teks/kasus, siswa dapat..."
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Level Kognitif</label>
                          <select
                            value={q.levelKognitif}
                            onChange={(e) => handleUpdateField(actualIdx, 'levelKognitif', e.target.value as CognitiveLevel)}
                            className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
                          >
                            <option value="C1">C1 - Mengingat</option>
                            <option value="C2">C2 - Memahami</option>
                            <option value="C3">C3 - Mengaplikasikan</option>
                            <option value="C4">C4 - Menganalisis</option>
                            <option value="C5">C5 - Mengevaluasi</option>
                            <option value="C6">C6 - Mencipta</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Konfirmasi Hapus Soal (Pengganti window.confirm) */}
      {deleteConfirmQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                Hapus Soal Nomor {deleteConfirmQuestion.nomor}?
              </h3>
              <p className="text-xs text-slate-500">
                Soal ini akan dihapus dari naskah ujian dan penomoran soal berikutnya akan otomatis disesuaikan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmQuestion(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Ya, Hapus Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
