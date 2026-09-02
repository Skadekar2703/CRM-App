import React from 'react';
import './WebAiChatModal.css';

interface WebAiFloatingButtonProps {
  onClick: () => void;
}

export const WebAiFloatingButton: React.FC<WebAiFloatingButtonProps> = ({ onClick }) => {
  return (
    <button className="ai-floating-trigger" onClick={onClick} title="Ask CRM AI Assistant">
      <span>✨</span>
      <span>AI Assistant</span>
    </button>
  );
};
