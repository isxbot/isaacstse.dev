import { getCollection } from 'astro:content';

export async function getNotes() {
  const notes = await getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft);
  return notes.sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
