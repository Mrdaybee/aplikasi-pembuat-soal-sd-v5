import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  PageOrientation,
  SectionType
} from 'docx';
import { ExamIdentity, Question } from '../types';

/**
 * Utilitas untuk mengunduh Blob sebagai file di browser
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Konversi URL, SVG, atau Base64 Image menjadi Uint8Array untuk docx.ImageRun
 */
async function urlOrBase64ToUint8Array(input: string): Promise<Uint8Array | null> {
  try {
    if (!input || !input.trim()) return null;

    // Jika format SVG, rasterisasi ke PNG melalui canvas
    if (input.includes('image/svg+xml') || input.trim().startsWith('<svg')) {
      return await new Promise<Uint8Array | null>((resolve) => {
        const img = new Image();
        const svgUrl = input.trim().startsWith('<svg') 
          ? `data:image/svg+xml;utf8,${encodeURIComponent(input)}` 
          : input;

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 360;
            canvas.height = img.naturalHeight || 180;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const pngData = canvas.toDataURL('image/png');
              const base64Data = pngData.split(',')[1];
              const bin = atob(base64Data);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) {
                arr[i] = bin.charCodeAt(i);
              }
              resolve(arr);
              return;
            }
          } catch {
            // fallback
          }
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = svgUrl;
      });
    }

    if (input.startsWith('data:')) {
      const parts = input.split(',');
      if (parts.length < 2) return null;
      const base64Data = parts[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } else if (input.startsWith('http://') || input.startsWith('https://')) {
      const res = await fetch(input);
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    }
  } catch (err) {
    console.warn('Gagal memuat gambar untuk docx:', err);
  }
  return null;
}

/**
 * 1. EKSPOR NASKAH SOAL (.docx) DENGAN FORMAT 2 KOLOM ATAU 1 KOLOM
 */
export async function exportNaskahSoalDocx(
  exam: ExamIdentity,
  questions: Question[],
  layout: '2kolom' | '1kolom' = '2kolom'
) {
  const cleanSchool = (exam.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const cleanUjian = (exam.namaUjian || 'Ujian').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const suffix = layout === '2kolom' ? '2 Kolom' : '1 Kolom';
  const fileName = `${cleanSchool} - ${cleanUjian} - Naskah Soal (${suffix}).docx`;

  const pgList = questions.filter(q => q.jenisSoal === 'PG');
  const isianList = questions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = questions.filter(q => q.jenisSoal === 'ESAI');

  let currentNo = 1;
  const pgNumbered = pgList.map(q => ({ ...q, noTampil: currentNo++ }));
  const isianNumbered = isianList.map(q => ({ ...q, noTampil: currentNo++ }));
  const esaiNumbered = esaiList.map(q => ({ ...q, noTampil: currentNo++ }));

  // Muat logo jika ada
  let logoKiriBytes: Uint8Array | null = null;
  let logoKananBytes: Uint8Array | null = null;
  if (exam.logoKiriUrl) {
    logoKiriBytes = await urlOrBase64ToUint8Array(exam.logoKiriUrl);
  }
  if (exam.logoKananUrl) {
    logoKananBytes = await urlOrBase64ToUint8Array(exam.logoKananUrl);
  }

  // Bangun Tabel Kop Surat (3 Kolom: Logo Kiri, Teks Instansi/Sekolah Tengah, Logo Kanan)
  const kopRowCells: TableCell[] = [];

  // Sel Logo Kiri
  kopRowCells.push(
    new TableCell({
      width: { size: 14, type: WidthType.PERCENTAGE },
      verticalAlign: AlignmentType.CENTER,
      children: logoKiriBytes
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoKiriBytes,
                  transformation: { width: 62, height: 62 },
                } as any),
              ],
            }),
          ]
        : [new Paragraph({ children: [] })],
    })
  );

  // Sel Teks Kop Tengah
  kopRowCells.push(
    new TableCell({
      width: { size: 72, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [
            new TextRun({
              text: (exam.namaInstansi || 'PEMERINTAH KABUPATEN TANGERANG\nDINAS PENDIDIKAN').toUpperCase(),
              font: 'Times New Roman',
              size: 23, // 11.5pt
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [
            new TextRun({
              text: (exam.namaSekolah || 'SD NEGERI KEDUNG DALAM 1').toUpperCase(),
              font: 'Times New Roman',
              size: 28, // 14pt
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({
              text: 'Alamat: Jl. Raya Mauk KM. 21, Kedung Dalam, Kec. Mauk, Kab. Tangerang, Banten',
              font: 'Times New Roman',
              size: 18, // 9pt
              italics: true,
            }),
          ],
        }),
      ],
    })
  );

  // Sel Logo Kanan
  kopRowCells.push(
    new TableCell({
      width: { size: 14, type: WidthType.PERCENTAGE },
      verticalAlign: AlignmentType.CENTER,
      children: logoKananBytes
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoKananBytes,
                  transformation: { width: 62, height: 62 },
                } as any),
              ],
            }),
          ]
        : [new Paragraph({ children: [] })],
    })
  );

  const tableKop = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [new TableRow({ children: kopRowCells })],
  });

  // Garis Pembatas Kop Surat Resmi (Garis Ganda Tebal-Tipis)
  const garisKop = new Paragraph({
    spacing: { before: 40, after: 100 },
    border: {
      bottom: {
        style: BorderStyle.DOUBLE,
        size: 18,
        space: 2,
        color: '000000',
      },
    },
    children: [],
  });

  // Judul Naskah Ujian
  const judulParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 30 },
      children: [
        new TextRun({
          text: (exam.namaUjian || 'PENILAIAN SUMATIF AKHIR SEMESTER (SAS)').toUpperCase(),
          font: 'Times New Roman',
          size: 25, // 12.5pt
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [
        new TextRun({
          text: `TAHUN AJARAN ${exam.tahunAjaran || '2025/2026'}`,
          font: 'Times New Roman',
          size: 21, // 10.5pt
          bold: true,
        }),
      ],
    }),
  ];

  // Tabel Identitas Siswa (Kotak Bersih dengan Border Rapi)
  const tableIdentitas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({ text: 'Mata Pelajaran : ', font: 'Times New Roman', size: 21, bold: true }),
                  new TextRun({ text: exam.mataPelajaran || '-', font: 'Times New Roman', size: 21 }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: 'Kelas         : ', font: 'Times New Roman', size: 21, bold: true }),
                  new TextRun({ text: exam.kelas || '-', font: 'Times New Roman', size: 21 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({ text: 'Hari / Tanggal : ', font: 'Times New Roman', size: 21, bold: true }),
                  new TextRun({ text: exam.hariTanggal || '-', font: 'Times New Roman', size: 21 }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: 'Nama Siswa    : ', font: 'Times New Roman', size: 21, bold: true }),
                  new TextRun({ text: exam.namaSiswa || '...........................................', font: 'Times New Roman', size: 21 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Petunjuk Pengerjaan
  const petunjukParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 100, after: 30 },
      children: [
        new TextRun({
          text: 'PETUNJUK PENGERJAAN:',
          font: 'Times New Roman',
          size: 21,
          bold: true,
        }),
      ],
    }),
  ];

  const petunjukLines = (exam.petunjukPengerjaan || '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa kelengkapan lembar soal sebelum menjawab.\n3. Kerjakan terlebih dahulu soal yang dianggap mudah.')
    .split('\n')
    .filter(l => l.trim().length > 0);

  petunjukLines.forEach(line => {
    petunjukParagraphs.push(
      new Paragraph({
        spacing: { after: 15 },
        indent: { left: 160 },
        children: [
          new TextRun({
            text: line.trim(),
            font: 'Times New Roman',
            size: 20,
          }),
        ],
      })
    );
  });

  // Pemisah Petunjuk ke Soal
  petunjukParagraphs.push(
    new Paragraph({
      spacing: { before: 30, after: 60 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
      },
      children: [],
    })
  );

  // Ukuran gambar yang tepat agar tidak merusak kolom
  const imageMaxW = layout === '2kolom' ? 175 : 270;
  const imageMaxH = layout === '2kolom' ? 115 : 160;

  // Paragraphs Soal
  const questionParagraphs: Paragraph[] = [];

  // 1. BAGIAN PG
  if (pgNumbered.length > 0) {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 30 },
        children: [
          new TextRun({
            text: 'I. PILIHAN GANDA',
            font: 'Times New Roman',
            size: 22,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!',
            font: 'Times New Roman',
            size: 19,
            italics: true,
          }),
        ],
      })
    );

    for (const q of pgNumbered) {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 30 },
          children: [
            new TextRun({
              text: `${q.noTampil}. `,
              font: 'Times New Roman',
              size: 21,
              bold: true,
            }),
            new TextRun({
              text: q.pertanyaan,
              font: 'Times New Roman',
              size: 21,
            }),
          ],
        })
      );

      // Gambar Soal PG jika ada
      if (q.gambarUrl) {
        const imgBytes = await urlOrBase64ToUint8Array(q.gambarUrl);
        if (imgBytes) {
          questionParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: { width: imageMaxW, height: imageMaxH },
                } as any),
              ],
            })
          );
        }
        if (q.gambarKeterangan) {
          questionParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: q.gambarKeterangan,
                  font: 'Times New Roman',
                  size: 17,
                  italics: true,
                }),
              ],
            })
          );
        }
      }

      // Opsi Jawaban
      questionParagraphs.push(
        new Paragraph({
          indent: { left: 220 },
          spacing: { after: 15 },
          children: [new TextRun({ text: `A.  ${q.opsiA || '-'}`, font: 'Times New Roman', size: 21 })],
        }),
        new Paragraph({
          indent: { left: 220 },
          spacing: { after: 15 },
          children: [new TextRun({ text: `B.  ${q.opsiB || '-'}`, font: 'Times New Roman', size: 21 })],
        }),
        new Paragraph({
          indent: { left: 220 },
          spacing: { after: 15 },
          children: [new TextRun({ text: `C.  ${q.opsiC || '-'}`, font: 'Times New Roman', size: 21 })],
        }),
        new Paragraph({
          indent: { left: 220 },
          spacing: { after: 40 },
          children: [new TextRun({ text: `D.  ${q.opsiD || '-'}`, font: 'Times New Roman', size: 21 })],
        })
      );
    }
  }

  // 2. BAGIAN ISIAN
  if (isianNumbered.length > 0) {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 30 },
        children: [
          new TextRun({
            text: 'II. ISIAN SINGKAT',
            font: 'Times New Roman',
            size: 22,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'Isilah titik-titik di bawah ini dengan jawaban yang tepat dan benar!',
            font: 'Times New Roman',
            size: 19,
            italics: true,
          }),
        ],
      })
    );

    for (const q of isianNumbered) {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: `${q.noTampil}. `,
              font: 'Times New Roman',
              size: 21,
              bold: true,
            }),
            new TextRun({
              text: q.pertanyaan,
              font: 'Times New Roman',
              size: 21,
            }),
          ],
        })
      );

      if (q.gambarUrl) {
        const imgBytes = await urlOrBase64ToUint8Array(q.gambarUrl);
        if (imgBytes) {
          questionParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: { width: imageMaxW, height: imageMaxH },
                } as any),
              ],
            })
          );
        }
        if (q.gambarKeterangan) {
          questionParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: q.gambarKeterangan,
                  font: 'Times New Roman',
                  size: 17,
                  italics: true,
                }),
              ],
            })
          );
        }
      }
    }
  }

  // 3. BAGIAN ESAI
  if (esaiNumbered.length > 0) {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 30 },
        children: [
          new TextRun({
            text: 'III. ESAI / URAIAN',
            font: 'Times New Roman',
            size: 22,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'Jawablah pertanyaan-pertanyaan di bawah ini dengan uraian yang jelas dan lengkap!',
            font: 'Times New Roman',
            size: 19,
            italics: true,
          }),
        ],
      })
    );

    for (const q of esaiNumbered) {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: `${q.noTampil}. `,
              font: 'Times New Roman',
              size: 21,
              bold: true,
            }),
            new TextRun({
              text: q.pertanyaan,
              font: 'Times New Roman',
              size: 21,
            }),
          ],
        })
      );

      if (q.gambarUrl) {
        const imgBytes = await urlOrBase64ToUint8Array(q.gambarUrl);
        if (imgBytes) {
          questionParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: { width: imageMaxW, height: imageMaxH },
                } as any),
              ],
            })
          );
        }
        if (q.gambarKeterangan) {
          questionParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: q.gambarKeterangan,
                  font: 'Times New Roman',
                  size: 17,
                  italics: true,
                }),
              ],
            })
          );
        }
      }
    }
  }

  // BENTUK DOKUMEN SESUAI LAYOUT
  let doc: Document;

  if (layout === '2kolom') {
    // 2 Kolom Mengalir Menggunakan SectionType.CONTINUOUS agar TIDAK memicu jeda halaman kosong!
    doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.55),
                right: convertInchesToTwip(0.55),
              },
            },
          },
          children: [
            tableKop,
            garisKop,
            ...judulParagraphs,
            tableIdentitas,
            ...petunjukParagraphs,
          ],
        },
        {
          properties: {
            type: SectionType.CONTINUOUS, // Kunci agar langsung mengalir di halaman yang sama!
            page: {
              margin: {
                top: convertInchesToTwip(0.2),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.55),
                right: convertInchesToTwip(0.55),
              },
            },
            column: {
              count: 2,
              space: 360, // Jarak antar kolom ~0.25 inci
            },
          },
          children: questionParagraphs,
        },
      ],
    });
  } else {
    // 1 Kolom Penuh: Dokumen tunggal yang 100% stabil di semua versi Word & WPS
    doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.65),
                right: convertInchesToTwip(0.65),
              },
            },
          },
          children: [
            tableKop,
            garisKop,
            ...judulParagraphs,
            tableIdentitas,
            ...petunjukParagraphs,
            ...questionParagraphs,
          ],
        },
      ],
    });
  }

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, fileName);
}

/**
 * 2. EKSPOR KISI-KISI SOAL (.docx) DENGAN TABEL RAPI, BORDER SOLID, & LEBAR KOLOM PRESISI
 */
export async function exportKisiKisiDocx(exam: ExamIdentity, questions: Question[]) {
  const cleanSchool = (exam.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const cleanUjian = (exam.namaUjian || 'Ujian').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const fileName = `${cleanSchool} - ${cleanUjian} - Kisi-Kisi.docx`;

  const headerCells = [
    { text: 'No.', width: 4 },
    { text: 'No. Soal', width: 5 },
    { text: 'Mata Pelajaran', width: 11 },
    { text: 'Kelas', width: 6 },
    { text: 'Materi Pokok', width: 14 },
    { text: 'Tujuan Pembelajaran', width: 16 },
    { text: 'Indikator Soal', width: 21 },
    { text: 'Level', width: 6 },
    { text: 'Bentuk', width: 10 },
    { text: 'Bobot', width: 7 },
  ];

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(h => new TableCell({
      width: { size: h.width, type: WidthType.PERCENTAGE },
      shading: { fill: 'F1F5F9' },
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: h.text, font: 'Times New Roman', size: 18, bold: true })],
        }),
      ],
    })),
  });

  const dataRows = questions.map((q, idx) => {
    const bentuk = q.jenisSoal === 'PG' ? 'Pilihan Ganda' : (q.jenisSoal === 'ISIAN' ? 'Isian Singkat' : 'Esai');
    const cellsData = [
      { text: String(idx + 1), align: AlignmentType.CENTER, width: 4, bold: false },
      { text: String(idx + 1), align: AlignmentType.CENTER, width: 5, bold: true },
      { text: exam.mataPelajaran || '-', align: AlignmentType.LEFT, width: 11, bold: false },
      { text: exam.kelas || '-', align: AlignmentType.CENTER, width: 6, bold: false },
      { text: q.materi || '-', align: AlignmentType.LEFT, width: 14, bold: false },
      { text: q.tujuanPembelajaran || '-', align: AlignmentType.LEFT, width: 16, bold: false },
      { text: q.indikatorSoal || '-', align: AlignmentType.LEFT, width: 21, bold: false },
      { text: q.levelKognitif || 'C1', align: AlignmentType.CENTER, width: 6, bold: true },
      { text: bentuk, align: AlignmentType.CENTER, width: 10, bold: false },
      { text: String(q.bobotNilai || 1), align: AlignmentType.CENTER, width: 7, bold: true },
    ];

    return new TableRow({
      children: cellsData.map(c => new TableCell({
        width: { size: c.width, type: WidthType.PERCENTAGE },
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
        children: [
          new Paragraph({
            alignment: c.align,
            children: [new TextRun({ text: c.text, font: 'Times New Roman', size: 17, bold: c.bold })],
          }),
        ],
      })),
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.4),
              bottom: convertInchesToTwip(0.4),
              left: convertInchesToTwip(0.4),
              right: convertInchesToTwip(0.4),
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 20 },
            children: [
              new TextRun({
                text: 'KISI-KISI PENULISAN SOAL UJIAN',
                font: 'Times New Roman',
                size: 26,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: (exam.namaSekolah || 'SD NEGERI KEDUNG DALAM 1').toUpperCase(),
                font: 'Times New Roman',
                size: 22,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Mata Pelajaran: ${exam.mataPelajaran || '-'}  |  Kelas: ${exam.kelas || '-'}  |  Tahun Ajaran: ${exam.tahunAjaran || '-'}  |  Ujian: ${exam.namaUjian || '-'}`,
                font: 'Times New Roman',
                size: 19,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, fileName);
}

/**
 * 3. EKSPOR KUNCI JAWABAN & RUBRIK PENSKORAN (.docx) DENGAN TABEL SOLID
 */
export async function exportKunciJawabanDocx(exam: ExamIdentity, questions: Question[]) {
  const cleanSchool = (exam.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const cleanUjian = (exam.namaUjian || 'Ujian').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const fileName = `${cleanSchool} - ${cleanUjian} - Kunci Jawaban.docx`;

  const pgList = questions.filter(q => q.jenisSoal === 'PG');
  const isianList = questions.filter(q => q.jenisSoal === 'ISIAN');
  const esaiList = questions.filter(q => q.jenisSoal === 'ESAI');

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const totalBobot = questions.reduce((sum, q) => sum + (Number(q.bobotNilai) || 0), 0);

  const contentParagraphs: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 20 },
      children: [
        new TextRun({
          text: 'KUNCI JAWABAN & PEDOMAN PENSKORAN',
          font: 'Times New Roman',
          size: 26,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: (exam.namaSekolah || 'SD NEGERI KEDUNG DALAM 1').toUpperCase(),
          font: 'Times New Roman',
          size: 22,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `Mata Pelajaran: ${exam.mataPelajaran || '-'}  |  Kelas: ${exam.kelas || '-'}  |  Tahun Ajaran: ${exam.tahunAjaran || '-'}  |  Total Bobot: ${totalBobot}`,
          font: 'Times New Roman',
          size: 19,
        }),
      ],
    }),
  ];

  let currentNo = 1;

  // I. Pilihan Ganda
  if (pgList.length > 0) {
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: 'I. PILIHAN GANDA', font: 'Times New Roman', size: 21, bold: true })],
      })
    );

    const rowsPG = [
      new TableRow({
        tableHeader: true,
        children: [
          { text: 'No.', width: 12 },
          { text: 'Kunci Jawaban', width: 63 },
          { text: 'Bobot Nilai', width: 25 },
        ].map(h => new TableCell({
          width: { size: h.width, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          margins: { top: 50, bottom: 50, left: 60, right: 60 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h.text, font: 'Times New Roman', size: 19, bold: true })] })],
        })),
      }),
      ...pgList.map(q => new TableRow({
        children: [
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(currentNo++), font: 'Times New Roman', size: 19 })] })],
          }),
          new TableCell({
            width: { size: 63, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: q.kunciJawaban || '-', font: 'Times New Roman', size: 19, bold: true })] })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(q.bobotNilai || 1), font: 'Times New Roman', size: 19 })] })],
          }),
        ],
      })),
    ];

    contentParagraphs.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorder, rows: rowsPG }));
  }

  // II. Isian Singkat
  if (isianList.length > 0) {
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [new TextRun({ text: 'II. ISIAN SINGKAT', font: 'Times New Roman', size: 21, bold: true })],
      })
    );

    const rowsIsian = [
      new TableRow({
        tableHeader: true,
        children: [
          { text: 'No.', width: 12 },
          { text: 'Kunci Jawaban', width: 68 },
          { text: 'Bobot Nilai', width: 20 },
        ].map(h => new TableCell({
          width: { size: h.width, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          margins: { top: 50, bottom: 50, left: 60, right: 60 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h.text, font: 'Times New Roman', size: 19, bold: true })] })],
        })),
      }),
      ...isianList.map(q => new TableRow({
        children: [
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(currentNo++), font: 'Times New Roman', size: 19 })] })],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 80, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: q.kunciJawaban || '-', font: 'Times New Roman', size: 19 })] })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(q.bobotNilai || 2), font: 'Times New Roman', size: 19 })] })],
          }),
        ],
      })),
    ];

    contentParagraphs.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorder, rows: rowsIsian }));
  }

  // III. Esai
  if (esaiList.length > 0) {
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [new TextRun({ text: 'III. ESAI / URAIAN (RUBRIK PENSKORAN)', font: 'Times New Roman', size: 21, bold: true })],
      })
    );

    const rowsEsai = [
      new TableRow({
        tableHeader: true,
        children: [
          { text: 'No.', width: 10 },
          { text: 'Pedoman Jawaban / Rubrik Penilaian', width: 75 },
          { text: 'Bobot Nilai', width: 15 },
        ].map(h => new TableCell({
          width: { size: h.width, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          margins: { top: 50, bottom: 50, left: 60, right: 60 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h.text, font: 'Times New Roman', size: 19, bold: true })] })],
        })),
      }),
      ...esaiList.map(q => new TableRow({
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(currentNo++), font: 'Times New Roman', size: 19 })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 80, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: q.kunciJawaban || '-', font: 'Times New Roman', size: 19 })] })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            margins: { top: 35, bottom: 35, left: 50, right: 50 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(q.bobotNilai || 5), font: 'Times New Roman', size: 19 })] })],
          }),
        ],
      })),
    ];

    contentParagraphs.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorder, rows: rowsEsai }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
            },
          },
        },
        children: contentParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, fileName);
}
