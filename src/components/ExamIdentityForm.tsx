import React, { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, School, BookOpen, AlertCircle } from 'lucide-react';
import { ExamIdentity } from '../types';

interface ExamIdentityFormProps {
  identity: ExamIdentity;
  onChange: (updated: Partial<ExamIdentity>) => void;
}

export const ExamIdentityForm: React.FC<ExamIdentityFormProps> = ({ identity, onChange }) => {
  const fileInputKiriRef = useRef<HTMLInputElement>(null);
  const fileInputKananRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, position: 'kiri' | 'kanan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setLogoError('Format logo harus berupa file gambar PNG, JPG, atau JPEG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Ukuran logo maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (position === 'kiri') {
        onChange({ logoKiriUrl: base64 });
      } else {
        onChange({ logoKananUrl: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (position: 'kiri' | 'kanan') => {
    if (position === 'kiri') {
      onChange({ logoKiriUrl: '', logoKiriFileId: '' });
      if (fileInputKiriRef.current) fileInputKiriRef.current.value = '';
    } else {
      onChange({ logoKananUrl: '', logoKananFileId: '' });
      if (fileInputKananRef.current) fileInputKananRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-blue-700" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">1. Identitas Kop Surat & Ujian</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Disesuaikan standar naskah ujian resmi sekolah dasar
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Error Alert Logo */}
        {logoError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{logoError}</span>
            </div>
            <button
              onClick={() => setLogoError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-0.5"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Logo Kiri & Kanan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Logo Kiri */}
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/50 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-slate-700 mb-2">Logo Kiri (Pemda / Dinas Pendidikan)</span>
            <div className="w-24 h-20 bg-white border border-slate-200 rounded-md flex items-center justify-center overflow-hidden mb-2 shadow-2xs">
              {identity.logoKiriUrl ? (
                <img src={identity.logoKiriUrl} alt="Logo Kiri" className="max-h-full max-w-full object-contain p-1" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 text-[10px]">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                  <span>Belum ada</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputKiriRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => handleLogoUpload(e, 'kiri')}
              />
              <button
                type="button"
                onClick={() => fileInputKiriRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>{identity.logoKiriUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
              </button>
              {identity.logoKiriUrl && (
                <button
                  type="button"
                  onClick={() => removeLogo('kiri')}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-md"
                  title="Hapus Logo Kiri"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Logo Kanan */}
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/50 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-slate-700 mb-2">Logo Kanan (Tut Wuri Handayani / Sekolah)</span>
            <div className="w-24 h-20 bg-white border border-slate-200 rounded-md flex items-center justify-center overflow-hidden mb-2 shadow-2xs">
              {identity.logoKananUrl ? (
                <img src={identity.logoKananUrl} alt="Logo Kanan" className="max-h-full max-w-full object-contain p-1" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 text-[10px]">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                  <span>Belum ada</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputKananRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => handleLogoUpload(e, 'kanan')}
              />
              <button
                type="button"
                onClick={() => fileInputKananRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>{identity.logoKananUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
              </button>
              {identity.logoKananUrl && (
                <button
                  type="button"
                  onClick={() => removeLogo('kanan')}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-md"
                  title="Hapus Logo Kanan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Kop Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Instansi (Kop Surat 14 pt Bold)
            </label>
            <textarea
              rows={2}
              value={identity.namaInstansi}
              onChange={(e) => onChange({ namaInstansi: e.target.value })}
              placeholder="Contoh: PEMERINTAH DAERAH PROVINSI DKI JAKARTA&#10;DINAS PENDIDIKAN DASAR"
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Sekolah * (Kop Surat 16 pt Bold)
            </label>
            <input
              type="text"
              value={identity.namaSekolah}
              onChange={(e) => onChange({ namaSekolah: e.target.value })}
              placeholder="Contoh: SD NEGERI RAWAMANGUN 01 PAGI"
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-semibold uppercase"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Otomatis diformat huruf kapital tebal di Word</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Ujian * (Kop Surat 18 pt Bold)
            </label>
            <input
              type="text"
              value={identity.namaUjian}
              onChange={(e) => onChange({ namaUjian: e.target.value })}
              placeholder="Contoh: PENILAIAN SUMATIF AKHIR SEMESTER (SAS)"
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-semibold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tahun Ajaran * (Kop Surat 12 pt)
            </label>
            <input
              type="text"
              value={identity.tahunAjaran}
              onChange={(e) => onChange({ tahunAjaran: e.target.value })}
              placeholder="Contoh: 2026/2027"
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Identitas Naskah Soal Siswa (Sesuai Permintaan: 4 Data Utama)
              </h4>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Format Bersih (Tanpa Nilai & Paraf)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {/* Kolom Kiri */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Mata Pelajaran *
                </label>
                <input
                  type="text"
                  value={identity.mataPelajaran}
                  onChange={(e) => onChange({ mataPelajaran: e.target.value })}
                  placeholder="Contoh: Ilmu Pengetahuan Alam dan Sosial (IPAS)"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Nama Siswa (Titik-Titik / Format Lembar)
                </label>
                <input
                  type="text"
                  value={identity.namaSiswa}
                  onChange={(e) => onChange({ namaSiswa: e.target.value })}
                  placeholder="......................................................"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Hari / Tanggal
                </label>
                <input
                  type="text"
                  value={identity.hariTanggal}
                  onChange={(e) => onChange({ hariTanggal: e.target.value })}
                  placeholder="Contoh: Senin, 08 Desember 2026"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Kelas *
                </label>
                <input
                  type="text"
                  value={identity.kelas}
                  onChange={(e) => onChange({ kelas: e.target.value })}
                  placeholder="Contoh: V (Lima)"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Guru Pembuat Soal untuk Dashboard Admin & Arsip */}
        <div className="border-t border-slate-200 pt-4">
          <label className="block text-xs font-bold text-slate-800 mb-2">
            Data Guru Pembuat Soal & Status (Terhubung ke Dashboard Admin)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Nama Guru Pembuat</label>
              <input
                type="text"
                value={identity.namaGuru || ''}
                onChange={(e) => onChange({ namaGuru: e.target.value })}
                placeholder="Contoh: Budi Santoso, S.Pd."
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">NIP / NUPTK</label>
              <input
                type="text"
                value={identity.nipGuru || ''}
                onChange={(e) => onChange({ nipGuru: e.target.value })}
                placeholder="Contoh: 19850412 201001 1 012"
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Status Progres</label>
              <select
                value={identity.status}
                onChange={(e) => onChange({ status: e.target.value as any })}
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
              >
                <option value="Baru">Baru</option>
                <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                <option value="Selesai">Selesai (Siap Ekspor)</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
                <option value="Sudah Diekspor">Sudah Diekspor</option>
              </select>
            </div>
          </div>

          {/* Catatan Supervisi dari Admin / Kurikulum */}
          {identity.catatanSupervisi && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <span className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                Catatan Supervisi / Review Kurikulum:
              </span>
              <p className="italic text-slate-700">{identity.catatanSupervisi}</p>
            </div>
          )}
        </div>

        {/* Petunjuk Pengerjaan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Petunjuk Pengerjaan (Dapat Diedit Manual)
          </label>
          <textarea
            rows={5}
            value={identity.petunjukPengerjaan}
            onChange={(e) => onChange({ petunjukPengerjaan: e.target.value })}
            className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-mono"
            placeholder="Petunjuk pengerjaan..."
          />
        </div>
      </div>
    </div>
  );
};
