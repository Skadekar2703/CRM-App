import React, { useState, useEffect, useRef } from 'react';
import { queryCrmAiAssistant, AiChatMessage } from '../../services/aiService';
import './WebAiChatModal.css';

interface WebAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebAiChatModal: React.FC<WebAiChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am your CRM AI Assistant. Ask me anything about your customers, Udhaari Baki/Jama, Daag items, inventory, or sales.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        "Give me today's CRM summary",
        "How much Baki do I have?",
        "Who owes me the most?",
        "How many items are in Daag?",
        "Which products are low stock?"
      ]
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptToSend?: string) => {
    const query = promptToSend || inputPrompt.trim();
    if (!query || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await queryCrmAiAssistant(query, messages);
      const cleanReply = res.reply.replace(/\*\*/g, '').replace(/\*/g, '');
      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: cleanReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolUsed: res.toolUsed,
        suggestedQuestions: res.suggestedQuestions
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: AiChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error processing query: ${e?.message || e}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init-1',
        sender: 'assistant',
        text: 'Chat cleared. Ask me any question about your CRM data.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          "Give me today's CRM summary",
          "How much Baki do I have?",
          "Who owes me the most?",
          "How many items are in Daag?"
        ]
      }
    ]);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
  const suggestions = lastAssistantMsg?.suggestedQuestions || [
    "Give me today's CRM summary",
    "How much Baki do I have?",
    "Who owes me the most?",
    "How many items are in Daag?"
  ];

  return (
    <div className="ai-chat-drawer-overlay" onClick={onClose}>
      <div className="ai-chat-drawer" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="ai-drawer-header">
          <div className="ai-header-title-box">
            <div className="ai-sparkle-badge">✨</div>
            <div>
              <h3 className="ai-header-title">CRM AI Assistant</h3>
              <p className="ai-header-subtitle">Powered by Gemini & Real CRM Data</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="ai-close-btn" onClick={handleClearChat} title="Clear Chat">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button className="ai-close-btn" onClick={onClose} title="Close">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="ai-chat-body" ref={bodyRef}>
          {messages.map((m) => (
            <div key={m.id} className={`ai-message-bubble ${m.sender}`}>
              <div>{m.text}</div>
              <div style={{ fontSize: '10px', color: m.sender === 'user' ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                {m.timestamp}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message-bubble assistant" style={{ fontStyle: 'italic', color: '#64748b' }}>
              ✨ Querying CRM database...
            </div>
          )}
        </div>

        {/* SUGGESTION PILLS */}
        {suggestions.length > 0 && (
          <div className="ai-suggested-container">
            {suggestions.map((q, idx) => (
              <button key={idx} className="ai-suggestion-pill" onClick={() => handleSendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* INPUT BOX */}
        <form
          className="ai-chat-input-box"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Ask about Baki, Jama, Daag, Sales..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
          <button type="submit" className="ai-send-btn" disabled={!inputPrompt.trim() || isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
