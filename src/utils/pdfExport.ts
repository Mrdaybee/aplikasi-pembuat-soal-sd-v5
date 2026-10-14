import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { ExamIdentity, Question } from '../types';
import { getAgencyNames } from './letterhead';

/**
 * Utilitas untuk mengamankan URL gambar (termasuk SVG Data URI dengan karakter unencoded)
 * agar tidak merusak atribut HTML atau membocorkan tag string ke naskah.
 */
export function safeImgSrc(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/svg+xml') && (trimmed.includes('<svg') || trimmed.includes('<SVG'))) {
    const rawSvg = trimmed.replace(/^data:image\/svg\+xml(;utf8)?,/, '');
    return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
  }
  return trimmed;
}

/**
 * Utilitas untuk membersihkan nama file dari karakter ilegal
 */
function getCleanFileName(exam: ExamIdentity, suffix: string, ext: string = 'pdf'): string {
  const cleanSchool = (exam.namaSekolah || 'SDN_Kedung_Dalam_1').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanUjian = (exam.namaUjian || 'Ujian').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanMapel = (exam.mataPelajaran || 'Mapel').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanSchool}_${cleanUjian}_${cleanMapel}_${suffix}.${ext}`;
}

/**
 * Komponen Kop Surat Resmi (Halaman 1)
 */
function renderKopHtml(exam: ExamIdentity): string {
  return `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <div style="width: 65px; text-align: center;">
        ${exam.logoKiriUrl ? `<img src="${safeImgSrc(exam.logoKiriUrl)}" style="max-width: 64px; max-height: 64px; object-fit: contain;" />` : ''}
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
          ${getAgencyNames(exam).namaInstansi}<br/>${getAgencyNames(exam).namaLembaga}
        </div>
        <div style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; line-height: 1.25; margin-top: 2px;">
          ${exam.namaSekolah || 'SD NEGERI KEDUNG DALAM 1'}
        </div>
        <div style="font-size: 8.5pt; margin-top: 2px; color: #111;">
          Alamat: Jl. Raya Mauk KM. 21, Kedung Dalam, Kec. Mauk, Kab. Tangerang, Banten
        </div>
      </div>
      <div style="width: 65px; text-align: center;">
        ${exam.logoKananUrl ? `<img src="${safeImgSrc(exam.logoKananUrl)}" style="max-width: 64px; max-height: 64px; object-fit: contain;" />` : ''}
      </div>
    </div>
    <!-- GARIS GANDA KOP SURAT RESMI (TEBAL - TIPIS) -->
    <div style="border-top: 3px solid #000; border-bottom: 1px solid #000; height: 3px; margin: 2px 0 8px 0;"></div>
  `;
}

/**
 * Komponen Judul Ujian (Halaman 1)
 */
function renderJudulHtml(exam: ExamIdentity): string {
  return `
    <div style="text-align: center; margin-bottom: 7px;">
      <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase;">
        ${exam.namaUjian || 'PENILAIAN SUMATIF AKHIR SEMESTER (SAS)'}
      </div>
      <div style="font-size: 9.5pt; font-weight: bold;">
        TAHUN AJARAN ${exam.tahunAjaran || '2025/2026'}
      </div>
    </div>
  `;
}

/**
 * Komponen Identitas Siswa (Halaman 1)
 */
function renderIdentitasHtml(exam: ExamIdentity): string {
  return `
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 8px; border: 1px solid #000;">
      <tr>
        <td style="padding: 3px 6px; width: 50%; border-right: 1px solid #000; vertical-align: top;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="width: 105px; font-weight: bold;">Mata Pelajaran</td><td style="width: 10px;">:</td><td>${exam.mataPelajaran || '-'}</td></tr>
            <tr><td style="font-weight: bold;">Kelas</td><td>:</td><td>${exam.kelas || '-'}</td></tr>
          </table>
        </td>
        <td style="padding: 3px 6px; width: 50%; vertical-align: top;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="width: 105px; font-weight: bold;">Hari / Tanggal</td><td style="width: 10px;">:</td><td>${exam.hariTanggal || '-'}</td></tr>
            <tr><td style="font-weight: bold;">Nama Siswa</td><td>:</td><td>${exam.namaSiswa || '...........................................'}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Komponen Petunjuk Pengerjaan (Halaman 1)
 */
function renderPetunjukHtml(exam: ExamIdentity): string {
  const petunjukLines = (exam.petunjukPengerjaan || '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa kelengkapan soal sebelum menjawab.\n3. Kerjakan terlebih dahulu soal yang dianggap mudah.')
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map(l => `<div style="margin-bottom: 1px;">${l.trim()}</div>`)
    .join('');

  return `
    <div style="font-size: 9pt; margin-bottom: 9px; background: #fafafa; border: 1px dashed #777; padding: 4px 7px; border-radius: 2px;">
      <div style="font-weight: bold; margin-bottom: 2px;">PETUNJUK PENGERJAAN:</div>
      ${petunjukLines}
    </div>
  `;
}

/**
 * Running Header untuk Halaman 2 dan seterusnya
 */
function renderRunningHeader(exam: ExamIdentity): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 10px; font-size: 8.5pt; font-weight: bold;">
      <span>${exam.namaUjian || 'NASKAH SOAL UJIAN'} - ${exam.mataPelajaran || ''}</span>
      <span>KELAS: ${exam.kelas || ''}</span>
    </div>
  `;
}

/**
 * Footer Halaman Resmi (Dilengkapi Nomor Halaman Dinamis)
 */
function renderPageFooter(docTitle: string, pageNum: number, totalPages: number): string {
  return `
    <div style="border-top: 1px solid #999; padding-top: 4px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #333;">
      <span>${docTitle}</span>
      <span style="font-weight: bold;">Halaman ${pageNum} dari ${totalPages}</span>
    </div>
  `;
}

interface QuestionBlock {
  html: string;
  type: 'header' | 'question';
  approxHeight: number;
}

/**
 * Estimasi tinggi elemen naskah untuk paginasi presisi tanpa pemotongan garis
 */
function estimateBlockHeight(block: QuestionBlock, colWidth: number): number {
  if (block.approxHeight > 0) return block.approxHeight;

  // Hitung perkiraan tinggi berdasarkan panjang karakter dan keberadaan gambar
  const textLength = block.html.replace(/<[^>]+>/g, '').length;
  const charsPerLine = colWidth > 500 ? 80 : 38;
  const lineCount = Math.max(1, Math.ceil(textLength / charsPerLine));
  let height = lineCount * 18;

  if (block.type === 'header') {
    height += 38;
  } else {
    height += 20; // Padding & margins
  }

  // Jika ada gambar
  if (block.html.includes('<img')) {
    height += 125;
  }

  // Jika opsi PG (A, B, C, D)
  if (block.html.includes('A.') && block.html.includes('B.')) {
    height += 56;
  }

  return height;
}

/**
 * Membangun blok-blok naskah soal (Header bagian + butir-butir soal)
 */
function prepareQuestionBlocks(questions: Question[]): QuestionBlock[] {
  const blocks: QuestionBlock[] = [];

  const pgList = questions.filter(q => q.jenisSoal === 'PG');
  const isianList = questions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = questions.filter(q => q.jenisSoal === 'ESAI');

  let currentNo = 1;

  // 1. BAGIAN PILIHAN GANDA
  if (pgList.length > 0) {
    blocks.push({
      type: 'header',
      approxHeight: 44,
      html: `
        <div style="margin-bottom: 7px; border-bottom: 1px solid #444; padding-bottom: 2px;">
          <div style="font-weight: bold; font-size: 10pt; text-transform: uppercase;">
            I. PILIHAN GANDA
          </div>
          <div style="font-size: 8.5pt; font-style: italic; color: #222; margin-top: 1px;">
            Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!
          </div>
        </div>
      `,
    });

    pgList.forEach(q => {
      const noTampil = currentNo++;
      const hasImage = Boolean(q.gambarUrl);
      const approxHeight = hasImage ? 195 : 95;

      const qHtml = `
        <div class="exam-question-item" style="margin-bottom: 7px; page-break-inside: avoid; break-inside: avoid; font-size: 9.5pt; line-height: 1.32;">
          <div style="display: flex; align-items: flex-start;">
            <span style="font-weight: bold; min-width: 20px; flex-shrink: 0;">${noTampil}.</span>
            <div style="flex: 1; text-align: justify;">${q.pertanyaan}</div>
          </div>
          ${hasImage ? `
            <div style="text-align: center; margin: 4px 0 2px 0;">
              <img src="${safeImgSrc(q.gambarUrl)}" alt="Stimulus Soal ${noTampil}" style="max-width: 175px; max-height: 110px; object-fit: contain; border: 1px solid #ccc; padding: 2px; background: #fff;" />
              ${q.gambarKeterangan ? `<div style="font-size: 8pt; font-style: italic; color: #444; margin-top: 1px;">${q.gambarKeterangan}</div>` : ''}
            </div>
          ` : ''}
          <div style="margin-left: 20px; margin-top: 2.5px; font-size: 9.5pt;">
            <div style="margin-bottom: 1.5px;">A. ${q.opsiA || '-'}</div>
            <div style="margin-bottom: 1.5px;">B. ${q.opsiB || '-'}</div>
            <div style="margin-bottom: 1.5px;">C. ${q.opsiC || '-'}</div>
            ${q.opsiD?.trim() ? `<div style="margin-bottom: 1.5px;">D. ${q.opsiD}</div>` : ''}
          </div>
        </div>
      `;

      blocks.push({
        type: 'question',
        approxHeight,
        html: qHtml,
      });
    });
  }

  // 2. BAGIAN ISIAN SINGKAT
  if (isianList.length > 0) {
    blocks.push({
      type: 'header',
      approxHeight: 44,
      html: `
        <div style="margin-bottom: 7px; border-bottom: 1px solid #444; padding-bottom: 2px; margin-top: 6px;">
          <div style="font-weight: bold; font-size: 10pt; text-transform: uppercase;">
            II. ISIAN SINGKAT
          </div>
          <div style="font-size: 8.5pt; font-style: italic; color: #222; margin-top: 1px;">
            Isilah titik-titik di bawah ini dengan jawaban yang tepat dan benar!
          </div>
        </div>
      `,
    });

    isianList.forEach(q => {
      const noTampil = currentNo++;
      const hasImage = Boolean(q.gambarUrl);
      const approxHeight = hasImage ? 170 : 60;

      const qHtml = `
        <div class="exam-question-item" style="margin-bottom: 7px; page-break-inside: avoid; break-inside: avoid; font-size: 9.5pt; line-height: 1.32;">
          <div style="display: flex; align-items: flex-start;">
            <span style="font-weight: bold; min-width: 20px; flex-shrink: 0;">${noTampil}.</span>
            <div style="flex: 1; text-align: justify;">${q.pertanyaan}</div>
          </div>
          ${hasImage ? `
            <div style="text-align: center; margin: 4px 0 2px 0;">
              <img src="${safeImgSrc(q.gambarUrl)}" alt="Stimulus Soal ${noTampil}" style="max-width: 175px; max-height: 110px; object-fit: contain; border: 1px solid #ccc; padding: 2px; background: #fff;" />
              ${q.gambarKeterangan ? `<div style="font-size: 8pt; font-style: italic; color: #444; margin-top: 1px;">${q.gambarKeterangan}</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      blocks.push({
        type: 'question',
        approxHeight,
        html: qHtml,
      });
    });
  }

  // 3. BAGIAN ESAI / URAIAN
  if (esaiList.length > 0) {
    blocks.push({
      type: 'header',
      approxHeight: 44,
      html: `
        <div style="margin-bottom: 7px; border-bottom: 1px solid #444; padding-bottom: 2px; margin-top: 6px;">
          <div style="font-weight: bold; font-size: 10pt; text-transform: uppercase;">
            III. ESAI / URAIAN
          </div>
          <div style="font-size: 8.5pt; font-style: italic; color: #222; margin-top: 1px;">
            Jawablah pertanyaan-pertanyaan di bawah ini dengan uraian yang jelas dan lengkap!
          </div>
        </div>
      `,
    });

    esaiList.forEach(q => {
      const noTampil = currentNo++;
      const hasImage = Boolean(q.gambarUrl);
      const approxHeight = hasImage ? 180 : 70;

      const qHtml = `
        <div class="exam-question-item" style="margin-bottom: 7px; page-break-inside: avoid; break-inside: avoid; font-size: 9.5pt; line-height: 1.32;">
          <div style="display: flex; align-items: flex-start;">
            <span style="font-weight: bold; min-width: 20px; flex-shrink: 0;">${noTampil}.</span>
            <div style="flex: 1; text-align: justify;">${q.pertanyaan}</div>
          </div>
          ${hasImage ? `
            <div style="text-align: center; margin: 4px 0 2px 0;">
              <img src="${safeImgSrc(q.gambarUrl)}" alt="Stimulus Soal ${noTampil}" style="max-width: 180px; max-height: 115px; object-fit: contain; border: 1px solid #ccc; padding: 2px; background: #fff;" />
              ${q.gambarKeterangan ? `<div style="font-size: 8pt; font-style: italic; color: #444; margin-top: 1px;">${q.gambarKeterangan}</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      blocks.push({
        type: 'question',
        approxHeight,
        html: qHtml,
      });
    });
  }

  return blocks;
}

/**
 * Membuat kumpulan elemen Halaman A4 Naskah Soal yang terbagi rapi
 * Menjamin tidak ada garis teks atau soal yang terpotong di tepi bawah.
 */
export function buildNaskahPages(
  exam: ExamIdentity,
  questions: Question[],
  layout: '2kolom' | '1kolom' = '2kolom'
): HTMLElement[] {
  const blocks = prepareQuestionBlocks(questions);
  const is2Kolom = layout === '2kolom';
  const colWidth = is2Kolom ? 340 : 704;

  // Batas tinggi konten per halaman (A4: 1123px, Padding: top 36px, bottom 36px, Footer: 24px)
  // Page 1 memiliki Kop + Judul + Identitas + Petunjuk (~315px)
  const page1MaxColHeight = 680;
  // Page 2 dan seterusnya memiliki Running Header (~26px)
  const pageNMaxColHeight = 990;

  // Struktur penampung halaman
  interface PageColumns {
    left: string[];
    right: string[];
  }

  const rawPages: PageColumns[] = [{ left: [], right: [] }];
  let currentPageIdx = 0;
  let currentCol: 'left' | 'right' = 'left';
  let currentUsedHeight = 0;

  blocks.forEach((block) => {
    const itemH = estimateBlockHeight(block, colWidth);
    const maxH = currentPageIdx === 0 ? page1MaxColHeight : pageNMaxColHeight;

    if (is2Kolom) {
      // Cek jangan tinggalkan judul bagian sendirian di dasar kolom jika sisa ruang sempit
      const isHeaderNearBottom = block.type === 'header' && (currentUsedHeight + itemH + 60 > maxH);

      if (currentUsedHeight + itemH > maxH || isHeaderNearBottom) {
        if (currentCol === 'left') {
          currentCol = 'right';
          currentUsedHeight = 0;
          rawPages[currentPageIdx].right.push(block.html);
          currentUsedHeight += itemH;
        } else {
          // Kolom kanan penuh, buka halaman baru
          currentPageIdx++;
          rawPages.push({ left: [], right: [] });
          currentCol = 'left';
          currentUsedHeight = 0;
          rawPages[currentPageIdx].left.push(block.html);
          currentUsedHeight += itemH;
        }
      } else {
        if (currentCol === 'left') {
          rawPages[currentPageIdx].left.push(block.html);
        } else {
          rawPages[currentPageIdx].right.push(block.html);
        }
        currentUsedHeight += itemH;
      }
    } else {
      // Mode 1 Kolom
      const isHeaderNearBottom = block.type === 'header' && (currentUsedHeight + itemH + 60 > maxH);

      if (currentUsedHeight + itemH > maxH || isHeaderNearBottom) {
        currentPageIdx++;
        rawPages.push({ left: [], right: [] });
        currentUsedHeight = 0;
        rawPages[currentPageIdx].left.push(block.html);
        currentUsedHeight += itemH;
      } else {
        rawPages[currentPageIdx].left.push(block.html);
        currentUsedHeight += itemH;
      }
    }
  });

  const totalPages = rawPages.length;
  const docTitle = `Naskah Soal - ${exam.mataPelajaran || 'Ujian'} ${exam.kelas ? `| Kelas ${exam.kelas}` : ''}`;

  return rawPages.map((pageData, idx) => {
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pdf-page-a4';
    pageContainer.style.cssText = `
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      background-color: #ffffff;
      width: 794px;
      height: 1123px;
      min-height: 1123px;
      max-height: 1123px;
      padding: 34px 44px 30px 44px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    `;

    // Bagian Atas Halaman
    let topHeaderHtml = '';
    if (idx === 0) {
      topHeaderHtml = `
        ${renderKopHtml(exam)}
        ${renderJudulHtml(exam)}
        ${renderIdentitasHtml(exam)}
        ${renderPetunjukHtml(exam)}
      `;
    } else {
      topHeaderHtml = renderRunningHeader(exam);
    }

    // Bagian Badan Soal
    let bodyContentHtml = '';
    if (is2Kolom) {
      bodyContentHtml = `
        <div style="display: flex; justify-content: space-between; width: 100%; flex: 1;">
          <div style="width: 340px; box-sizing: border-box;">
            ${pageData.left.join('')}
          </div>
          <div style="width: 1px; background-color: #ccc; align-self: stretch; margin: 0 4px;"></div>
          <div style="width: 340px; box-sizing: border-box;">
            ${pageData.right.join('')}
          </div>
        </div>
      `;
    } else {
      bodyContentHtml = `
        <div style="width: 704px; box-sizing: border-box; flex: 1;">
          ${pageData.left.join('')}
        </div>
      `;
    }

    const footerHtml = renderPageFooter(docTitle, idx + 1, totalPages);

    pageContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
        ${topHeaderHtml}
        ${bodyContentHtml}
      </div>
      ${footerHtml}
    `;

    return pageContainer;
  });
}

/**
 * Buat elemen HTML lengkap untuk Naskah Soal (kompatibel ke belakang)
 */
export function buildNaskahHtml(
  exam: ExamIdentity,
  questions: Question[],
  layout: '2kolom' | '1kolom' = '2kolom'
): HTMLElement {
  const pages = buildNaskahPages(exam, questions, layout);
  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-document-wrapper';
  pages.forEach(p => wrapper.appendChild(p));
  return wrapper;
}

/**
 * Membangun halaman Kisi-Kisi Penulisan Soal (A4 Landscape) terpaginasi rapi
 */
export function buildKisiKisiPages(exam: ExamIdentity, questions: Question[]): HTMLElement[] {
  const rowsPerPageFirst = 12;
  const rowsPerPageNext = 14;

  const chunks: Question[][] = [];
  let currentIndex = 0;

  if (questions.length <= rowsPerPageFirst) {
    chunks.push(questions);
  } else {
    chunks.push(questions.slice(0, rowsPerPageFirst));
    currentIndex = rowsPerPageFirst;
    while (currentIndex < questions.length) {
      chunks.push(questions.slice(currentIndex, currentIndex + rowsPerPageNext));
      currentIndex += rowsPerPageNext;
    }
  }

  const totalPages = Math.max(1, chunks.length);
  const docTitle = `Kisi-Kisi Penulisan Soal - ${exam.mataPelajaran || 'Ujian'} ${exam.kelas ? `| Kelas ${exam.kelas}` : ''}`;

  return chunks.map((chunkQuestions, pageIdx) => {
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pdf-page-a4 pdf-page-landscape';
    pageContainer.style.cssText = `
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      background-color: #ffffff;
      width: 1060px;
      height: 794px;
      min-height: 794px;
      max-height: 794px;
      padding: 28px 38px 24px 38px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    `;

    const startNum = pageIdx === 0 ? 1 : rowsPerPageFirst + (pageIdx - 1) * rowsPerPageNext + 1;

    const rowsHtml = chunkQuestions.map((q, idx) => {
      const noUrut = startNum + idx;
      const bentuk = q.jenisSoal === 'PG' ? 'Pilihan Ganda' : (q.jenisSoal === 'ISIAN' ? 'Isian Singkat' : 'Esai');
      return `
        <tr style="page-break-inside: avoid; break-inside: avoid;">
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${noUrut}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${noUrut}</td>
          <td style="border: 1px solid #000; padding: 4px;">${exam.mataPelajaran || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${exam.kelas || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${q.materi || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${q.tujuanPembelajaran || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${q.indikatorSoal || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${q.levelKognitif || 'C1'}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${bentuk}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${q.bobotNilai || 1}</td>
        </tr>
      `;
    }).join('');

    let headerHtml = '';
    if (pageIdx === 0) {
      headerHtml = `
        <div style="text-align: center; margin-bottom: 9px;">
          <div style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase;">
            KISI-KISI PENULISAN SOAL UJIAN
          </div>
          <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase;">
            ${exam.namaSekolah || 'SD NEGERI KEDUNG DALAM 1'}
          </div>
          <div style="font-size: 9pt; margin-top: 2px;">
            Mata Pelajaran: <b>${exam.mataPelajaran || '-'}</b> &nbsp;|&nbsp; 
            Kelas: <b>${exam.kelas || '-'}</b> &nbsp;|&nbsp; 
            Tahun Ajaran: <b>${exam.tahunAjaran || '-'}</b> &nbsp;|&nbsp; 
            Ujian: <b>${exam.namaUjian || '-'}</b>
          </div>
        </div>
      `;
    } else {
      headerHtml = `
        <div style="display: flex; justify-content: space-between; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 8px; font-size: 8.5pt; font-weight: bold;">
          <span>KISI-KISI SOAL: ${exam.namaUjian || 'UJIAN'} - ${exam.mataPelajaran || ''}</span>
          <span>KELAS: ${exam.kelas || ''}</span>
        </div>
      `;
    }

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #000; padding: 4.5px; width: 4%; text-align: center;">No.</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 5%; text-align: center;">No. Soal</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 11%; text-align: center;">Mata Pelajaran</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 6%; text-align: center;">Kelas</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 14%; text-align: center;">Materi</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 16%; text-align: center;">Tujuan Pembelajaran</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 21%; text-align: center;">Indikator Soal</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 6%; text-align: center;">Level</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 10%; text-align: center;">Bentuk</th>
            <th style="border: 1px solid #000; padding: 4.5px; width: 7%; text-align: center;">Bobot</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    const footerHtml = renderPageFooter(docTitle, pageIdx + 1, totalPages);

    pageContainer.innerHTML = `
      <div style="flex: 1; overflow: hidden;">
        ${headerHtml}
        ${tableHtml}
      </div>
      ${footerHtml}
    `;

    return pageContainer;
  });
}

/**
 * Buat elemen HTML lengkap untuk Kisi-Kisi Soal (A4 Landscape)
 */
export function buildKisiKisiHtml(exam: ExamIdentity, questions: Question[]): HTMLElement {
  const pages = buildKisiKisiPages(exam, questions);
  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-document-wrapper';
  pages.forEach(p => wrapper.appendChild(p));
  return wrapper;
}

/**
 * Membangun halaman Kunci Jawaban & Pedoman Penskoran (A4 Portrait) terpaginasi rapi
 */
export function buildKunciPages(exam: ExamIdentity, questions: Question[]): HTMLElement[] {
  const pgList = questions.filter(q => q.jenisSoal === 'PG');
  const isianList = questions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = questions.filter(q => q.jenisSoal === 'ESAI');

  let currentNo = 1;
  const pgRows = pgList.map(q => `
    <tr>
      <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">${currentNo++}</td>
      <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; font-weight: bold; font-size: 10.5pt;">${q.kunciJawaban || '-'}</td>
      <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">${q.bobotNilai || 1}</td>
    </tr>
  `).join('');

  const isianRows = isianList.map(q => `
    <tr>
      <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">${currentNo++}</td>
      <td style="border: 1px solid #000; padding: 3px 6px;">${q.kunciJawaban || '-'}</td>
      <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">${q.bobotNilai || 2}</td>
    </tr>
  `).join('');

  const esaiRows = esaiList.map(q => `
    <tr>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; vertical-align: top;">${currentNo++}</td>
      <td style="border: 1px solid #000; padding: 4px 6px; vertical-align: top; text-align: justify;">${q.kunciJawaban || '-'}</td>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; vertical-align: top;">${q.bobotNilai || 5}</td>
    </tr>
  `).join('');

  const totalBobot = questions.reduce((sum, q) => sum + (Number(q.bobotNilai) || 0), 0);

  // Jika jumlah soal sedikit, gabungkan ke 1 halaman. Jika panjang (esai banyak), pecah esai ke halaman 2.
  const needSecondPage = (pgList.length + isianList.length > 18) || (esaiList.length > 4);
  const totalPages = needSecondPage ? 2 : 1;
  const docTitle = `Kunci Jawaban & Rubrik - ${exam.mataPelajaran || 'Ujian'} ${exam.kelas ? `| Kelas ${exam.kelas}` : ''}`;

  const pages: HTMLElement[] = [];

  // Halaman 1
  const page1 = document.createElement('div');
  page1.className = 'pdf-page-a4';
  page1.style.cssText = `
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    background-color: #ffffff;
    width: 794px;
    height: 1123px;
    min-height: 1123px;
    max-height: 1123px;
    padding: 34px 44px 30px 44px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  `;

  const headerHtml1 = `
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">
        KUNCI JAWABAN & PEDOMAN PENSKORAN
      </div>
      <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase;">
        ${exam.namaSekolah || 'SD NEGERI KEDUNG DALAM 1'}
      </div>
      <div style="font-size: 9pt; margin-top: 2px;">
        Mata Pelajaran: <b>${exam.mataPelajaran || '-'}</b> &nbsp;|&nbsp; 
        Kelas: <b>${exam.kelas || '-'}</b> &nbsp;|&nbsp; 
        Tahun Ajaran: <b>${exam.tahunAjaran || '-'}</b>
      </div>
      <div style="font-size: 8.5pt; color: #333; margin-top: 1px;">
        Total Nilai Maksimal: <b>${totalBobot}</b>
      </div>
    </div>
  `;

  const pgTableHtml = pgList.length > 0 ? `
    <div style="margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 3px;">I. PILIHAN GANDA</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #000; padding: 4px; width: 12%; text-align: center;">No.</th>
            <th style="border: 1px solid #000; padding: 4px; width: 60%; text-align: center;">Kunci Jawaban</th>
            <th style="border: 1px solid #000; padding: 4px; width: 28%; text-align: center;">Bobot Nilai</th>
          </tr>
        </thead>
        <tbody>${pgRows}</tbody>
      </table>
    </div>
  ` : '';

  const isianTableHtml = isianList.length > 0 ? `
    <div style="margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 3px;">II. ISIAN SINGKAT</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #000; padding: 4px; width: 12%; text-align: center;">No.</th>
            <th style="border: 1px solid #000; padding: 4px; width: 68%; text-align: center;">Kunci Jawaban</th>
            <th style="border: 1px solid #000; padding: 4px; width: 20%; text-align: center;">Bobot Nilai</th>
          </tr>
        </thead>
        <tbody>${isianRows}</tbody>
      </table>
    </div>
  ` : '';

  const esaiTableHtml = esaiList.length > 0 ? `
    <div style="margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 3px;">III. ESAI / URAIAN (RUBRIK PENSKORAN)</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #000; padding: 4px; width: 10%; text-align: center;">No.</th>
            <th style="border: 1px solid #000; padding: 4px; width: 75%; text-align: center;">Pedoman Jawaban / Rubrik Penilaian</th>
            <th style="border: 1px solid #000; padding: 4px; width: 15%; text-align: center;">Bobot Nilai</th>
          </tr>
        </thead>
        <tbody>${esaiRows}</tbody>
      </table>
    </div>
  ` : '';

  if (!needSecondPage) {
    page1.innerHTML = `
      <div style="flex: 1; overflow: hidden;">
        ${headerHtml1}
        ${pgTableHtml}
        ${isianTableHtml}
        ${esaiTableHtml}
      </div>
      ${renderPageFooter(docTitle, 1, 1)}
    `;
    pages.push(page1);
  } else {
    page1.innerHTML = `
      <div style="flex: 1; overflow: hidden;">
        ${headerHtml1}
        ${pgTableHtml}
        ${isianTableHtml}
      </div>
      ${renderPageFooter(docTitle, 1, 2)}
    `;
    pages.push(page1);

    // Halaman 2 untuk Esai / Rubrik
    const page2 = document.createElement('div');
    page2.className = 'pdf-page-a4';
    page2.style.cssText = `
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      background-color: #ffffff;
      width: 794px;
      height: 1123px;
      min-height: 1123px;
      max-height: 1123px;
      padding: 34px 44px 30px 44px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    `;

    const headerHtml2 = `
      <div style="display: flex; justify-content: space-between; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 10px; font-size: 8.5pt; font-weight: bold;">
        <span>KUNCI JAWABAN & RUBRIK: ${exam.namaUjian || 'UJIAN'} - ${exam.mataPelajaran || ''}</span>
        <span>KELAS: ${exam.kelas || ''}</span>
      </div>
    `;

    page2.innerHTML = `
      <div style="flex: 1; overflow: hidden;">
        ${headerHtml2}
        ${esaiTableHtml}
      </div>
      ${renderPageFooter(docTitle, 2, 2)}
    `;
    pages.push(page2);
  }

  return pages;
}

/**
 * Buat elemen HTML lengkap untuk Kunci Jawaban & Rubrik Penskoran
 */
export function buildKunciHtml(exam: ExamIdentity, questions: Question[]): HTMLElement {
  const pages = buildKunciPages(exam, questions);
  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-document-wrapper';
  pages.forEach(p => wrapper.appendChild(p));
  return wrapper;
}

/**
 * Render elemen halaman A4 menjadi dokumen PDF presisi tinggi (1 halaman per canvas)
 * Tidak ada pembagian kanvas buta, menjamin garis tepi bawah tidak terpotong.
 */
async function exportPagesToPdf(
  pages: HTMLElement[],
  fileName: string,
  orientation: 'portrait' | 'landscape'
): Promise<void> {
  const isLandscape = orientation === 'landscape';
  const pdfWidthMm = isLandscape ? 297 : 210;
  const pdfHeightMm = isLandscape ? 210 : 297;
  const viewportWidth = isLandscape ? 1060 : 794;

  // Siapkan iframe terisolasi
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = `${viewportWidth}px`;
  iframe.style.height = `${isLandscape ? 800 : 1130}px`;
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Gagal menyiapkan lingkungan render PDF terisolasi.');
    }

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        color: #000000;
        font-family: 'Times New Roman', Times, serif;
      }
      img {
        max-width: 100%;
      }
      .pdf-page-a4 {
        box-sizing: border-box;
        background-color: #ffffff;
        color: #000000;
        font-family: 'Times New Roman', Times, serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
      }
    </style>
  </head>
  <body></body>
</html>`);
    iframeDoc.close();

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      iframeDoc.body.innerHTML = '';
      iframeDoc.body.appendChild(pageEl);

      // Tunggu seluruh aset gambar pada halaman selesai dimuat
      const images = Array.from(iframeDoc.images);
      if (images.length > 0) {
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>(resolve => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });
          })
        );
      }

      // Jeda sejenak untuk penataan letak teks & font
      await new Promise(r => setTimeout(r, 60));

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: viewportWidth,
      });

      if (i > 0) {
        pdf.addPage([pdfWidthMm, pdfHeightMm], orientation);
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
    }

    pdf.save(fileName);
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Ekspor Naskah Soal ke PDF (.pdf) A4 Portrait dengan paginasi bersih
 */
export async function exportNaskahSoalPdf(
  exam: ExamIdentity,
  questions: Question[],
  layout: '2kolom' | '1kolom' = '2kolom'
): Promise<void> {
  const pages = buildNaskahPages(exam, questions, layout);
  const fileName = getCleanFileName(exam, layout === '2kolom' ? 'Naskah_Soal_2Kolom' : 'Naskah_Soal_1Kolom');
  await exportPagesToPdf(pages, fileName, 'portrait');
}

/**
 * Ekspor Kisi-Kisi Soal ke PDF (.pdf) A4 Landscape dengan tabel rapi
 */
export async function exportKisiKisiPdf(exam: ExamIdentity, questions: Question[]): Promise<void> {
  const pages = buildKisiKisiPages(exam, questions);
  const fileName = getCleanFileName(exam, 'Kisi_Kisi_Soal');
  await exportPagesToPdf(pages, fileName, 'landscape');
}

/**
 * Ekspor Kunci Jawaban ke PDF (.pdf) A4 Portrait
 */
export async function exportKunciJawabanPdf(exam: ExamIdentity, questions: Question[]): Promise<void> {
  const pages = buildKunciPages(exam, questions);
  const fileName = getCleanFileName(exam, 'Kunci_Jawaban_Rubrik');
  await exportPagesToPdf(pages, fileName, 'portrait');
}

/**
 * Buka Jendela Cetak Bersih / Print-to-PDF Langsung (Native High-Resolution Print)
 */
export function openPrintDirect(
  type: 'naskah' | 'kisi' | 'kunci',
  exam: ExamIdentity,
  questions: Question[],
  layout: '2kolom' | '1kolom' = '2kolom'
): void {
  let pages: HTMLElement[] = [];
  let title = 'Dokumen Ujian';
  let isLandscape = false;

  if (type === 'naskah') {
    pages = buildNaskahPages(exam, questions, layout);
    title = `Naskah Soal - ${exam.mataPelajaran || 'Ujian'}`;
  } else if (type === 'kisi') {
    pages = buildKisiKisiPages(exam, questions);
    title = `Kisi-Kisi - ${exam.mataPelajaran || 'Ujian'}`;
    isLandscape = true;
  } else {
    pages = buildKunciPages(exam, questions);
    title = `Kunci Jawaban - ${exam.mataPelajaran || 'Ujian'}`;
  }

  const pagesHtml = pages.map(p => p.outerHTML).join('\n');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: 'Times New Roman', Times, serif;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pdf-page-a4 {
            width: ${isLandscape ? '297mm' : '210mm'};
            height: ${isLandscape ? '210mm' : '297mm'};
            min-height: ${isLandscape ? '210mm' : '297mm'};
            max-height: ${isLandscape ? '210mm' : '297mm'};
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>
  `;

  // Coba buka jendela cetak baru
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 350);
    };
    return;
  }

  // Fallback: Jika pop-up diblokir (misal di dalam iframe sandbox), gunakan iframe cetak internal
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = 'none';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
    setTimeout(() => {
      try {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      } catch (e) {
        console.error('Gagal mencetak via iframe fallback:', e);
      } finally {
        setTimeout(() => {
          if (printIframe.parentNode) {
            printIframe.parentNode.removeChild(printIframe);
          }
        }, 3000);
      }
    }, 400);
  }
}
