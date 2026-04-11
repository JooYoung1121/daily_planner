import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

interface NoteItem {
  id: string;
  content: string;
}

/**
 * Custom page - user-created memo/note page.
 * Each custom page stores its notes in settingsStore.customPages[].notes via localStorage.
 */
export function CustomPage() {
  const { id } = useParams<{ id: string }>();
  const customPages = useSettingsStore((s) => s.customPages);
  const updateCustomPage = useSettingsStore((s) => s.updateCustomPage);

  const page = customPages.find((p) => p.id === id);

  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  if (!page) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // Store notes as JSON string in page content field (hack but simple)
  const notes: NoteItem[] = (() => {
    try {
      return JSON.parse((page as unknown as { notes?: string }).notes ?? '[]');
    } catch {
      return [];
    }
  })();

  const saveNotes = (updated: NoteItem[]) => {
    updateCustomPage(page.id, { notes: JSON.stringify(updated) } as never);
  };

  const handleAdd = () => {
    if (!newNote.trim()) return;
    saveNotes([...notes, { id: crypto.randomUUID(), content: newNote.trim() }]);
    setNewNote('');
  };

  const handleDelete = (noteId: string) => {
    saveNotes(notes.filter((n) => n.id !== noteId));
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || !editingId) return;
    saveNotes(notes.map((n) => (n.id === editingId ? { ...n, content: editContent.trim() } : n)));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{page.label}</h1>

      {/* Add note */}
      <div className="flex gap-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
          placeholder="메모를 입력하세요... (Shift+Enter로 줄바꿈)"
          rows={2}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <button onClick={handleAdd} className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus size={16} />
        </button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">아직 메모가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-lg border border-border bg-card px-4 py-3">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button onClick={handleSaveEdit} className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"><Check size={12} /></button>
                    <button onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-1 text-xs"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <pre className="flex-1 text-sm text-foreground whitespace-pre-wrap font-sans">{note.content}</pre>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                    <button onClick={() => { setEditingId(note.id); setEditContent(note.content); }} className="rounded p-1 text-muted-foreground hover:bg-accent"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(note.id)} className="rounded p-1 text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
