import React, { useState, useMemo, useEffect } from 'react';
import { WebNote, INITIAL_WEB_NOTES } from '../../types/notepad';
import { NoteModal } from './NoteModal';
import { DeleteNoteDialog } from './DeleteNoteDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebNotepadScreen: React.FC = () => {
  const [notes, setNotes] = useState<WebNote[]>(INITIAL_WEB_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WebNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<WebNote | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH FROM SUPABASE IF CONFIGURED
  const fetchNotesFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('notes').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebNote[] = data.map((item: any, idx: number) => ({
          id: item.id || `NOTE-${100 + idx}`,
          title: item.title || 'Untitled Note',
          content: item.content || '',
          isUrgent: item.is_urgent || false,
          isPinned: item.is_pinned || false,
          createdAt: item.created_at || 'Recent'
        }));
        setNotes(mapped);
      }
    } catch (e) {
      console.log('Supabase notes read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesFromSupabase();
  }, []);

  // REAL-TIME SEARCH (TITLES AND CONTENT)
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  // SECTIONS: PINNED & UNPINNED
  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  // HANDLERS
  const handleAddNoteClick = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNoteClick = (note: WebNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNoteClick = (note: WebNote) => {
    setDeletingNote(note);
  };

  const handleTogglePin = async (note: WebNote) => {
    const updatedStatus = !note.isPinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, isPinned: updatedStatus } : n))
    );
    showToast(updatedStatus ? `Note "${note.title}" pinned to top.` : `Note "${note.title}" unpinned.`);

    try {
      await supabase.from('notes').update({ is_pinned: updatedStatus }).eq('id', note.id);
    } catch (e) {
      console.log('Supabase update warning', e);
    }
  };

  const handleToggleUrgent = async (note: WebNote) => {
    const updatedStatus = !note.isUrgent;
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, isUrgent: updatedStatus } : n))
    );
    showToast(updatedStatus ? `Note "${note.title}" marked as Urgent!` : `Note "${note.title}" marked Normal.`);

    try {
      await supabase.from('notes').update({ is_urgent: updatedStatus }).eq('id', note.id);
    } catch (e) {
      console.log('Supabase update warning', e);
    }
  };

  const handleSaveNote = async (
    title: string,
    content: string,
    isUrgent: boolean,
    isPinned: boolean
  ) => {
    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id ? { ...n, title, content, isUrgent, isPinned } : n
        )
      );

      try {
        await supabase
          .from('notes')
          .update({ title, content, is_urgent: isUrgent, is_pinned: isPinned })
          .eq('id', editingNote.id);
      } catch (e) {
        console.log('Supabase update warning', e);
      }

      showToast(`Note "${title}" saved.`);
    } else {
      const nextId = `NOTE-${100 + notes.length + 1}`;
      const newN: WebNote = {
        id: nextId,
        title,
        content,
        isUrgent,
        isPinned,
        createdAt: 'Just now'
      };
      setNotes((prev) => [newN, ...prev]);

      try {
        await supabase.from('notes').insert([
          {
            id: nextId,
            title,
            content,
            is_urgent: isUrgent,
            is_pinned: isPinned
          }
        ]);
      } catch (e) {
        console.log('Supabase insert warning', e);
      }

      showToast(`New note "${title}" created.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    const targetTitle = deletingNote.title;
    const targetId = deletingNote.id;
    setNotes((prev) => prev.filter((n) => n.id !== targetId));

    try {
      await supabase.from('notes').delete().eq('id', targetId);
    } catch (e) {
      console.log('Supabase delete warning', e);
    }

    showToast(`Note "${targetTitle}" deleted.`);
    setDeletingNote(null);
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Notepad</h1>
            <div className="udhaari-subtitle-text">My Notes & Important Reminders</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchNotesFromSupabase}>
              Refresh
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddNoteClick}>
              + Add Note
            </button>
          </div>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMsg && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              border: '1px solid #bbf7d0',
              fontSize: '13px'
            }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="udhaari-card-box" style={{ padding: '16px 20px' }}>
          <div className="items-search-box" style={{ width: '100%', maxWidth: '460px' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="items-search-input"
              placeholder="Search by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="udhaari-card-box" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <svg
              width="48"
              height="48"
              fill="none"
              stroke="#94a3b8"
              viewBox="0 0 24 24"
              style={{ margin: '0 auto 12px auto' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No notes found</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              {searchQuery ? `No notes matching "${searchQuery}"` : 'Create your first note to get started!'}
            </p>
            <button className="btn-primary-udhaari" style={{ margin: '16px auto 0 auto' }} onClick={handleAddNoteClick}>
              + Add Note
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* PINNED SECTION */}
            {pinnedNotes.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📌 PINNED NOTES ({pinnedNotes.length})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={() => handleEditNoteClick(note)}
                      onDelete={() => handleDeleteNoteClick(note)}
                      onTogglePin={() => handleTogglePin(note)}
                      onToggleUrgent={() => handleToggleUrgent(note)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* OTHER / ALL NOTES SECTION */}
            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                    OTHER NOTES ({otherNotes.length})
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={() => handleEditNoteClick(note)}
                      onDelete={() => handleDeleteNoteClick(note)}
                      onTogglePin={() => handleTogglePin(note)}
                      onToggleUrgent={() => handleToggleUrgent(note)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODALS */}
        <NoteModal
          isOpen={isModalOpen}
          editingNote={editingNote}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNote}
        />

        <DeleteNoteDialog
          isOpen={deletingNote !== null}
          note={deletingNote}
          onClose={() => setDeletingNote(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};

interface NoteCardProps {
  note: WebNote;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleUrgent: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleUrgent
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: note.isUrgent ? '1px solid #fca5a5' : '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: note.isUrgent ? '0 2px 8px rgba(220, 38, 38, 0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
        transition: 'all 0.15s ease'
      }}
    >
      {/* URGENT TOP ACCENT BAR */}
      {note.isUrgent && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#dc2626',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}
        />
      )}

      <div>
        {/* CARD HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
            {note.title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onTogglePin}
              title={note.isPinned ? 'Unpin' : 'Pin to top'}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                opacity: note.isPinned ? 1 : 0.4
              }}
            >
              📌
            </button>
          </div>
        </div>

        {/* URGENT BADGE */}
        {note.isUrgent && (
          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              marginBottom: '10px',
              border: '1px solid #fecaca'
            }}
          >
            ⚠️ URGENT
          </span>
        )}

        {/* CONTENT */}
        <p
          style={{
            fontSize: '13px',
            color: '#475569',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            margin: '0 0 16px 0'
          }}
        >
          {note.content}
        </p>
      </div>

      {/* FOOTER */}
      <div>
        <div
          style={{
            height: '1px',
            backgroundColor: '#f1f5f9',
            margin: '0 0 12px 0'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{note.createdAt}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onToggleUrgent}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: note.isUrgent ? '#fee2e2' : '#f1f5f9',
                color: note.isUrgent ? '#dc2626' : '#64748b',
                cursor: 'pointer'
              }}
            >
              {note.isUrgent ? 'Urgent' : 'Make Urgent'}
            </button>

            <button
              onClick={onEdit}
              title="Edit Note"
              style={{
                border: 'none',
                background: '#f1f5f9',
                color: '#334155',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Edit
            </button>

            <button
              onClick={onDelete}
              title="Delete Note"
              style={{
                border: 'none',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
