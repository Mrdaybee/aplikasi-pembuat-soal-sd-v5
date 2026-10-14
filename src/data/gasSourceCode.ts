/**
 * Kumpulan Source Code Lengkap Google Apps Script (GAS)
 * Untuk Aplikasi Pembuat Soal SD
 */

export const GAS_CODE_GS = `/**
 * =========================================================================
 * APLIKASI PEMBUAT SOAL SD - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * =========================================================================
 * Fitur:
 * - Manajemen Draf Ujian & Soal (PG, Isian, Esai)
 * - Autosave dengan LockService & Debounce
 * - Manajemen Logo (Google Drive)
 * - Pembuatan Naskah Soal, Kisi-Kisi, & Kunci Jawaban
 * - Konversi Dokumen ke format Microsoft Word (.docx)
 * =========================================================================
 */

// Konstanta Nama Sheet Database
const SHEET_SETTINGS = 'SETTINGS';
const SHEET_EXAMS = 'EXAMS';
const SHEET_QUESTIONS = 'QUESTIONS';
const SHEET_EXPORTS = 'EXPORTS';
const APP_FOLDER_NAME = 'Aplikasi_Pembuat_Soal_SD_Files';

/**
 * Entry point Web Apps
 */
function doGet(e) {
  // Inisialisasi database jika sheet belum lengkap
  initDatabase();

  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Aplikasi Pembuat Soal SD')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Helper untuk menyisipkan file HTML (CSS & JS modular)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mendapatkan spreadsheet aktif atau ID tersimpan
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    // Jika dijalankan standalone, ambil dari Script Properties
    const propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (propId) {
      return SpreadsheetApp.openById(propId);
    }
    throw new Error('Spreadsheet tidak terhubung. Silakan kaitkan script ke Google Spreadsheet atau atur SPREADSHEET_ID.');
  }
}

/**
 * Inisialisasi struktur sheet dan folder penyimpanan di Google Drive
 */
function initDatabase() {
  const ss = getSpreadsheet();

  // 1. Sheet SETTINGS
  let sheetSettings = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet(SHEET_SETTINGS);
    sheetSettings.appendRow(['SettingKey', 'SettingValue']);
    sheetSettings.getRange('A1:B1').setFontWeight('bold').setBackground('#E2E8F0');
    sheetSettings.appendRow(['APP_VERSION', '1.0.0']);
    sheetSettings.appendRow(['CREATED_AT', new Date().toISOString()]);
  }

  // 2. Sheet EXAMS
  let sheetExams = ss.getSheetByName(SHEET_EXAMS);
  if (!sheetExams) {
    sheetExams = ss.insertSheet(SHEET_EXAMS);
    sheetExams.appendRow([
      'ExamID', 'NamaInstansi', 'NamaSekolah', 'NamaUjian', 'TahunAjaran',
      'MataPelajaran', 'NamaSiswa', 'Kelas', 'HariTanggal', 'PetunjukPengerjaan',
      'LogoKiriFileID', 'LogoKananFileID', 'LogoKiriURL', 'LogoKananURL',
      'Status', 'CreatedAt', 'UpdatedAt'
    ]);
    sheetExams.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#E2E8F0');
  }

  // 3. Sheet QUESTIONS
  let sheetQuestions = ss.getSheetByName(SHEET_QUESTIONS);
  if (!sheetQuestions) {
    sheetQuestions = ss.insertSheet(SHEET_QUESTIONS);
    sheetQuestions.appendRow([
      'QuestionID', 'ExamID', 'NomorSoal', 'JenisSoal', 'Pertanyaan',
      'OpsiA', 'OpsiB', 'OpsiC', 'OpsiD', 'KunciJawaban',
      'Materi', 'TujuanPembelajaran', 'IndikatorSoal', 'LevelKognitif', 'BobotNilai',
      'CreatedAt', 'UpdatedAt'
    ]);
    sheetQuestions.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#E2E8F0');
  }

  // 4. Sheet EXPORTS
  let sheetExports = ss.getSheetByName(SHEET_EXPORTS);
  if (!sheetExports) {
    sheetExports = ss.insertSheet(SHEET_EXPORTS);
    sheetExports.appendRow([
      'ExportID', 'ExamID', 'JenisDokumen', 'NamaFile', 'FileID', 'FileURL', 'CreatedAt'
    ]);
    sheetExports.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E2E8F0');
  }

  // Buat folder Drive jika belum ada
  getOrCreateAppFolder();

  return { success: true, message: 'Database dan folder berhasil diinisialisasi.' };
}

/**
 * Folder khusus di Google Drive untuk menyimpan Logo dan File Ekspor
 */
function getOrCreateAppFolder() {
  const folders = DriveApp.getFoldersByName(APP_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(APP_FOLDER_NAME);
}

/**
 * Mengambil daftar draf ujian untuk ditampilkan di Dashboard
 */
function getDrafts() {
  const ss = getSpreadsheet();
  const sheetExams = ss.getSheetByName(SHEET_EXAMS);
  const sheetQuestions = ss.getSheetByName(SHEET_QUESTIONS);

  if (!sheetExams) return [];

  const examsData = sheetExams.getDataRange().getValues();
  if (examsData.length <= 1) return [];

  const questionsData = sheetQuestions ? sheetQuestions.getDataRange().getValues() : [];

  // Hitung jumlah soal per exam
  const countMap = {};
  for (let i = 1; i < questionsData.length; i++) {
    const row = questionsData[i];
    const eId = row[1];
    const jenis = row[3];
    if (!countMap[eId]) {
      countMap[eId] = { pg: 0, isian: 0, esai: 0, total: 0 };
    }
    if (jenis === 'PG') countMap[eId].pg++;
    else if (jenis === 'ISIAN') countMap[eId].isian++;
    else if (jenis === 'ESAI') countMap[eId].esai++;
    countMap[eId].total++;
  }

  const drafts = [];
  for (let i = 1; i < examsData.length; i++) {
    const row = examsData[i];
    const examId = row[0];
    if (!examId) continue;

    const counts = countMap[examId] || { pg: 0, isian: 0, esai: 0, total: 0 };

    drafts.push({
      examId: examId,
      namaInstansi: row[1] || '',
      namaSekolah: row[2] || '',
      namaUjian: row[3] || '',
      tahunAjaran: row[4] || '',
      mataPelajaran: row[5] || '',
      namaSiswa: row[6] || '',
      kelas: row[7] || '',
      hariTanggal: row[8] || '',
      petunjukPengerjaan: row[9] || '',
      logoKiriFileId: row[10] || '',
      logoKananFileId: row[11] || '',
      logoKiriUrl: row[12] || '',
      logoKananUrl: row[13] || '',
      status: row[14] || 'Baru',
      createdAt: row[15] || '',
      updatedAt: row[16] || '',
      jumlahPG: counts.pg,
      jumlahIsian: counts.isian,
      jumlahEsai: counts.esai,
      totalSoal: counts.total
    });
  }

  // Urutkan dari yang terbaru disimpan
  drafts.sort(function(a, b) {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return drafts;
}

/**
 * Mengambil detail ujian dan seluruh soal berdasarkan ExamID
 */
function getExam(examId) {
  if (!examId) throw new Error('ExamID diperlukan.');
  const ss = getSpreadsheet();

  // 1. Ambil Identitas Ujian
  const sheetExams = ss.getSheetByName(SHEET_EXAMS);
  const examsData = sheetExams.getDataRange().getValues();
  let exam = null;

  for (let i = 1; i < examsData.length; i++) {
    if (examsData[i][0] === examId) {
      const row = examsData[i];
      exam = {
        examId: row[0],
        namaInstansi: row[1],
        namaSekolah: row[2],
        namaUjian: row[3],
        tahunAjaran: row[4],
        mataPelajaran: row[5],
        namaSiswa: row[6],
        kelas: row[7],
        hariTanggal: row[8],
        petunjukPengerjaan: row[9],
        logoKiriFileId: row[10],
        logoKananFileId: row[11],
        logoKiriUrl: row[12],
        logoKananUrl: row[13],
        status: row[14],
        createdAt: row[15],
        updatedAt: row[16]
      };
      break;
    }
  }

  if (!exam) throw new Error('Data ujian tidak ditemukan.');

  // 2. Ambil Seluruh Soal
  const sheetQuestions = ss.getSheetByName(SHEET_QUESTIONS);
  const qData = sheetQuestions ? sheetQuestions.getDataRange().getValues() : [];
  const questions = [];

  for (let i = 1; i < qData.length; i++) {
    const row = qData[i];
    if (row[1] === examId) {
      questions.push({
        questionId: row[0],
        examId: row[1],
        nomorSoal: Number(row[2]) || questions.length + 1,
        jenisSoal: row[3],
        pertanyaan: row[4] || '',
        opsiA: row[5] || '',
        opsiB: row[6] || '',
        opsiC: row[7] || '',
        opsiD: row[8] || '',
        kunciJawaban: row[9] || '',
        materi: row[10] || '',
        tujuanPembelajaran: row[11] || '',
        indikatorSoal: row[12] || '',
        levelKognitif: row[13] || 'C1',
        bobotNilai: Number(row[14]) || 1,
        createdAt: row[15],
        updatedAt: row[16]
      });
    }
  }

  // Urutkan soal berdasarkan nomor
  questions.sort(function(a, b) {
    return a.nomorSoal - b.nomorSoal;
  });

  return { identity: exam, questions: questions };
}

/**
 * Menyimpan data Ujian dan Soal dengan LockService untuk mencegah konflik race-condition
 */
function saveExam(examData, questionsData) {
  const lock = LockService.getScriptLock();
  try {
    // Tunggu maksimal 30 detik untuk mendapatkan lock
    lock.waitLock(30000);
  } catch (e) {
    throw new Error('Server sedang sibuk memproses data lain. Silakan coba sesaat lagi.');
  }

  try {
    const ss = getSpreadsheet();
    const sheetExams = ss.getSheetByName(SHEET_EXAMS);
    const sheetQuestions = ss.getSheetByName(SHEET_QUESTIONS);
    const now = new Date().toISOString();

    let examId = examData.examId;
    if (!examId) {
      examId = 'EXAM-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd') + '-' + Utilities.getUuid().substring(0, 5).toUpperCase();
      examData.examId = examId;
      examData.createdAt = now;
    }
    examData.updatedAt = now;

    // 1. Simpan / Perbarui sheet EXAMS
    const examsRows = sheetExams.getDataRange().getValues();
    let examRowIndex = -1;

    for (let i = 1; i < examsRows.length; i++) {
      if (examsRows[i][0] === examId) {
        examRowIndex = i + 1; // 1-indexed
        break;
      }
    }

    const examValues = [
      examId,
      examData.namaInstansi || '',
      examData.namaSekolah || '',
      examData.namaUjian || '',
      examData.tahunAjaran || '',
      examData.mataPelajaran || '',
      examData.namaSiswa || '',
      examData.kelas || '',
      examData.hariTanggal || '',
      examData.petunjukPengerjaan || '',
      examData.logoKiriFileId || '',
      examData.logoKananFileId || '',
      examData.logoKiriUrl || '',
      examData.logoKananUrl || '',
      examData.status || 'Sedang Dikerjakan',
      examData.createdAt || now,
      now
    ];

    if (examRowIndex > 0) {
      sheetExams.getRange(examRowIndex, 1, 1, examValues.length).setValues([examValues]);
    } else {
      sheetExams.appendRow(examValues);
    }

    // 2. Simpan / Perbarui sheet QUESTIONS
    // Hapus baris pertanyaan lama untuk examId ini agar urutan dan perubahan konsisten
    const qData = sheetQuestions.getDataRange().getValues();
    for (let i = qData.length - 1; i >= 1; i--) {
      if (qData[i][1] === examId) {
        sheetQuestions.deleteRow(i + 1);
      }
    }

    // Masukkan data soal baru
    if (questionsData && questionsData.length > 0) {
      const newRows = [];
      for (let i = 0; i < questionsData.length; i++) {
        const q = questionsData[i];
        const qId = q.questionId || ('Q-' + examId + '-' + (i + 1));
        newRows.push([
          qId,
          examId,
          i + 1, // Nomor otomatis urut
          q.jenisSoal || 'PG',
          q.pertanyaan || '',
          q.opsiA || '',
          q.opsiB || '',
          q.opsiC || '',
          q.opsiD || '',
          q.kunciJawaban || '',
          q.materi || '',
          q.tujuanPembelajaran || '',
          q.indikatorSoal || '',
          q.levelKognitif || 'C1',
          q.bobotNilai || 1,
          q.createdAt || now,
          now
        ]);
      }
      sheetQuestions.getRange(sheetQuestions.getLastRow() + 1, 1, newRows.length, 17).setValues(newRows);
    }

    SpreadsheetApp.flush();
    return {
      success: true,
      examId: examId,
      updatedAt: now,
      message: 'Data berhasil disimpan.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Hapus draf ujian dan soal-soalnya
 */
function deleteExam(examId) {
  if (!examId) throw new Error('ExamID diperlukan.');
  const ss = getSpreadsheet();
  const sheetExams = ss.getSheetByName(SHEET_EXAMS);
  const sheetQuestions = ss.getSheetByName(SHEET_QUESTIONS);

  // Hapus dari EXAMS
  const eData = sheetExams.getDataRange().getValues();
  for (let i = 1; i < eData.length; i++) {
    if (eData[i][0] === examId) {
      sheetExams.deleteRow(i + 1);
      break;
    }
  }

  // Hapus dari QUESTIONS
  const qData = sheetQuestions.getDataRange().getValues();
  for (let i = qData.length - 1; i >= 1; i--) {
    if (qData[i][1] === examId) {
      sheetQuestions.deleteRow(i + 1);
    }
  }

  SpreadsheetApp.flush();
  return { success: true, message: 'Draf ujian berhasil dihapus.' };
}

/**
 * Upload gambar logo ke Google Drive (tidak disimpan sebagai string Base64 di Sheet)
 */
function uploadLogo(base64Data, fileName, mimeType) {
  try {
    const folder = getOrCreateAppFolder();
    const contentType = mimeType || 'image/png';
    const cleanBase64 = base64Data.replace(/^data:image\\/[a-z]+;base64,/, '');
    const decodedBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), contentType, fileName);

    const file = folder.createFile(decodedBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getDownloadUrl() || file.getUrl(),
      viewUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId()
    };
  } catch (err) {
    throw new Error('Gagal mengunggah logo: ' + err.message);
  }
}

/**
 * Validasi kelengkapan ujian sebelum proses ekspor ke Word
 */
function validateExam(exam, questions) {
  const errors = [];

  if (!exam.namaSekolah || exam.namaSekolah.trim() === '') errors.push('Nama Sekolah wajib diisi.');
  if (!exam.namaUjian || exam.namaUjian.trim() === '') errors.push('Nama Ujian wajib diisi.');
  if (!exam.tahunAjaran || exam.tahunAjaran.trim() === '') errors.push('Tahun Ajaran wajib diisi.');
  if (!exam.mataPelajaran || exam.mataPelajaran.trim() === '') errors.push('Mata Pelajaran wajib diisi.');
  if (!exam.kelas || exam.kelas.trim() === '') errors.push('Kelas wajib diisi.');

  if (!questions || questions.length === 0) {
    errors.push('Ujian harus memiliki minimal 1 soal.');
    return { valid: false, errors: errors };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const no = i + 1;

    if (!q.pertanyaan || q.pertanyaan.trim() === '') {
      errors.push('Soal nomor ' + no + ' belum memiliki teks pertanyaan.');
    }

    if (q.jenisSoal === 'PG') {
      if (!q.opsiA || !q.opsiB || !q.opsiC || !q.opsiD) {
        errors.push('Soal PG nomor ' + no + ' harus memiliki opsi lengkap A, B, C, dan D.');
      }
      if (!q.kunciJawaban || !['A', 'B', 'C', 'D'].includes(q.kunciJawaban.toUpperCase())) {
        errors.push('Soal PG nomor ' + no + ' belum memiliki kunci jawaban (A, B, C, atau D).');
      }
    } else if (q.jenisSoal === 'ISIAN') {
      if (!q.kunciJawaban || q.kunciJawaban.trim() === '') {
        errors.push('Soal Isian nomor ' + no + ' belum memiliki kunci jawaban.');
      }
    } else if (q.jenisSoal === 'ESAI') {
      if (!q.kunciJawaban || q.kunciJawaban.trim() === '') {
        errors.push('Soal Esai nomor ' + no + ' belum memiliki pedoman jawaban / rubrik.');
      }
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

/**
 * =========================================================================
 * FUNGSI UTAMA EKSPOR WORD (.docx)
 * =========================================================================
 * Membuat tepat 3 dokumen Word (.docx) terpisah:
 * 1. Naskah Soal ([Nama Sekolah] - [Nama Ujian] - Naskah Soal.docx)
 * 2. Kisi-Kisi Soal ([Nama Sekolah] - [Nama Ujian] - Kisi-Kisi.docx)
 * 3. Kunci Jawaban ([Nama Sekolah] - [Nama Ujian] - Kunci Jawaban.docx)
 */
function exportExamToWord(examId) {
  const data = getExam(examId);
  const exam = data.identity;
  const questions = data.questions;

  // 1. Validasi
  const validation = validateExam(exam, questions);
  if (!validation.valid) {
    throw new Error('Ekspor belum dapat dilakukan:\\n• ' + validation.errors.join('\\n• '));
  }

  const folder = getOrCreateAppFolder();
  const cleanSchool = exam.namaSekolah.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const cleanUjian = exam.namaUjian.replace(/[^a-zA-Z0-9 ]/g, '').trim();

  // Pisahkan jenis soal
  const pgList = questions.filter(q => q.jenisSoal === 'PG');
  const isianList = questions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = questions.filter(q => q.jenisSoal === 'ESAI');

  // Urutkan nomor gabungan: PG (1..), Isian (setelah PG), Esai (setelah Isian)
  let currNo = 1;
  pgList.forEach(q => { q.nomorTampil = currNo++; });
  isianList.forEach(q => { q.nomorTampil = currNo++; });
  esaiList.forEach(q => { q.nomorTampil = currNo++; });

  // 2. Buat File 1: Naskah Soal
  const file1Name = cleanSchool + ' - ' + cleanUjian + ' - Naskah Soal';
  const docx1 = generateNaskahSoalDocx(exam, pgList, isianList, esaiList, folder, file1Name);

  // 3. Buat File 2: Kisi-Kisi
  const file2Name = cleanSchool + ' - ' + cleanUjian + ' - Kisi-Kisi';
  const docx2 = generateKisiKisiDocx(exam, [...pgList, ...isianList, ...esaiList], folder, file2Name);

  // 4. Buat File 3: Kunci Jawaban
  const file3Name = cleanSchool + ' - ' + cleanUjian + ' - Kunci Jawaban';
  const docx3 = generateKunciJawabanDocx(exam, pgList, isianList, esaiList, folder, file3Name);

  // 5. Perbarui Status Ujian menjadi 'Sudah Diekspor'
  exam.status = 'Sudah Diekspor';
  saveExam(exam, questions);

  // 6. Catat riwayat ekspor ke sheet EXPORTS
  const ss = getSpreadsheet();
  const sheetExports = ss.getSheetByName(SHEET_EXPORTS);
  const now = new Date().toISOString();
  if (sheetExports) {
    sheetExports.appendRow([Utilities.getUuid(), examId, 'Naskah Soal', file1Name + '.docx', docx1.fileId, docx1.downloadUrl, now]);
    sheetExports.appendRow([Utilities.getUuid(), examId, 'Kisi-Kisi', file2Name + '.docx', docx2.fileId, docx2.downloadUrl, now]);
    sheetExports.appendRow([Utilities.getUuid(), examId, 'Kunci Jawaban', file3Name + '.docx', docx3.fileId, docx3.downloadUrl, now]);
  }

  return {
    success: true,
    message: '3 Dokumen Word (.docx) berhasil dibuat dengan rapi.',
    files: [
      { type: 'Naskah Soal', name: file1Name + '.docx', url: docx1.downloadUrl, viewUrl: docx1.viewUrl },
      { type: 'Kisi-Kisi', name: file2Name + '.docx', url: docx2.downloadUrl, viewUrl: docx2.viewUrl },
      { type: 'Kunci Jawaban', name: file3Name + '.docx', url: docx3.downloadUrl, viewUrl: docx3.viewUrl }
    ]
  };
}

/**
 * =========================================================================
 * PEMBUATAN FILE 1: NASKAH SOAL (Google Docs -> Word .docx)
 * Termasuk Kop Surat, Logo Kiri/Kanan, Identitas Siswa 2-Kolom, dan Soal 2 Kolom
 * =========================================================================
 */
function generateNaskahSoalDocx(exam, pgList, isianList, esaiList, folder, fileName) {
  const doc = DocumentApp.create(fileName);
  const body = doc.getBody();

  // Pengaturan margin A4 normal (72 pt = 1 inci atau 54 pt = 0.75 inci)
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(40);
  body.setMarginRight(40);

  // A. KOP SURAT
  renderKopSurat(body, exam);

  // Garis Pembatas Kop Surat Ganda (Tebal - Tipis)
  const lineP = body.appendParagraph('');
  lineP.setSpacingAfter(6);
  lineP.setSpacingBefore(0);
  const hr = body.appendHorizontalRule();

  // B. IDENTITAS SISWA (2 KOLOM RAPI MENGGUNAKAN TABEL TANPA BORDER)
  renderIdentitasSiswa(body, exam);

  // C. PETUNJUK PENGERJAAN
  const petunjukHeader = body.appendParagraph('PETUNJUK PENGERJAAN:');
  petunjukHeader.setFontFamily('Times New Roman').setFontSize(11).setBold(true).setSpacingBefore(6).setSpacingAfter(2);

  const petunjukText = exam.petunjukPengerjaan || 
    '1. Berdoalah sebelum mengerjakan soal.\\n2. Tulislah nama dan identitas dengan lengkap.\\n3. Bacalah setiap soal dengan teliti.\\n4. Pilihlah jawaban yang paling tepat pada soal pilihan ganda.\\n5. Isilah soal isian singkat dengan jawaban yang benar.\\n6. Jawablah soal esai dengan jelas dan lengkap.\\n7. Periksa kembali jawaban sebelum dikumpulkan.';
  
  const pLines = petunjukText.split('\\n');
  pLines.forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      p.setFontFamily('Times New Roman').setFontSize(10.5).setSpacingAfter(1).setSpacingBefore(0);
    }
  });

  const divider = body.appendParagraph('');
  divider.setSpacingAfter(6);

  // D. FORMAT 2 KOLOM PADA SOAL
  // Di Google Docs / Word export: Tabel 2 kolom tanpa batas (borderless) adalah
  // pendekatan paling stabil di Google Apps Script yang menjamin layout 2 kolom
  // tidak terputus, tidak merusak kop surat, dan 100% aman saat dibuka di Microsoft Word (.docx).
  renderSoalDuaKolom(body, pgList, isianList, esaiList);

  doc.saveAndClose();

  // Konversi Google Doc ke File Asli Microsoft Word (.docx)
  return convertDocToDocx(doc.getId(), fileName + '.docx', folder);
}

/**
 * Render Kop Surat Resmi
 */
function renderKopSurat(body, exam) {
  const table = body.appendTable();
  table.setBorderWidth(0);

  const row = table.appendTableRow();
  const cellLogoKiri = row.appendTableCell();
  const cellTeks = row.appendTableCell();
  const cellLogoKanan = row.appendTableCell();

  // Atur lebar kolom
  cellLogoKiri.setWidth(70);
  cellTeks.setWidth(400);
  cellLogoKanan.setWidth(70);

  // Sisipkan Logo Kiri jika ada
  if (exam.logoKiriFileId) {
    try {
      const fileKiri = DriveApp.getFileById(exam.logoKiriFileId);
      const img = cellLogoKiri.appendParagraph('').appendInlineImage(fileKiri.getBlob());
      img.setWidth(60);
      img.setHeight(60);
    } catch (e) {
      cellLogoKiri.appendParagraph('');
    }
  } else {
    cellLogoKiri.appendParagraph('');
  }

  // Teks Kop Surat
  if (exam.namaInstansi) {
    const pInstansi = cellTeks.appendParagraph(exam.namaInstansi.toUpperCase());
    pInstansi.setFontFamily('Times New Roman').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(2).setSpacingBefore(0);
  }

  const pSekolah = cellTeks.appendParagraph((exam.namaSekolah || 'NAMA SEKOLAH').toUpperCase());
  pSekolah.setFontFamily('Times New Roman').setFontSize(16).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(2).setSpacingBefore(0);

  const pUjian = cellTeks.appendParagraph((exam.namaUjian || 'PENILAIAN SUMATIF AKHIR SEMESTER').toUpperCase());
  pUjian.setFontFamily('Times New Roman').setFontSize(18).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(2).setSpacingBefore(0);

  const pTahun = cellTeks.appendParagraph('TAHUN AJARAN ' + (exam.tahunAjaran || '2026/2027'));
  pTahun.setFontFamily('Times New Roman').setFontSize(12).setBold(false).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(0).setSpacingBefore(0);

  // Sisipkan Logo Kanan jika ada
  if (exam.logoKananFileId) {
    try {
      const fileKanan = DriveApp.getFileById(exam.logoKananFileId);
      const img = cellLogoKanan.appendParagraph('').appendInlineImage(fileKanan.getBlob());
      img.setWidth(60);
      img.setHeight(60);
    } catch (e) {
      cellLogoKanan.appendParagraph('');
    }
  } else {
    cellLogoKanan.appendParagraph('');
  }
}

/**
 * Render Identitas Siswa 2 Kolom Tanpa Garis
 */
function renderIdentitasSiswa(body, exam) {
  const table = body.appendTable();
  table.setBorderWidth(0);

  const row = table.appendTableRow();
  const cellKiri = row.appendTableCell();
  const cellKanan = row.appendTableCell();

  cellKiri.setWidth(270);
  cellKanan.setWidth(270);

  // Kolom Kiri
  const p1 = cellKiri.appendParagraph('Mata Pelajaran : ' + (exam.mataPelajaran || '........................'));
  const p2 = cellKiri.appendParagraph('Nama Siswa    : ' + (exam.namaSiswa || '........................'));
  const p3 = cellKiri.appendParagraph('Kelas         : ' + (exam.kelas || '........................'));

  // Kolom Kanan
  const p4 = cellKanan.appendParagraph('Hari/Tanggal  : ' + (exam.hariTanggal || '........................'));
  const p5 = cellKanan.appendParagraph('Nilai         : ........................');
  const p6 = cellKanan.appendParagraph('Paraf Guru    : ........................');

  [p1, p2, p3, p4, p5, p6].forEach(p => {
    p.setFontFamily('Times New Roman').setFontSize(11).setSpacingAfter(2).setSpacingBefore(0);
  });
}

/**
 * Render Soal dalam Tata Letak 2 Kolom yang Rapi
 */
function renderSoalDuaKolom(body, pgList, isianList, esaiList) {
  // Satukan seluruh soal dengan judul bagian
  const allBlocks = [];

  if (pgList.length > 0) {
    allBlocks.push({ type: 'header', title: 'I. PILIHAN GANDA\\nBerilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!' });
    pgList.forEach(q => allBlocks.push({ type: 'pg', data: q }));
  }

  if (isianList.length > 0) {
    allBlocks.push({ type: 'header', title: 'II. ISIAN SINGKAT\\nIsilah titik-titik di bawah ini dengan jawaban yang tepat dan benar!' });
    isianList.forEach(q => allBlocks.push({ type: 'isian', data: q }));
  }

  if (esaiList.length > 0) {
    allBlocks.push({ type: 'header', title: 'III. ESAI / URAIAN\\nJawablah pertanyaan-pertanyaan di bawah ini secara jelas dan lengkap!' });
    esaiList.forEach(q => allBlocks.push({ type: 'esai', data: q }));
  }

  // Bagi secara berimbang menjadi 2 kolom
  const midPoint = Math.ceil(allBlocks.length / 2);
  const leftBlocks = allBlocks.slice(0, midPoint);
  const rightBlocks = allBlocks.slice(midPoint);

  const table = body.appendTable();
  table.setBorderWidth(0);

  const row = table.appendTableRow();
  const leftCell = row.appendTableCell();
  const rightCell = row.appendTableCell();

  leftCell.setWidth(265);
  rightCell.setWidth(265);
  leftCell.setPaddingRight(10);
  rightCell.setPaddingLeft(10);

  renderBlockColumn(leftCell, leftBlocks);
  renderBlockColumn(rightCell, rightBlocks);
}

function renderBlockColumn(cell, blocks) {
  blocks.forEach(item => {
    if (item.type === 'header') {
      const p = cell.appendParagraph(item.title);
      p.setFontFamily('Times New Roman').setFontSize(11).setBold(true).setSpacingBefore(8).setSpacingAfter(4);
    } else if (item.type === 'pg') {
      const q = item.data;
      const pSoal = cell.appendParagraph(q.nomorTampil + '. ' + q.pertanyaan);
      pSoal.setFontFamily('Times New Roman').setFontSize(11).setSpacingBefore(4).setSpacingAfter(2);

      const pA = cell.appendParagraph('    A. ' + q.opsiA);
      const pB = cell.appendParagraph('    B. ' + q.opsiB);
      const pC = cell.appendParagraph('    C. ' + q.opsiC);
      const pD = cell.appendParagraph('    D. ' + q.opsiD);

      [pA, pB, pC, pD].forEach(opt => {
        opt.setFontFamily('Times New Roman').setFontSize(11).setSpacingBefore(1).setSpacingAfter(1);
      });
    } else if (item.type === 'isian') {
      const q = item.data;
      const pSoal = cell.appendParagraph(q.nomorTampil + '. ' + q.pertanyaan);
      pSoal.setFontFamily('Times New Roman').setFontSize(11).setSpacingBefore(4).setSpacingAfter(4);
    } else if (item.type === 'esai') {
      const q = item.data;
      const pSoal = cell.appendParagraph(q.nomorTampil + '. ' + q.pertanyaan);
      pSoal.setFontFamily('Times New Roman').setFontSize(11).setSpacingBefore(4).setSpacingAfter(6);
    }
  });
}

/**
 * =========================================================================
 * PEMBUATAN FILE 2: KISI-KISI SOAL (Google Docs -> Word .docx)
 * Kolom Wajib: No, No. Soal, Mapel, Kelas, Materi, Tujuan Pembelajaran, Indikator, Level, Bentuk, Bobot
 * =========================================================================
 */
function generateKisiKisiDocx(exam, allQuestions, folder, fileName) {
  const doc = DocumentApp.create(fileName);
  const body = doc.getBody();

  // Set kertas A4 Landscape agar tabel muat dengan sangat rapi
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(36);
  body.setMarginRight(36);

  // Kop Kisi-Kisi
  const title = body.appendParagraph('KISI-KISI PENULISAN SOAL UJIAN');
  title.setFontFamily('Times New Roman').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(2);

  const subTitle = body.appendParagraph((exam.namaSekolah || '').toUpperCase());
  subTitle.setFontFamily('Times New Roman').setFontSize(12).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(6);

  // Info Ujian
  const pInfo = body.appendParagraph(
    'Mata Pelajaran: ' + (exam.mataPelajaran || '-') + 
    '   |   Kelas: ' + (exam.kelas || '-') + 
    '   |   Tahun Ajaran: ' + (exam.tahunAjaran || '-') + 
    '   |   Semester: Ganjil'
  );
  pInfo.setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(10);

  // Tabel Kisi-Kisi
  const table = body.appendTable();
  table.setBorderWidth(1);

  // Header Tabel
  const headerRow = table.appendTableRow();
  const headers = [
    'No.', 'No. Soal', 'Mata Pelajaran', 'Kelas', 'Materi',
    'Tujuan Pembelajaran', 'Indikator Soal', 'Level', 'Bentuk Soal', 'Bobot'
  ];

  headers.forEach(h => {
    const c = headerRow.appendTableCell(h);
    c.setBackgroundColor('#E2E8F0');
    const p = c.getChild(0).asParagraph();
    p.setFontFamily('Times New Roman').setFontSize(9.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  });

  // Isi Baris Tabel
  allQuestions.forEach((q, idx) => {
    const row = table.appendTableRow();
    const bentukText = q.jenisSoal === 'PG' ? 'Pilihan Ganda' : (q.jenisSoal === 'ISIAN' ? 'Isian Singkat' : 'Esai');

    const cells = [
      String(idx + 1),
      String(q.nomorTampil || idx + 1),
      exam.mataPelajaran || '-',
      exam.kelas || '-',
      q.materi || '-',
      q.tujuanPembelajaran || '-',
      q.indikatorSoal || '-',
      q.levelKognitif || 'C1',
      bentukText,
      String(q.bobotNilai || 1)
    ];

    cells.forEach((val, colIdx) => {
      const c = row.appendTableCell(val);
      const p = c.getChild(0).asParagraph();
      p.setFontFamily('Times New Roman').setFontSize(9).setSpacingBefore(1).setSpacingAfter(1);
      if (colIdx === 0 || colIdx === 1 || colIdx === 7 || colIdx === 8 || colIdx === 9) {
        p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
    });
  });

  doc.saveAndClose();
  return convertDocToDocx(doc.getId(), fileName + '.docx', folder);
}

/**
 * =========================================================================
 * PEMBUATAN FILE 3: KUNCI JAWABAN & RUBRIK (Google Docs -> Word .docx)
 * =========================================================================
 */
function generateKunciJawabanDocx(exam, pgList, isianList, esaiList, folder, fileName) {
  const doc = DocumentApp.create(fileName);
  const body = doc.getBody();

  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(40);
  body.setMarginRight(40);

  // Kop
  const title = body.appendParagraph('KUNCI JAWABAN & PEDOMAN PENSKORAN');
  title.setFontFamily('Times New Roman').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(2);

  const subTitle = body.appendParagraph((exam.namaSekolah || '').toUpperCase());
  subTitle.setFontFamily('Times New Roman').setFontSize(12).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(4);

  const pInfo = body.appendParagraph('Mata Pelajaran: ' + (exam.mataPelajaran || '-') + '  |  Kelas: ' + (exam.kelas || '-') + '  |  Tahun Ajaran: ' + (exam.tahunAjaran || '-'));
  pInfo.setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setSpacingAfter(10);

  // 1. BAGIAN PILIHAN GANDA
  if (pgList.length > 0) {
    const sec1 = body.appendParagraph('I. KUNCI JAWABAN PILIHAN GANDA');
    sec1.setFontFamily('Times New Roman').setFontSize(11).setBold(true).setSpacingBefore(6).setSpacingAfter(4);

    const tblPG = body.appendTable();
    tblPG.setBorderWidth(1);
    const hRow = tblPG.appendTableRow();
    ['No.', 'Kunci Jawaban', 'Bobot'].forEach(h => {
      const c = hRow.appendTableCell(h);
      c.setBackgroundColor('#E2E8F0');
      c.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    });

    pgList.forEach(q => {
      const r = tblPG.appendTableRow();
      const c1 = r.appendTableCell(String(q.nomorTampil));
      const c2 = r.appendTableCell(q.kunciJawaban || '-');
      const c3 = r.appendTableCell(String(q.bobotNilai || 1));
      [c1, c2, c3].forEach(c => {
        c.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      });
    });
  }

  // 2. BAGIAN ISIAN SINGKAT
  if (isianList.length > 0) {
    const sec2 = body.appendParagraph('II. KUNCI JAWABAN ISIAN SINGKAT');
    sec2.setFontFamily('Times New Roman').setFontSize(11).setBold(true).setSpacingBefore(12).setSpacingAfter(4);

    const tblIsian = body.appendTable();
    tblIsian.setBorderWidth(1);
    const hRow = tblIsian.appendTableRow();
    ['No.', 'Kunci Jawaban', 'Bobot'].forEach(h => {
      const c = hRow.appendTableCell(h);
      c.setBackgroundColor('#E2E8F0');
      c.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    });

    isianList.forEach(q => {
      const r = tblIsian.appendTableRow();
      const c1 = r.appendTableCell(String(q.nomorTampil));
      const c2 = r.appendTableCell(q.kunciJawaban || '-');
      const c3 = r.appendTableCell(String(q.bobotNilai || 2));
      c1.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      c2.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10);
      c3.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    });
  }

  // 3. BAGIAN ESAI / URAIAN
  if (esaiList.length > 0) {
    const sec3 = body.appendParagraph('III. PEDOMAN JAWABAN & RUBRIK PENSKORAN ESAI');
    sec3.setFontFamily('Times New Roman').setFontSize(11).setBold(true).setSpacingBefore(12).setSpacingAfter(4);

    const tblEsai = body.appendTable();
    tblEsai.setBorderWidth(1);
    const hRow = tblEsai.appendTableRow();
    ['No.', 'Pedoman / Rubrik Jawaban', 'Bobot'].forEach(h => {
      const c = hRow.appendTableCell(h);
      c.setBackgroundColor('#E2E8F0');
      c.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    });

    esaiList.forEach(q => {
      const r = tblEsai.appendTableRow();
      const c1 = r.appendTableCell(String(q.nomorTampil));
      const c2 = r.appendTableCell(q.kunciJawaban || '-');
      const c3 = r.appendTableCell(String(q.bobotNilai || 5));
      c1.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      c2.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10);
      c3.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    });
  }

  doc.saveAndClose();
  return convertDocToDocx(doc.getId(), fileName + '.docx', folder);
}

/**
 * =========================================================================
 * KONVERSI GOOGLE DOC KE MICROSOFT WORD (.docx) ASLI
 * Menggunakan DriveApp export stream resmi MIME DOCX
 * =========================================================================
 */
function convertDocToDocx(docId, docxFileName, folder) {
  const url = 'https://docs.google.com/feeds/download/documents/export/Export?id=' + docId + '&exportFormat=docx';
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Gagal mengonversi dokumen ke format Word (.docx): ' + response.getContentText());
  }

  const docxBlob = response.getBlob().setName(docxFileName);
  docxBlob.setContentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  // Simpan ke folder Google Drive
  const savedFile = folder.createFile(docxBlob);
  savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Hapus Google Doc sementara agar Drive tetap bersih
  try {
    DriveApp.getFileById(docId).setTrashed(true);
  } catch (e) {
    // Lewati jika trashing gagal
  }

  return {
    fileId: savedFile.getId(),
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + savedFile.getId(),
    viewUrl: savedFile.getUrl()
  };
}
`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Aplikasi Pembuat Soal SD</title>
  <base target="_top">
  <!-- Load font Times New Roman & Modern Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <?!= include('CSS'); ?>
</head>
<body>
  <!-- Header Bar -->
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <div class="brand-icon">📚</div>
        <div>
          <h1>APLIKASI PEMBUAT SOAL SD</h1>
          <p class="brand-sub">Otomatisasi Naskah Ujian 2 Kolom, Kisi-Kisi, dan Kunci Jawaban Word (.docx)</p>
        </div>
      </div>
      <div class="header-status">
        <div id="autosaveIndicator" class="badge-status badge-saved">
          <span class="dot"></span>
          <span id="autosaveText">Semua data tersimpan</span>
        </div>
        <button id="btnManualSave" class="btn btn-secondary btn-sm" onclick="triggerManualSave()">
          💾 Simpan Manual
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="app-container">
    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
      <button class="tab-btn active" id="tabBtnDrafts" onclick="switchView('drafts')">📋 Daftar Draf Ujian</button>
      <button class="tab-btn" id="tabBtnExam" onclick="switchView('exam')">✏️ Editor Ujian & Soal</button>
      <button class="tab-btn" id="tabBtnPreview" onclick="switchView('preview')">👁️ Pratinjau Dokumen</button>
      <button class="tab-btn btn-export-highlight" id="tabBtnExport" onclick="openExportModal()">📄 Ekspor 3 File Word</button>
    </nav>

    <!-- VIEW 1: DAFTAR DRAF UJIAN -->
    <section id="viewDrafts" class="view-panel active">
      <div class="panel-header">
        <div>
          <h2>Daftar Draf Ujian</h2>
          <p class="text-muted">Kelola naskah ujian yang sedang dikerjakan atau buat draf baru.</p>
        </div>
        <button class="btn btn-primary" onclick="createNewDraft()">
          + Buat Ujian Baru
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Nama Ujian</th>
              <th>Nama Sekolah</th>
              <th>Mata Pelajaran</th>
              <th>Kelas</th>
              <th>Tahun</th>
              <th>PG</th>
              <th>Isian</th>
              <th>Esai</th>
              <th>Status</th>
              <th>Terakhir Disimpan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="draftsTableBody">
            <tr>
              <td colspan="12" class="text-center py-4">Memuat daftar draf ujian...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- VIEW 2: EDITOR UJIAN & SOAL -->
    <section id="viewExam" class="view-panel">
      <!-- Identitas Kop Surat & Siswa -->
      <div class="card mb-4">
        <div class="card-header">
          <h3>1. Identitas Kop Surat & Ujian</h3>
          <span class="text-sm text-muted">Akan ditampilkan pada bagian atas dokumen</span>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <!-- Logo Kiri -->
            <div class="form-group logo-upload-box">
              <label>Logo Kiri (Pemda / Dinas)</label>
              <div class="logo-preview-area" id="logoKiriPreview">
                <span class="logo-placeholder">Belum ada logo kiri</span>
              </div>
              <div class="logo-actions">
                <input type="file" id="inputLogoKiri" accept="image/png, image/jpeg, image/jpg" style="display:none;" onchange="handleLogoUpload(event, 'kiri')">
                <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('inputLogoKiri').click()">Unggah Logo</button>
                <button type="button" class="btn btn-sm btn-danger-outline" onclick="removeLogo('kiri')">Hapus</button>
              </div>
            </div>

            <!-- Logo Kanan -->
            <div class="form-group logo-upload-box">
              <label>Logo Kanan (Tut Wuri Handayani / Sekolah)</label>
              <div class="logo-preview-area" id="logoKananPreview">
                <span class="logo-placeholder">Belum ada logo kanan</span>
              </div>
              <div class="logo-actions">
                <input type="file" id="inputLogoKanan" accept="image/png, image/jpeg, image/jpg" style="display:none;" onchange="handleLogoUpload(event, 'kanan')">
                <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('inputLogoKanan').click()">Unggah Logo</button>
                <button type="button" class="btn btn-sm btn-danger-outline" onclick="removeLogo('kanan')">Hapus</button>
              </div>
            </div>
          </div>

          <div class="grid-2 mt-3">
            <div class="form-group">
              <label>Nama Instansi (Kop Surat)</label>
              <input type="text" id="namaInstansi" class="form-control" placeholder="Contoh: PEMERINTAH KOTA JAKARTA TIMUR\\nDINAS PENDIDIKAN" oninput="queueAutoSave()">
            </div>
            <div class="form-group">
              <label>Nama Sekolah *</label>
              <input type="text" id="namaSekolah" class="form-control" placeholder="Contoh: SD NEGERI RAWAMANGUN 01 PAGI" oninput="queueAutoSave()">
            </div>
          </div>

          <div class="grid-2 mt-3">
            <div class="form-group">
              <label>Nama Ujian *</label>
              <input type="text" id="namaUjian" class="form-control" placeholder="Contoh: PENILAIAN SUMATIF AKHIR SEMESTER" oninput="queueAutoSave()">
            </div>
            <div class="form-group">
              <label>Tahun Ajaran *</label>
              <input type="text" id="tahunAjaran" class="form-control" placeholder="Contoh: 2026/2027" oninput="queueAutoSave()">
            </div>
          </div>

          <hr class="my-3">
          <h4 class="sub-section-title">Identitas Siswa & Petunjuk Ujian (2 Kolom)</h4>

          <div class="grid-3 mt-3">
            <div class="form-group">
              <label>Mata Pelajaran *</label>
              <input type="text" id="mataPelajaran" class="form-control" placeholder="Contoh: Matematika" oninput="queueAutoSave()">
            </div>
            <div class="form-group">
              <label>Kelas *</label>
              <input type="text" id="kelas" class="form-control" placeholder="Contoh: IV (Empat)" oninput="queueAutoSave()">
            </div>
            <div class="form-group">
              <label>Hari / Tanggal</label>
              <input type="text" id="hariTanggal" class="form-control" placeholder="Contoh: Senin, 08 Desember 2026" oninput="queueAutoSave()">
            </div>
          </div>

          <div class="form-group mt-3">
            <label>Petunjuk Pengerjaan (Dapat disesuaikan)</label>
            <textarea id="petunjukPengerjaan" class="form-control" rows="4" oninput="queueAutoSave()"></textarea>
          </div>
        </div>
      </div>

      <!-- Pengaturan & Daftar Soal -->
      <div class="card">
        <div class="card-header flex-between">
          <div>
            <h3>2. Daftar & Input Soal</h3>
            <span id="questionStatsBadge" class="text-sm text-muted">Total: 0 Soal (0 PG, 0 Isian, 0 Esai)</span>
          </div>
          <div class="btn-group">
            <button class="btn btn-sm btn-primary" onclick="addQuestion('PG')">+ Tambah PG</button>
            <button class="btn btn-sm btn-primary" onclick="addQuestion('ISIAN')">+ Tambah Isian</button>
            <button class="btn btn-sm btn-primary" onclick="addQuestion('ESAI')">+ Tambah Esai</button>
          </div>
        </div>

        <div class="card-body">
          <div id="questionsContainer" class="questions-container">
            <!-- Soal akan di-render di sini secara dinamis -->
          </div>
        </div>
      </div>
    </section>

    <!-- VIEW 3: PRATINJAU DOKUMEN -->
    <section id="viewPreview" class="view-panel">
      <div class="preview-subnav">
        <button class="subnav-btn active" onclick="switchPreviewTab('naskah')">📄 Naskah Soal (Format 2 Kolom)</button>
        <button class="subnav-btn" onclick="switchPreviewTab('kisikisi')">📊 Tabel Kisi-Kisi</button>
        <button class="subnav-btn" onclick="switchPreviewTab('kunci')">🔑 Kunci Jawaban & Rubrik</button>
        <button class="btn btn-primary ml-auto" onclick="openExportModal()">⬇️ Unduh 3 File Word (.docx)</button>
      </div>

      <div class="preview-sheet-wrapper">
        <div id="previewContentArea" class="preview-sheet font-times">
          <!-- Live Preview Dokumen -->
        </div>
      </div>
    </section>
  </main>

  <!-- MODAL EKSPOR WORD -->
  <div id="exportModal" class="modal-backdrop" style="display:none;">
    <div class="modal-box">
      <div class="modal-header">
        <h3>Ekspor 3 File Word (.docx)</h3>
        <button class="modal-close" onclick="closeExportModal()">✕</button>
      </div>
      <div class="modal-body">
        <p>Sistem akan membuat 3 file Microsoft Word (.docx) terpisah sesuai spesifikasi kurikulum SD:</p>
        <ul class="export-file-list">
          <li><strong>File 1:</strong> [Nama Sekolah] - [Nama Ujian] - Naskah Soal.docx (Format 2 Kolom, Kop, Identitas Siswa)</li>
          <li><strong>File 2:</strong> [Nama Sekolah] - [Nama Ujian] - Kisi-Kisi.docx (Tabel 10 Kolom Lengkap)</li>
          <li><strong>File 3:</strong> [Nama Sekolah] - [Nama Ujian] - Kunci Jawaban.docx (Kunci PG, Isian, & Rubrik Esai)</li>
        </ul>

        <div id="exportStatusBox" class="status-box" style="display:none;">
          <div class="spinner"></div>
          <p id="exportStatusText">Memvalidasi dan memproses 3 dokumen Word...</p>
        </div>

        <div id="exportResultsBox" style="display:none;">
          <h4 class="text-success">✅ Dokumen Berhasil Dibuat!</h4>
          <div id="exportLinksList" class="export-links-list"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeExportModal()">Tutup</button>
        <button id="btnExecuteExport" class="btn btn-primary" onclick="executeExport()">Mulai Ekspor Word (.docx)</button>
      </div>
    </div>
  </div>

  <?!= include('JavaScript'); ?>
</body>
</html>
`;

export const GAS_CSS_HTML = `<style>
:root {
  --primary: #1E40AF;
  --primary-hover: #1D4ED8;
  --surface: #FFFFFF;
  --bg: #F8FAFC;
  --border: #CBD5E1;
  --text-main: #0F172A;
  --text-muted: #475569;
  --success: #15803D;
  --danger: #B91C1C;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-times: 'Times New Roman', Times, serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  background-color: var(--bg);
  color: var(--text-main);
  line-height: 1.5;
  font-size: 14px;
}

/* Header */
.app-header {
  background: #FFFFFF;
  border-bottom: 1px solid var(--border);
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  font-size: 28px;
}

.brand h1 {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #1E3A8A;
}

.brand-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-saved {
  background: #DCFCE7;
  color: #166534;
}

.badge-saving {
  background: #FEF3C7;
  color: #92400E;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

/* Container & Tabs */
.app-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 16px 40px;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.btn-export-highlight {
  margin-left: auto;
  background: #2563EB;
  color: #FFFFFF !important;
  border-radius: 6px;
  border: none;
  padding: 8px 16px;
}

/* Panels */
.view-panel {
  display: none;
}

.view-panel.active {
  display: block;
}

/* Cards & Layout */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.card-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
}

.card-body {
  padding: 20px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.15);
}

/* Logo Box */
.logo-upload-box {
  background: #F1F5F9;
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.logo-preview-area {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.logo-preview-area img {
  max-height: 80px;
  max-width: 120px;
  object-fit: contain;
}

.logo-placeholder {
  color: var(--text-muted);
  font-size: 12px;
}

.logo-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #E2E8F0;
  color: #1E293B;
}

.btn-outline {
  border-color: var(--border);
  background: white;
  color: #334155;
}

.btn-danger-outline {
  border-color: #FECACA;
  background: white;
  color: var(--danger);
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th, .data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  background: #F8FAFC;
  font-weight: 600;
  color: #334155;
  font-size: 12px;
  text-transform: uppercase;
}

/* Question Editor Card */
.question-item-card {
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.question-item-card.border-pg { border-left: 4px solid #3B82F6; }
.question-item-card.border-isian { border-left: 4px solid #10B981; }
.question-item-card.border-esai { border-left: 4px solid #F59E0B; }

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.badge-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.badge-pg { background: #DBEAFE; color: #1E40AF; }
.badge-isian { background: #D1FAE5; color: #065F46; }
.badge-esai { background: #FEF3C7; color: #92400E; }

/* Preview Sheet Paper */
.preview-sheet-wrapper {
  background: #64748B;
  padding: 24px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.preview-sheet {
  background: white;
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  font-family: var(--font-times);
  color: black;
}

.preview-subnav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.subnav-btn {
  padding: 8px 14px;
  background: #E2E8F0;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.subnav-btn.active {
  background: var(--primary);
  color: white;
}

/* 2-Kolom Preview */
.two-column-layout {
  column-count: 2;
  column-gap: 24px;
  column-rule: 1px solid #E2E8F0;
  text-align: justify;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 14px 20px;
  background: #F8FAFC;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.export-file-list {
  margin: 12px 0 16px 20px;
}

.export-file-list li {
  margin-bottom: 6px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #CBD5E1;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
`;

export const GAS_JAVASCRIPT_HTML = `<script>
/**
 * Frontend Application Controller untuk Google Apps Script
 */

let currentExam = {
  examId: '',
  namaInstansi: 'PEMERINTAH KOTA JAKARTA TIMUR\\nDINAS PENDIDIKAN',
  namaSekolah: 'SD NEGERI RAWAMANGUN 01 PAGI',
  namaUjian: 'SUMATIF AKHIR SEMESTER (SAS) GANJIL',
  tahunAjaran: '2026/2027',
  mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  namaSiswa: '......................................................',
  kelas: 'IV (Empat)',
  hariTanggal: 'Senin, 08 Desember 2026',
  petunjukPengerjaan: 
\`1. Berdoalah sebelum mengerjakan soal.
2. Tulislah nama dan identitas dengan lengkap pada lembar jawaban.
3. Bacalah setiap soal dengan teliti sebelum menjawab.
4. Pilihlah satu jawaban yang paling tepat dengan menyilang (X) huruf A, B, C, atau D pada lembar jawaban.
5. Isilah soal isian singkat dengan jawaban yang benar dan tepat.
6. Jawablah soal esai dengan kalimat yang jelas dan runtut.
7. Periksa kembali jawabanmu sebelum diserahkan kepada pengawas.\`,
  logoKiriFileId: '',
  logoKiriUrl: '',
  logoKananFileId: '',
  logoKananUrl: '',
  status: 'Baru'
};

let currentQuestions = [];
let autosaveTimeout = null;

// Initial Load
window.addEventListener('DOMContentLoaded', function() {
  loadDraftsList();
});

/**
 * Pindah Tampilan (Tabs)
 */
function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  if (viewName === 'drafts') {
    document.getElementById('viewDrafts').classList.add('active');
    document.getElementById('tabBtnDrafts').classList.add('active');
    loadDraftsList();
  } else if (viewName === 'exam') {
    document.getElementById('viewExam').classList.add('active');
    document.getElementById('tabBtnExam').classList.add('active');
    renderExamForm();
  } else if (viewName === 'preview') {
    document.getElementById('viewPreview').classList.add('active');
    document.getElementById('tabBtnPreview').classList.add('active');
    renderDocumentPreview('naskah');
  }
}

/**
 * Mengambil daftar draf dari server Google Apps Script
 */
function loadDraftsList() {
  const tbody = document.getElementById('draftsTableBody');
  tbody.innerHTML = '<tr><td colspan="12" class="text-center py-4">Memuat daftar draf ujian...</td></tr>';

  google.script.run
    .withSuccessHandler(function(drafts) {
      if (!drafts || drafts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="text-center py-4 text-muted">Belum ada draf ujian. Silakan klik "+ Buat Ujian Baru".</td></tr>';
        return;
      }

      let html = '';
      drafts.forEach(function(d, idx) {
        html += \`<tr>
          <td>\${idx + 1}</td>
          <td><strong>\${escapeHtml(d.namaUjian || 'Ujian Tanpa Nama')}</strong></td>
          <td>\${escapeHtml(d.namaSekolah || '-')}</td>
          <td>\${escapeHtml(d.mataPelajaran || '-')}</td>
          <td>\${escapeHtml(d.kelas || '-')}</td>
          <td>\${escapeHtml(d.tahunAjaran || '-')}</td>
          <td>\${d.jumlahPG}</td>
          <td>\${d.jumlahIsian}</td>
          <td>\${d.jumlahEsai}</td>
          <td><span class="badge-tag \${getStatusBadgeClass(d.status)}">\${d.status}</span></td>
          <td>\${formatDate(d.updatedAt)}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="loadDraftDetail('\${d.examId}')">Buka / Edit</button>
            <button class="btn btn-sm btn-danger-outline" onclick="deleteDraftConfirm('\${d.examId}')">Hapus</button>
          </td>
        </tr>\`;
      });
      tbody.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      tbody.innerHTML = '<tr><td colspan="12" class="text-center py-4 text-danger">Gagal memuat draf: ' + err.message + '</td></tr>';
    })
    .getDrafts();
}

/**
 * Buat Draf Ujian Baru
 */
function createNewDraft() {
  currentExam = {
    examId: '',
    namaInstansi: 'PEMERINTAH KOTA JAKARTA TIMUR\\nDINAS PENDIDIKAN',
    namaSekolah: '',
    namaUjian: 'SUMATIF AKHIR SEMESTER (SAS)',
    tahunAjaran: '2026/2027',
    mataPelajaran: '',
    namaSiswa: '......................................................',
    kelas: '',
    hariTanggal: '',
    petunjukPengerjaan: document.getElementById('petunjukPengerjaan') ? document.getElementById('petunjukPengerjaan').value : '',
    status: 'Baru'
  };
  currentQuestions = [];
  switchView('exam');
  queueAutoSave();
}

/**
 * Buka draf tertentu
 */
function loadDraftDetail(examId) {
  setAutosaveStatus('saving', 'Memuat draf...');
  google.script.run
    .withSuccessHandler(function(data) {
      currentExam = data.identity;
      currentQuestions = data.questions || [];
      switchView('exam');
      setAutosaveStatus('saved', 'Draf berhasil dimuat');
    })
    .withFailureHandler(function(err) {
      alert('Gagal memuat draf: ' + err.message);
      setAutosaveStatus('saved', 'Gagal memuat draf');
    })
    .getExam(examId);
}

/**
 * Render Form Identitas Ujian & Daftar Soal
 */
function renderExamForm() {
  document.getElementById('namaInstansi').value = currentExam.namaInstansi || '';
  document.getElementById('namaSekolah').value = currentExam.namaSekolah || '';
  document.getElementById('namaUjian').value = currentExam.namaUjian || '';
  document.getElementById('tahunAjaran').value = currentExam.tahunAjaran || '';
  document.getElementById('mataPelajaran').value = currentExam.mataPelajaran || '';
  document.getElementById('kelas').value = currentExam.kelas || '';
  document.getElementById('hariTanggal').value = currentExam.hariTanggal || '';
  document.getElementById('petunjukPengerjaan').value = currentExam.petunjukPengerjaan || '';

  renderLogoPreviews();
  renderQuestionsList();
}

function renderLogoPreviews() {
  const kiriBox = document.getElementById('logoKiriPreview');
  const kananBox = document.getElementById('logoKananPreview');

  if (currentExam.logoKiriUrl) {
    kiriBox.innerHTML = '<img src="' + currentExam.logoKiriUrl + '" alt="Logo Kiri">';
  } else {
    kiriBox.innerHTML = '<span class="logo-placeholder">Belum ada logo kiri</span>';
  }

  if (currentExam.logoKananUrl) {
    kananBox.innerHTML = '<img src="' + currentExam.logoKananUrl + '" alt="Logo Kanan">';
  } else {
    kananBox.innerHTML = '<span class="logo-placeholder">Belum ada logo kanan</span>';
  }
}

/**
 * Tambah Soal Baru
 */
function addQuestion(jenis) {
  const newQ = {
    questionId: 'Q-' + Date.now(),
    examId: currentExam.examId,
    nomorSoal: currentQuestions.length + 1,
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
    bobotNilai: jenis === 'PG' ? 1 : (jenis === 'ISIAN' ? 2 : 5)
  };

  currentQuestions.push(newQ);
  renderQuestionsList();
  queueAutoSave();
}

/**
 * Render Daftar Soal
 */
function renderQuestionsList() {
  const container = document.getElementById('questionsContainer');
  const statsBadge = document.getElementById('questionStatsBadge');

  let pgCount = 0, isianCount = 0, esaiCount = 0;
  currentQuestions.forEach(q => {
    if (q.jenisSoal === 'PG') pgCount++;
    else if (q.jenisSoal === 'ISIAN') isianCount++;
    else if (q.jenisSoal === 'ESAI') esaiCount++;
  });
  statsBadge.innerText = \`Total: \${currentQuestions.length} Soal (\${pgCount} PG, \${isianCount} Isian, \${esaiCount} Esai)\`;

  if (currentQuestions.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-muted">Belum ada soal. Klik tombol di atas untuk menambahkan soal PG, Isian, atau Esai.</div>';
    return;
  }

  let html = '';
  currentQuestions.forEach((q, idx) => {
    const borderClass = q.jenisSoal === 'PG' ? 'border-pg' : (q.jenisSoal === 'ISIAN' ? 'border-isian' : 'border-esai');
    const badgeClass = q.jenisSoal === 'PG' ? 'badge-pg' : (q.jenisSoal === 'ISIAN' ? 'badge-isian' : 'badge-esai');
    const labelJenis = q.jenisSoal === 'PG' ? 'PILIHAN GANDA' : (q.jenisSoal === 'ISIAN' ? 'ISIAN SINGKAT' : 'ESAI / URAIAN');

    html += \`
    <div class="question-item-card \${borderClass}" id="qCard_\${idx}">
      <div class="question-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:700; font-size:16px;">#\${idx + 1}</span>
          <span class="badge-tag \${badgeClass}">\${labelJenis}</span>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline" title="Naikkan Urutan" onclick="moveQuestion(\${idx}, -1)" \${idx === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn btn-sm btn-outline" title="Turunkan Urutan" onclick="moveQuestion(\${idx}, 1)" \${idx === currentQuestions.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="btn btn-sm btn-outline" title="Duplikat Soal" onclick="duplicateQuestion(\${idx})">📋 Duplikat</button>
          <button class="btn btn-sm btn-danger-outline" title="Hapus Soal" onclick="deleteQuestion(\${idx})">🗑️ Hapus</button>
        </div>
      </div>

      <!-- Teks Pertanyaan -->
      <div class="form-group mb-3">
        <label>Pertanyaan Soal *</label>
        <textarea class="form-control" rows="3" placeholder="Tuliskan teks pertanyaan soal..." oninput="updateQuestionField(\${idx}, 'pertanyaan', this.value)">\${escapeHtml(q.pertanyaan)}</textarea>
      </div>
    \`;

    // Opsi jika PG
    if (q.jenisSoal === 'PG') {
      html += \`
      <div class="grid-2 mb-3">
        <div class="form-group">
          <label>Opsi A *</label>
          <input type="text" class="form-control" value="\${escapeHtml(q.opsiA)}" oninput="updateQuestionField(\${idx}, 'opsiA', this.value)">
        </div>
        <div class="form-group">
          <label>Opsi B *</label>
          <input type="text" class="form-control" value="\${escapeHtml(q.opsiB)}" oninput="updateQuestionField(\${idx}, 'opsiB', this.value)">
        </div>
        <div class="form-group">
          <label>Opsi C *</label>
          <input type="text" class="form-control" value="\${escapeHtml(q.opsiC)}" oninput="updateQuestionField(\${idx}, 'opsiC', this.value)">
        </div>
        <div class="form-group">
          <label>Opsi D *</label>
          <input type="text" class="form-control" value="\${escapeHtml(q.opsiD)}" oninput="updateQuestionField(\${idx}, 'opsiD', this.value)">
        </div>
      </div>
      <div class="grid-2 mb-3">
        <div class="form-group">
          <label>Kunci Jawaban (A / B / C / D) *</label>
          <select class="form-control" onchange="updateQuestionField(\${idx}, 'kunciJawaban', this.value)">
            <option value="A" \${q.kunciJawaban === 'A' ? 'selected' : ''}>A</option>
            <option value="B" \${q.kunciJawaban === 'B' ? 'selected' : ''}>B</option>
            <option value="C" \${q.kunciJawaban === 'C' ? 'selected' : ''}>C</option>
            <option value="D" \${q.kunciJawaban === 'D' ? 'selected' : ''}>D</option>
          </select>
        </div>
        <div class="form-group">
          <label>Bobot Nilai</label>
          <input type="number" class="form-control" value="\${q.bobotNilai || 1}" oninput="updateQuestionField(\${idx}, 'bobotNilai', Number(this.value))">
        </div>
      </div>
      \`;
    } else if (q.jenisSoal === 'ISIAN') {
      html += \`
      <div class="grid-2 mb-3">
        <div class="form-group">
          <label>Kunci Jawaban Isian Singkat *</label>
          <input type="text" class="form-control" value="\${escapeHtml(q.kunciJawaban)}" placeholder="Jawaban singkat yang tepat..." oninput="updateQuestionField(\${idx}, 'kunciJawaban', this.value)">
        </div>
        <div class="form-group">
          <label>Bobot Nilai</label>
          <input type="number" class="form-control" value="\${q.bobotNilai || 2}" oninput="updateQuestionField(\${idx}, 'bobotNilai', Number(this.value))">
        </div>
      </div>
      \`;
    } else if (q.jenisSoal === 'ESAI') {
      html += \`
      <div class="form-group mb-3">
        <label>Pedoman Jawaban / Rubrik Penilaian *</label>
        <textarea class="form-control" rows="2" placeholder="Pedoman jawaban lengkap dan rubrik skor..." oninput="updateQuestionField(\${idx}, 'kunciJawaban', this.value)">\${escapeHtml(q.kunciJawaban)}</textarea>
      </div>
      <div class="form-group mb-3" style="max-width:200px;">
        <label>Bobot Nilai</label>
        <input type="number" class="form-control" value="\${q.bobotNilai || 5}" oninput="updateQuestionField(\${idx}, 'bobotNilai', Number(this.value))">
      </div>
      \`;
    }

    // Bagian Kisi-Kisi Meta
    html += \`
      <details style="margin-top:10px; background:#F8FAFC; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
        <summary style="font-weight:600; cursor:pointer; color:#334155;">Parameter Kisi-Kisi & Kurikulum (Materi, Indikator, Level Kognitif)</summary>
        <div class="grid-2 mt-3">
          <div class="form-group">
            <label>Materi Pokok</label>
            <input type="text" class="form-control" value="\${escapeHtml(q.materi)}" placeholder="Materi pokok pembelajaran..." oninput="updateQuestionField(\${idx}, 'materi', this.value)">
          </div>
          <div class="form-group">
            <label>Tujuan Pembelajaran (TP)</label>
            <input type="text" class="form-control" value="\${escapeHtml(q.tujuanPembelajaran)}" placeholder="Tujuan pembelajaran..." oninput="updateQuestionField(\${idx}, 'tujuanPembelajaran', this.value)">
          </div>
        </div>
        <div class="grid-2 mt-3">
          <div class="form-group">
            <label>Indikator Soal</label>
            <input type="text" class="form-control" value="\${escapeHtml(q.indikatorSoal)}" placeholder="Disajikan narasi, siswa dapat..." oninput="updateQuestionField(\${idx}, 'indikatorSoal', this.value)">
          </div>
          <div class="form-group">
            <label>Level Kognitif</label>
            <select class="form-control" onchange="updateQuestionField(\${idx}, 'levelKognitif', this.value)">
              <option value="C1" \${q.levelKognitif === 'C1' ? 'selected' : ''}>C1 - Mengingat</option>
              <option value="C2" \${q.levelKognitif === 'C2' ? 'selected' : ''}>C2 - Memahami</option>
              <option value="C3" \${q.levelKognitif === 'C3' ? 'selected' : ''}>C3 - Mengaplikasikan</option>
              <option value="C4" \${q.levelKognitif === 'C4' ? 'selected' : ''}>C4 - Menganalisis</option>
              <option value="C5" \${q.levelKognitif === 'C5' ? 'selected' : ''}>C5 - Mengevaluasi</option>
              <option value="C6" \${q.levelKognitif === 'C6' ? 'selected' : ''}>C6 - Mencipta</option>
            </select>
          </div>
        </div>
      </details>
    </div>
    \`;
  });

  container.innerHTML = html;
}

function updateQuestionField(idx, field, value) {
  if (currentQuestions[idx]) {
    currentQuestions[idx][field] = value;
    queueAutoSave();
  }
}

function moveQuestion(idx, direction) {
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= currentQuestions.length) return;

  const temp = currentQuestions[idx];
  currentQuestions[idx] = currentQuestions[targetIdx];
  currentQuestions[targetIdx] = temp;

  renderQuestionsList();
  queueAutoSave();
}

function duplicateQuestion(idx) {
  const source = currentQuestions[idx];
  const copy = JSON.parse(JSON.stringify(source));
  copy.questionId = 'Q-' + Date.now();
  currentQuestions.splice(idx + 1, 0, copy);
  renderQuestionsList();
  queueAutoSave();
}

function deleteQuestion(idx) {
  if (confirm('Hapus soal nomor ' + (idx + 1) + '?')) {
    currentQuestions.splice(idx, 1);
    renderQuestionsList();
    queueAutoSave();
  }
}

/**
 * Mekanisme Autosave Otomatis dengan Debounce 1.5 detik
 */
function queueAutoSave() {
  setAutosaveStatus('saving', 'Menyimpan perubahan...');
  if (autosaveTimeout) clearTimeout(autosaveTimeout);
  autosaveTimeout = setTimeout(executeSave, 1500);
}

function triggerManualSave() {
  if (autosaveTimeout) clearTimeout(autosaveTimeout);
  executeSave();
}

function executeSave() {
  // Ambil state form terkini
  currentExam.namaInstansi = document.getElementById('namaInstansi') ? document.getElementById('namaInstansi').value : currentExam.namaInstansi;
  currentExam.namaSekolah = document.getElementById('namaSekolah') ? document.getElementById('namaSekolah').value : currentExam.namaSekolah;
  currentExam.namaUjian = document.getElementById('namaUjian') ? document.getElementById('namaUjian').value : currentExam.namaUjian;
  currentExam.tahunAjaran = document.getElementById('tahunAjaran') ? document.getElementById('tahunAjaran').value : currentExam.tahunAjaran;
  currentExam.mataPelajaran = document.getElementById('mataPelajaran') ? document.getElementById('mataPelajaran').value : currentExam.mataPelajaran;
  currentExam.kelas = document.getElementById('kelas') ? document.getElementById('kelas').value : currentExam.kelas;
  currentExam.hariTanggal = document.getElementById('hariTanggal') ? document.getElementById('hariTanggal').value : currentExam.hariTanggal;
  currentExam.petunjukPengerjaan = document.getElementById('petunjukPengerjaan') ? document.getElementById('petunjukPengerjaan').value : currentExam.petunjukPengerjaan;

  google.script.run
    .withSuccessHandler(function(res) {
      if (res && res.examId) {
        currentExam.examId = res.examId;
      }
      setAutosaveStatus('saved', 'Semua data tersimpan otomatis');
    })
    .withFailureHandler(function(err) {
      setAutosaveStatus('error', 'Gagal menyimpan: ' + err.message);
    })
    .saveExam(currentExam, currentQuestions);
}

function setAutosaveStatus(state, text) {
  const indicator = document.getElementById('autosaveIndicator');
  const label = document.getElementById('autosaveText');
  indicator.className = 'badge-status ' + (state === 'saving' ? 'badge-saving' : (state === 'error' ? 'badge-danger' : 'badge-saved'));
  label.innerText = text;
}

/**
 * Handle Logo Upload
 */
function handleLogoUpload(event, posisi) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    setAutosaveStatus('saving', 'Mengunggah logo...');

    google.script.run
      .withSuccessHandler(function(res) {
        if (posisi === 'kiri') {
          currentExam.logoKiriFileId = res.fileId;
          currentExam.logoKiriUrl = res.viewUrl;
        } else {
          currentExam.logoKananFileId = res.fileId;
          currentExam.logoKananUrl = res.viewUrl;
        }
        renderLogoPreviews();
        queueAutoSave();
      })
      .withFailureHandler(function(err) {
        alert('Gagal mengunggah logo: ' + err.message);
        setAutosaveStatus('saved', 'Gagal unggah logo');
      })
      .uploadLogo(base64, file.name, file.type);
  };
  reader.readAsDataURL(file);
}

function removeLogo(posisi) {
  if (posisi === 'kiri') {
    currentExam.logoKiriFileId = '';
    currentExam.logoKiriUrl = '';
  } else {
    currentExam.logoKananFileId = '';
    currentExam.logoKananUrl = '';
  }
  renderLogoPreviews();
  queueAutoSave();
}

/**
 * Hapus Draf
 */
function deleteDraftConfirm(examId) {
  if (confirm('Apakah Anda yakin ingin menghapus draf ujian ini beserta seluruh soalnya?')) {
    google.script.run
      .withSuccessHandler(function() {
        loadDraftsList();
      })
      .withFailureHandler(function(err) {
        alert('Gagal menghapus: ' + err.message);
      })
      .deleteExam(examId);
  }
}

/**
 * Pratinjau Dokumen
 */
function switchPreviewTab(tab) {
  document.querySelectorAll('.subnav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderDocumentPreview(tab);
}

function renderDocumentPreview(tab) {
  const area = document.getElementById('previewContentArea');
  if (tab === 'naskah') {
    area.innerHTML = buildNaskahPreviewHtml();
  } else if (tab === 'kisikisi') {
    area.innerHTML = buildKisiKisiPreviewHtml();
  } else if (tab === 'kunci') {
    area.innerHTML = buildKunciPreviewHtml();
  }
}

function buildNaskahPreviewHtml() {
  const pgList = currentQuestions.filter(q => q.jenisSoal === 'PG');
  const isianList = currentQuestions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = currentQuestions.filter(q => q.jenisSoal === 'ESAI');

  let html = \`
  <!-- KOP SURAT -->
  <div style="display:flex; align-items:center; border-bottom:3px double #000; padding-bottom:8px; margin-bottom:12px;">
    <div style="width:70px; text-align:center;">
      \${currentExam.logoKiriUrl ? '<img src="' + currentExam.logoKiriUrl + '" style="height:60px;">' : ''}
    </div>
    <div style="flex:1; text-align:center;">
      <div style="font-size:14pt; font-weight:bold;">\${escapeHtml(currentExam.namaInstansi || 'PEMERINTAH KOTA\\nDINAS PENDIDIKAN').replace(/\\n/g, '<br>')}</div>
      <div style="font-size:16pt; font-weight:bold;">\${escapeHtml(currentExam.namaSekolah || 'SD NEGERI CONTOH').toUpperCase()}</div>
      <div style="font-size:18pt; font-weight:bold;">\${escapeHtml(currentExam.namaUjian || 'PENILAIAN SUMATIF AKHIR SEMESTER').toUpperCase()}</div>
      <div style="font-size:12pt;">TAHUN AJARAN \${escapeHtml(currentExam.tahunAjaran || '2026/2027')}</div>
    </div>
    <div style="width:70px; text-align:center;">
      \${currentExam.logoKananUrl ? '<img src="' + currentExam.logoKananUrl + '" style="height:60px;">' : ''}
    </div>
  </div>

  <!-- IDENTITAS SISWA 2 KOLOM -->
  <table style="width:100%; font-size:11pt; margin-bottom:12px; border-collapse:collapse;">
    <tr>
      <td style="width:50%; vertical-align:top;">
        <div>Mata Pelajaran : \${escapeHtml(currentExam.mataPelajaran || '-')}</div>
        <div>Nama Siswa    : \${escapeHtml(currentExam.namaSiswa || '...........................................')}</div>
        <div>Kelas         : \${escapeHtml(currentExam.kelas || '-')}</div>
      </td>
      <td style="width:50%; vertical-align:top;">
        <div>Hari/Tanggal  : \${escapeHtml(currentExam.hariTanggal || '-')}</div>
        <div>Nilai         : ...........................................</div>
        <div>Paraf Guru    : ...........................................</div>
      </td>
    </tr>
  </table>

  <!-- PETUNJUK -->
  <div style="font-size:11pt; font-weight:bold; margin-bottom:4px;">PETUNJUK PENGERJAAN:</div>
  <div style="font-size:10pt; margin-bottom:14px; white-space:pre-line;">\${escapeHtml(currentExam.petunjukPengerjaan || '')}</div>

  <!-- SOAL 2 KOLOM -->
  <div class="two-column-layout" style="font-size:11pt;">
  \`;

  let no = 1;
  if (pgList.length > 0) {
    html += '<div style="font-weight:bold; margin-bottom:8px;">I. PILIHAN GANDA</div>';
    pgList.forEach(q => {
      html += \`
      <div style="margin-bottom:12px; break-inside:avoid;">
        <div><strong>\${no++}.</strong> \${escapeHtml(q.pertanyaan)}</div>
        <div style="margin-left:14px; margin-top:2px;">A. \${escapeHtml(q.opsiA)}</div>
        <div style="margin-left:14px;">B. \${escapeHtml(q.opsiB)}</div>
        <div style="margin-left:14px;">C. \${escapeHtml(q.opsiC)}</div>
        <div style="margin-left:14px;">D. \${escapeHtml(q.opsiD)}</div>
      </div>
      \`;
    });
  }

  if (isianList.length > 0) {
    html += '<div style="font-weight:bold; margin-top:10px; margin-bottom:8px;">II. ISIAN SINGKAT</div>';
    isianList.forEach(q => {
      html += \`
      <div style="margin-bottom:10px; break-inside:avoid;">
        <div><strong>\${no++}.</strong> \${escapeHtml(q.pertanyaan)}</div>
      </div>
      \`;
    });
  }

  if (esaiList.length > 0) {
    html += '<div style="font-weight:bold; margin-top:10px; margin-bottom:8px;">III. ESAI / URAIAN</div>';
    esaiList.forEach(q => {
      html += \`
      <div style="margin-bottom:14px; break-inside:avoid;">
        <div><strong>\${no++}.</strong> \${escapeHtml(q.pertanyaan)}</div>
      </div>
      \`;
    });
  }

  html += '</div>';
  return html;
}

function buildKisiKisiPreviewHtml() {
  let html = \`
  <div style="text-align:center; margin-bottom:14px;">
    <h3 style="font-size:14pt; font-weight:bold;">KISI-KISI PENULISAN SOAL UJIAN</h3>
    <div style="font-size:12pt; font-weight:bold;">\${escapeHtml(currentExam.namaSekolah || '').toUpperCase()}</div>
    <div style="font-size:10pt;">Mapel: \${escapeHtml(currentExam.mataPelajaran || '-')} | Kelas: \${escapeHtml(currentExam.kelas || '-')} | Tahun: \${escapeHtml(currentExam.tahunAjaran || '-')}</div>
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:9.5pt;" border="1">
    <thead style="background:#E2E8F0;">
      <tr>
        <th style="padding:6px;">No</th>
        <th style="padding:6px;">No. Soal</th>
        <th style="padding:6px;">Mata Pelajaran</th>
        <th style="padding:6px;">Kelas</th>
        <th style="padding:6px;">Materi</th>
        <th style="padding:6px;">Tujuan Pembelajaran</th>
        <th style="padding:6px;">Indikator Soal</th>
        <th style="padding:6px;">Level</th>
        <th style="padding:6px;">Bentuk</th>
        <th style="padding:6px;">Bobot</th>
      </tr>
    </thead>
    <tbody>
  \`;

  currentQuestions.forEach((q, idx) => {
    const bentuk = q.jenisSoal === 'PG' ? 'Pilihan Ganda' : (q.jenisSoal === 'ISIAN' ? 'Isian Singkat' : 'Esai');
    html += \`
      <tr>
        <td style="text-align:center; padding:4px;">\${idx + 1}</td>
        <td style="text-align:center; padding:4px;">\${idx + 1}</td>
        <td style="padding:4px;">\${escapeHtml(currentExam.mataPelajaran || '-')}</td>
        <td style="text-align:center; padding:4px;">\${escapeHtml(currentExam.kelas || '-')}</td>
        <td style="padding:4px;">\${escapeHtml(q.materi || '-')}</td>
        <td style="padding:4px;">\${escapeHtml(q.tujuanPembelajaran || '-')}</td>
        <td style="padding:4px;">\${escapeHtml(q.indikatorSoal || '-')}</td>
        <td style="text-align:center; padding:4px;">\${q.levelKognitif || 'C1'}</td>
        <td style="text-align:center; padding:4px;">\${bentuk}</td>
        <td style="text-align:center; padding:4px;">\${q.bobotNilai || 1}</td>
      </tr>
    \`;
  });

  html += '</tbody></table>';
  return html;
}

function buildKunciPreviewHtml() {
  const pgList = currentQuestions.filter(q => q.jenisSoal === 'PG');
  const isianList = currentQuestions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = currentQuestions.filter(q => q.jenisSoal === 'ESAI');

  let html = \`
  <div style="text-align:center; margin-bottom:14px;">
    <h3 style="font-size:14pt; font-weight:bold;">KUNCI JAWABAN & PEDOMAN PENSKORAN</h3>
    <div style="font-size:12pt; font-weight:bold;">\${escapeHtml(currentExam.namaSekolah || '').toUpperCase()}</div>
  </div>
  \`;

  let no = 1;
  if (pgList.length > 0) {
    html += '<h4 style="font-size:11pt; font-weight:bold; margin-top:10px;">I. PILIHAN GANDA</h4>';
    html += '<table style="width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:12px;" border="1"><tr style="background:#E2E8F0;"><th style="width:60px;">No.</th><th>Kunci Jawaban</th><th style="width:80px;">Bobot</th></tr>';
    pgList.forEach(q => {
      html += \`<tr><td style="text-align:center;">\${no++}</td><td style="text-align:center; font-weight:bold;">\${q.kunciJawaban || '-'}</td><td style="text-align:center;">\${q.bobotNilai || 1}</td></tr>\`;
    });
    html += '</table>';
  }

  if (isianList.length > 0) {
    html += '<h4 style="font-size:11pt; font-weight:bold; margin-top:10px;">II. ISIAN SINGKAT</h4>';
    html += '<table style="width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:12px;" border="1"><tr style="background:#E2E8F0;"><th style="width:60px;">No.</th><th>Kunci Jawaban</th><th style="width:80px;">Bobot</th></tr>';
    isianList.forEach(q => {
      html += \`<tr><td style="text-align:center;">\${no++}</td><td>\${escapeHtml(q.kunciJawaban || '-')}</td><td style="text-align:center;">\${q.bobotNilai || 2}</td></tr>\`;
    });
    html += '</table>';
  }

  if (esaiList.length > 0) {
    html += '<h4 style="font-size:11pt; font-weight:bold; margin-top:10px;">III. ESAI / URAIAN (RUBRIK PENSKORAN)</h4>';
    html += '<table style="width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:12px;" border="1"><tr style="background:#E2E8F0;"><th style="width:60px;">No.</th><th>Pedoman / Rubrik Jawaban</th><th style="width:80px;">Bobot</th></tr>';
    esaiList.forEach(q => {
      html += \`<tr><td style="text-align:center;">\${no++}</td><td style="white-space:pre-line;">\${escapeHtml(q.kunciJawaban || '-')}</td><td style="text-align:center;">\${q.bobotNilai || 5}</td></tr>\`;
    });
    html += '</table>';
  }

  return html;
}

/**
 * Modal Ekspor
 */
function openExportModal() {
  document.getElementById('exportModal').style.display = 'flex';
  document.getElementById('exportStatusBox').style.display = 'none';
  document.getElementById('exportResultsBox').style.display = 'none';
  document.getElementById('btnExecuteExport').style.display = 'inline-flex';
}

function closeExportModal() {
  document.getElementById('exportModal').style.display = 'none';
}

function executeExport() {
  if (!currentExam.examId) {
    alert('Harap simpan ujian terlebih dahulu sebelum ekspor.');
    return;
  }

  const statusBox = document.getElementById('exportStatusBox');
  const resultsBox = document.getElementById('exportResultsBox');
  const btnExport = document.getElementById('btnExecuteExport');

  statusBox.style.display = 'block';
  resultsBox.style.display = 'none';
  btnExport.style.display = 'none';

  google.script.run
    .withSuccessHandler(function(res) {
      statusBox.style.display = 'none';
      resultsBox.style.display = 'block';

      let linksHtml = '';
      res.files.forEach(f => {
        linksHtml += \`
        <div style="background:#F1F5F9; padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>\${f.type}:</strong> \${f.name}
          </div>
          <div style="display:flex; gap:6px;">
            <a href="\${f.url}" class="btn btn-sm btn-primary" target="_blank">Unduh .DOCX</a>
            <a href="\${f.viewUrl}" class="btn btn-sm btn-outline" target="_blank">Buka di Drive</a>
          </div>
        </div>
        \`;
      });
      document.getElementById('exportLinksList').innerHTML = linksHtml;
    })
    .withFailureHandler(function(err) {
      statusBox.style.display = 'none';
      btnExport.style.display = 'inline-flex';
      alert('Gagal mengekspor dokumen: ' + err.message);
    })
    .exportExamToWord(currentExam.examId);
}

// Helpers
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStatusBadgeClass(status) {
  if (status === 'Selesai' || status === 'Sudah Diekspor') return 'badge-isian';
  if (status === 'Sedang Dikerjakan') return 'badge-pg';
  return 'badge-esai';
}

function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoString;
  }
}
</script>
`;

export const gasSourceCode = {
  codeGs: GAS_CODE_GS,
  indexHtml: GAS_INDEX_HTML,
  cssHtml: GAS_CSS_HTML,
  javascriptHtml: GAS_JAVASCRIPT_HTML,
};
