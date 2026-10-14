export type QuestionType = 'PG' | 'ISIAN' | 'ESAI';
export type CognitiveLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type ExamStatus = 'Baru' | 'Sedang Dikerjakan' | 'Selesai' | 'Sudah Diekspor' | 'Perlu Revisi';

export interface ExamIdentity {
  examId: string;
  namaInstansi: string;
  namaLembaga?: string;
  namaSekolah: string;
  namaUjian: string;
  tahunAjaran: string;
  mataPelajaran: string;
  namaSiswa: string;
  kelas: string;
  hariTanggal: string;
  petunjukPengerjaan: string;
  namaGuru?: string; // Nama Guru Pembuat Soal
  nipGuru?: string;  // NIP Guru
  catatanSupervisi?: string; // Catatan Supervisi dari Admin / Kepala Sekolah
  logoKiriFileId?: string;
  logoKiriUrl?: string;
  logoKananFileId?: string;
  logoKananUrl?: string;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  questionId: string;
  examId: string;
  nomorSoal: number;
  jenisSoal: QuestionType;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  kunciJawaban: string; // 'A'|'B'|'C'|'D' for PG; text for ISIAN; rubric for ESAI
  materi: string;
  tujuanPembelajaran: string;
  indikatorSoal: string;
  levelKognitif: CognitiveLevel;
  bobotNilai: number;
  gambarUrl?: string; // Gambar stimulus soal (Base64 atau URL)
  gambarKeterangan?: string; // Keterangan / petunjuk gambar
}

export interface ExamDraft {
  identity: ExamIdentity;
  questions: Question[];
}

export interface ExportHistory {
  exportId: string;
  examId: string;
  jenisDokumen: 'Naskah Soal' | 'Kisi-Kisi' | 'Kunci Jawaban';
  namaFile: string;
  fileUrl: string;
  createdAt: string;
}
