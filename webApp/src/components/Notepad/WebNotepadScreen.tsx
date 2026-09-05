import React, { useState, useMemo, useEffect } from 'react';
import { WebNote } from '../../types/notepad';
import { NoteModal } from './NoteModal';
import { DeleteNoteDialog } from './DeleteNoteDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebNotepadScreen: React.FC = () => {
  const [notes, setNotes] = useState<WebNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WebNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<WebNote | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH FROM SUPABASE (SOURCE OF TRUTH)
  const fetchNotesFromSupabase = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notes from Supabase:', error);
        setErrorMsg('Unable to load notes. Please try again.');
        setNotes([]);
      } else if (data) {
        const mapped: WebNote[] = data.map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled Note',
          content: item.content || '',
          isUrgent: item.priority === 'High' || item.is_urgent === true,
          isPinned: item.is_pinned || false,
          createdAt: item.created_at
            ? new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Recent'
        }));
        setNotes(mapped);
      }
    } catch (e: any) {
      console.error('Failed to query notes from database:', e);
      setErrorMsg('Unable to load notes. Please try again.');
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesFromSupabase();
  }, []);

  // REAL-TIME SEARCH
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
    const { error } = await supabase
      .from('notes')
      .update({ is_pinned: updatedStatus })
      .eq('id', note.id);

    if (error) {
      console.error('Failed to update pin status:', error);
      showToast('Unable to update note pin status.');
      return;
    }

    await fetchNotesFromSupabase();
    showToast(updatedStatus ? `Note "${note.title}" pinned to top.` : `Note "${note.title}" unpinned.`);
  };

  const handleToggleUrgent = async (note: WebNote) => {
    const updatedStatus = !note.isUrgent;
    const { error } = await supabase
      .from('notes')
      .update({ priority: updatedStatus ? 'High' : 'Normal' })
      .eq('id', note.id);

    if (error) {
      console.error('Failed to update priority:', error);
      showToast('Unable to update note priority.');
      return;
    }

    await fetchNotesFromSupabase();
    showToast(updatedStatus ? `Note "${note.title}" marked as Urgent!` : `Note "${note.title}" marked Normal.`);
  };

  const handleSaveNote = async (
    title: string,
    content: string,
    isUrgent: boolean,
    isPinned: boolean
  ) => {
    if (!title.trim()) {
      showToast('Please enter a note title.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: title.trim(),
            content: content.trim(),
            priority: isUrgent ? 'High' : 'Normal',
            is_pinned: isPinned
          })
          .eq('id', editingNote.id);

        if (error) {
          console.error('Supabase update note error:', error);
          showToast('Unable to save note. Please try again.');
          setIsLoading(false);
          return;
        }
        showToast(`Note "${title}" updated successfully.`);
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([
            {
              title: title.trim(),
              content: content.trim(),
              priority: isUrgent ? 'High' : 'Normal',
              is_pinned: isPinned
            }
          ]);

        if (error) {
          console.error('Supabase insert note error:', error);
          showToast('Unable to save note. Please try again.');
          setIsLoading(false);
          return;
        }
        showToast(`Note "${title}" saved successfully.`);
      }

      setIsModalOpen(false);
      await fetchNotesFromSupabase();
    } catch (e: any) {
      console.error('Exception saving note to Supabase:', e);
      showToast('Unable to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    const targetTitle = deletingNote.title;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', deletingNote.id);
      if (error) {
        console.error('Supabase delete note error:', error);
        showToast('Unable to delete note. Please try again.');
        return;
      }
      showToast(`Note "${targetTitle}" deleted.`);
      setDeletingNote(null);
      await fetchNotesFromSupabase();
    } catch (e: any) {
      console.error('Exception deleting note:', e);
      showToast('Unable to delete note. Please try again.');
    }
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
              backgroundColor: toastMsg.includes('Unable') ? '#fef2f2' : '#f0fdf4',
              color: toastMsg.includes('Unable') ? '#dc2626' : '#16a34a',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              border: `1px solid ${toastMsg.includes('Unable') ? '#fecaca' : '#bbf7d0'}`,
              fontSize: '13px'
            }}
          >
            {toastMsg.includes('Unable') ? '⚠️ ' : '✓ '}{toastMsg}
          </div>
        )}

        {/* ERROR STATE */}
        {errorMsg && (
          <div className="udhaari-card-box" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '15px' }}>⚠️ {errorMsg}</div>
            <button className="btn-primary-udhaari" style={{ marginTop: '12px' }} onClick={fetchNotesFromSupabase}>
              Retry Loading Notes
            </button>
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
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontWeight: 600 }}>Loading notes from database...</div>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No notes available</h3>
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
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  📌 PINNED NOTES ({pinnedNotes.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {pinnedNotes.map((note) => (
                    <NoteCardItem
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

            {/* OTHER NOTES SECTION */}
            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px', marginBottom: '12px' }}>
                    ALL NOTES ({otherNotes.length})
                  </h3>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {otherNotes.map((note) => (
                    <NoteCardItem
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
      </div>

      {/* MODALS */}
      <NoteModal
        isOpen={isModalOpen}
        editingNote={editingNote}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
      />

      <DeleteNoteDialog
        isOpen={!!deletingNote}
        note={deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

interface NoteCardItemProps {
  note: WebNote;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleUrgent: () => void;
}

const NoteCardItem: React.FC<NoteCardItemProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleUrgent
}) => {
  return (
    <div
      className="udhaari-card-box"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: note.isUrgent ? '4px solid #ef4444' : '4px solid #3b82f6',
        borderRadius: '12px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{note.title}</h4>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onTogglePin}
              title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              {note.isPinned ? '📌' : '📍'}
            </button>
            <button
              onClick={onToggleUrgent}
              title={note.isUrgent ? 'Mark Normal' : 'Mark Urgent'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              {note.isUrgent ? '🔴' : '⚪'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px 0', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
          {note.content}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8' }}>
        <span>{note.createdAt}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>
            Edit
          </button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
