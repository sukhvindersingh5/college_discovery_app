'use client';

import React, { useState, useEffect } from 'react';
import AIChatModal from './AIChatModal';

interface AIChatButtonProps {
  initialQuery?: string;
  contextCollegeIds?: (number | string)[];
}

export default function AIChatButton({ initialQuery, contextCollegeIds }: AIChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fab-pulse {
          0%   { box-shadow: 0 8px 32px rgba(255,255,255,0.08), 0 0 0 0 rgba(255,255,255,0.15); }
          70%  { box-shadow: 0 8px 32px rgba(255,255,255,0.08), 0 0 0 14px rgba(255,255,255,0); }
          100% { box-shadow: 0 8px 32px rgba(255,255,255,0.08), 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes fab-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .ai-fab {
          animation: fab-float 4s ease-in-out infinite;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
        }
        .ai-fab.pulse-active {
          animation: fab-float 4s ease-in-out infinite, fab-pulse 2s ease-out 3;
        }
        .ai-fab:hover {
          transform: translateY(-5px) scale(1.03) !important;
          box-shadow: 0 20px 50px rgba(255,255,255,0.12) !important;
          animation: none !important;
        }
        .ai-fab-dot {
          animation: dot-blink 2s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Action Button */}
      <button
        id="ai-chat-fab"
        onClick={() => { setIsOpen(true); setPulse(false); }}
        className={`ai-fab${pulse ? ' pulse-active' : ''}`}
        aria-label="Open AI Chatbot"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 900,
          background: '#000',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50px',
          padding: '0.85rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 8px 32px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* AI Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: '8px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="white" opacity="0.95"/>
            <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill="white" opacity="0.6"/>
            <path d="M5 3L5.6 4.4L7 5L5.6 5.6L5 7L4.4 5.6L3 5L4.4 4.4L5 3Z" fill="white" opacity="0.5"/>
          </svg>
        </div>

        <span style={{ letterSpacing: '-0.01em' }}>AI Chatbot</span>

        {/* Live badge */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '3px 10px', borderRadius: '20px',
          fontSize: '0.68rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span className="ai-fab-dot" style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22c55e', display: 'inline-block',
            boxShadow: '0 0 6px #22c55e',
          }} />
          Live
        </span>
      </button>

      {/* Modal */}
      <AIChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialQuery={initialQuery}
        contextCollegeIds={contextCollegeIds}
      />
    </>
  );
}
