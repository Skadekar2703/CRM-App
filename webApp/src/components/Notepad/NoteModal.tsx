import React, { useState, useEffect } from 'react';
import { WebNote } from '../../types/notepad';

interface NoteModalProps {
  isOpen: boolean;
  editingNote: WebNote | null;
  onClose: () => void;
  onSave: (title: string, content: string, isUrgent: boolean, isPinned: boolean) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  editingNote,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setIsUrgent(editingNote.isUrgent);
      setIsPinned(editingNote.isPinned);
    } else {
      setTitle('');
      setContent('');
      setIsUrgent(false);
      setIsPinned(false);
    }
    setErrorMsg('');
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Note Title is required');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Note Content is required');
      return;
    }

    onSave(title.trim(), content.trim(), isUrgent, isPinned);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>{editingNote ? 'Edit Note' : 'Add New Note'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, padding: '8px 16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Note Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Payment Clearance Needed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Note Content *</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Enter detailed note content or action items..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '24px', margin: '8px 0' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
              />
              Mark as Urgent
            </label>

            <label style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin to Top
            </label>
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary-udhaari" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-udhaari">
              {editingNote ? 'Save Changes' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
