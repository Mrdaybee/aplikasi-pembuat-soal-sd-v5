import { ExamIdentity } from '../types';

/** Supports older drafts where institution and agency were stored on separate lines. */
export function getAgencyNames(identity: Pick<ExamIdentity, 'namaInstansi' | 'namaLembaga'>) {
  const lines = (identity.namaInstansi || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return {
    namaInstansi: lines[0] || 'PEMERINTAH KABUPATEN TANGERANG',
    namaLembaga: identity.namaLembaga || lines[1] || 'DINAS PENDIDIKAN',
  };
}
