import { ExamDraft } from '../types';

export interface CloudUser { userId: string; username: string; displayName: string; role: 'admin' | 'teacher'; active: boolean; }
export interface CloudSession { token: string; user: CloudUser; }
export const CLOUD_API_URL = '/api/apps-script';

async function request<T>(action: string, payload: Record<string, unknown> = {}, token?: string): Promise<T> {
  const response = await fetch(CLOUD_API_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, ...payload }),
  });
  const result = await response.json() as T & { ok?: boolean; error?: string };
  if (!response.ok || result.ok === false) throw new Error(result.error || `Server mengembalikan status ${response.status}.`);
  return result;
}
export const cloudLogin = (username: string, password: string) => request<CloudSession & { drafts: ExamDraft[] }>('login', { username, password });
export const cloudLogout = (token: string) => request<void>('logout', {}, token);
export const cloudListDrafts = async (token: string) => (await request<{ drafts: ExamDraft[] }>('listDrafts', {}, token)).drafts;
export const cloudSaveDraft = (token: string, draft: ExamDraft) => request<void>('saveDraft', { draft }, token);
export const cloudDeleteDraft = (token: string, examId: string) => request<void>('deleteDraft', { examId }, token);
export const cloudListUsers = async (token: string) => (await request<{ users: CloudUser[] }>('listUsers', {}, token)).users;
export const cloudCreateUser = async (token: string, payload: { username: string; displayName: string; password: string }) => (await request<{ user: CloudUser }>('createUser', payload, token)).user;
export const cloudUpdateUser = async (token: string, payload: { userId: string; active?: boolean; displayName?: string; password?: string }) => (await request<{ user: CloudUser }>('updateUser', payload, token)).user;
export const cloudDeleteUser = (token: string, userId: string) => request<void>('deleteUser', { userId }, token);
