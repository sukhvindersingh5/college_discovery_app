'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  retrievedColleges?: {
    id: number;
    name: string;
    ranking: number;
    avgPlacement: number;
    highestPlacement: number;
    fees: number;
    rating: number;
  }[];
  timestamp: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  contextCollegeIds?: (number | string)[];
}

export default function AIChatModal({
  isOpen,
  onClose,
  initialQuery = '',
  contextCollegeIds = [],
}: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `## 👋 Hello! I'm your CollegeQuest Advisor

I'm here to help you make the smartest decision about your college journey in India.

**Here's what I can help you with:**
- Compare two or more colleges side-by-side
- Find colleges by location, budget, or course
- Analyse placement records and fees
- Give you a personalised recommendation

**Try asking me something like:**
- *"Which is better for CSE — IIT Bombay or BITS Pilani?"*
- *"Top MBA colleges in Delhi under ₹5 Lakhs fees"*
- *"Compare placements at IIM Ahmedabad vs IIM Bangalore"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      api.getAISuggestions()
        .then(res => { if (res.suggestions) setSuggestions(res.suggestions); })
        .catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() !== '') {
      handleSendMessage(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendAIChatMessage(textToSend, contextCollegeIds);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer || 'Sorry, I could not generate an answer right now.',
        retrievedColleges: res.retrievedColleges || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '⚠️ Unable to reach the advisor service. Please check that the backend server is running and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .ai-overlay  { animation: fadeIn 0.2s ease-out; }
        .ai-panel    { animation: slideInRight 0.35s cubic-bezier(0.22,1,0.36,1); font-family: 'Inter', sans-serif; }
        .msg-in      { animation: fadeInUp 0.28s ease-out; }
        .typing-dot  { animation: pulse-dot 1.4s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        /* Scrollbar */
        .ai-scroll::-webkit-scrollbar        { width: 3px; }
        .ai-scroll::-webkit-scrollbar-track  { background: transparent; }
        .ai-scroll::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .ai-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

        /* Input */
        .ai-input {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ai-input::placeholder { color: rgba(255,255,255,0.3); }
        .ai-input:focus {
          border-color: rgba(255,255,255,0.35) !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05) !important;
        }
        .ai-input:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Buttons */
        .ai-icon-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
          transition: all 0.2s;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .ai-icon-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.18) !important;
          color: #fff !important;
        }
        .ai-send-btn {
          background: #fff;
          color: #000;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .ai-send-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.88) !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.15) !important;
        }
        .ai-send-btn:disabled {
          background: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.25) !important;
          cursor: not-allowed;
        }
        .suggestion-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-family: 'Inter', sans-serif;
        }
        .suggestion-pill:hover {
          background: rgba(255,255,255,0.09) !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }
        .college-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .college-chip:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.25) !important;
          color: #fff !important;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .ai-panel { max-width: 100% !important; }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="ai-overlay"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'flex-end',
        }}
      >
        {/* ── Panel ── */}
        <div
          className="ai-panel"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '560px',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            background: '#000',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '-32px 0 80px rgba(0,0,0,0.9)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle scanline at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            zIndex: 1,
          }} />

          {/* ── Header ── */}
          <div style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                boxShadow: '0 0 24px rgba(255,255,255,0.12)',
              }}>
                🤖
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '0.97rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                    AI Chatbot
                  </h3>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    background: '#fff', color: '#000',
                    padding: '2px 7px', borderRadius: '4px',
                  }}>BETA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#22c55e', boxShadow: '0 0 6px #22c55e',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                    Online · CollegeQuest Advisor
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Clear */}
              <button
                onClick={() => setMessages([messages[0]])}
                title="Clear conversation"
                className="ai-icon-btn"
                style={{ width: 34, height: 34, borderRadius: '9px', fontSize: '0.8rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
              {/* Close */}
              <button
                onClick={onClose}
                title="Close"
                className="ai-icon-btn"
                style={{ width: 34, height: 34, borderRadius: '9px', fontSize: '0.9rem', fontWeight: 500 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            className="ai-scroll"
            style={{
              flex: 1, overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className="msg-in"
                style={{
                  display: 'flex',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                {/* AI avatar */}
                {msg.sender === 'ai' && (
                  <div style={{
                    width: 30, height: 30, flexShrink: 0, borderRadius: '9px', marginTop: 2,
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                    boxShadow: '0 2px 12px rgba(255,255,255,0.1)',
                  }}>🤖</div>
                )}

                <div style={{
                  maxWidth: '82%',
                  display: 'flex', flexDirection: 'column',
                  gap: 5,
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {/* Bubble */}
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: msg.sender === 'user'
                      ? '18px 4px 18px 18px'
                      : '4px 18px 18px 18px',
                    background: msg.sender === 'user'
                      ? '#fff'
                      : 'rgba(255,255,255,0.04)',
                    border: msg.sender === 'user'
                      ? 'none'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: msg.sender === 'user' ? '#000' : '#fff',
                    fontSize: '0.9rem',
                    lineHeight: 1.65,
                    boxShadow: msg.sender === 'user'
                      ? '0 4px 20px rgba(255,255,255,0.1)'
                      : 'none',
                  }}>
                    {msg.sender === 'user'
                      ? <span style={{ fontWeight: 500 }}>{msg.text}</span>
                      : renderMarkdown(msg.text)
                    }

                    {/* College chips */}
                    {msg.retrievedColleges && msg.retrievedColleges.length > 0 && (
                      <div style={{
                        marginTop: '1rem', paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <div style={{
                          fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
                          marginBottom: 8, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                          Colleges referenced
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {msg.retrievedColleges.map(col => (
                            <Link
                              key={col.id}
                              href={`/colleges/${col.id}`}
                              onClick={onClose}
                              className="college-chip"
                              style={{
                                fontSize: '0.72rem', padding: '4px 10px',
                                borderRadius: '6px', fontWeight: 600,
                              }}
                            >
                              🏛️ {col.name}
                              {col.ranking && <span style={{ opacity: 0.5 }}>· #{col.ranking}</span>}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.2)', padding: '0 4px' }}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* ── Typing indicator ── */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }} className="msg-in">
                <div style={{
                  width: 30, height: 30, flexShrink: 0, borderRadius: '9px',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>🤖</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px 18px 18px 18px',
                  padding: '0.85rem 1.1rem',
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginRight: 4 }}>
                    Thinking
                  </span>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="typing-dot" style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#fff', display: 'inline-block', opacity: 0.6,
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Suggestion pills ── */}
          {suggestions.length > 0 && messages.length <= 2 && (
            <div style={{
              padding: '0.8rem 1.5rem', flexShrink: 0,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <div style={{
                fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)',
                marginBottom: 8, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Try asking
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestions.slice(0, 4).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSendMessage(s.query)}
                    className="suggestion-pill"
                    style={{
                      padding: '5px 12px', borderRadius: '20px',
                      fontSize: '0.73rem', fontWeight: 500,
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input bar ── */}
          <div style={{
            padding: '1rem 1.5rem 1.2rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: '#000',
            flexShrink: 0,
          }}>
            <form
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about any Indian college…"
                disabled={isLoading}
                className="ai-input"
                style={{
                  flex: 1,
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontFamily: 'Inter, sans-serif',
                  width: '100%',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="ai-send-btn"
                style={{
                  padding: '0.85rem 1.2rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, sans-serif',
                  flexShrink: 0,
                }}
              >
                <span>Send</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <div style={{
              marginTop: 10, fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.18)',
              textAlign: 'center', letterSpacing: '0.01em',
            }}>
              AI advice is for guidance only · Always verify with official college sources
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Markdown renderer ─────────────────────────────────── */

function renderMarkdown(content: string) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let listItems: { key: number; text: string }[] = [];

  const flushList = (key: number) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${key}`} style={{ margin: '0.5rem 0', paddingLeft: '1.2rem', listStyle: 'none' }}>
        {listItems.map(item => (
          <li key={item.key} style={{
            margin: '0.3rem 0', color: 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 3, fontSize: '0.6rem' }}>▶</span>
            <span>{formatText(item.text)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0].split('|').map(s => s.trim()).filter(Boolean);
    const dataRows = tableRows.slice(1).filter(r => !/^[\s|:-]+$/.test(r));

    elements.push(
      <div key={`table-${key}`} style={{
        overflowX: 'auto', margin: '0.75rem 0',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '10px 14px',
                  textAlign: i === 0 ? 'left' : 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  whiteSpace: 'nowrap', letterSpacing: '0.02em',
                }}>
                  {formatText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((r, ri) => {
              const cols = r.split('|').map(s => s.trim()).filter(Boolean);
              return (
                <tr key={ri} style={{
                  borderBottom: ri < dataRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}>
                  {cols.map((col, ci) => (
                    <td key={ci} style={{
                      padding: '9px 14px',
                      color: ci === 0 ? '#fff' : 'rgba(255,255,255,0.6)',
                      textAlign: ci === 0 ? 'left' : 'center',
                      fontWeight: ci === 0 ? 600 : 400,
                    }}>
                      {formatText(col)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('|')) {
      if (!inTable) { flushList(idx); inTable = true; }
      tableRows.push(line);
      return;
    }
    if (inTable) { inTable = false; flushTable(idx); }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      listItems.push({ key: idx, text: line.trim().slice(2) });
      return;
    }
    flushList(idx);

    if (line.startsWith('## ')) {
      elements.push(
        <div key={idx} style={{
          margin: '1rem 0 0.5rem 0',
          paddingBottom: '0.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h2 style={{ margin: 0, fontSize: '0.97rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            {formatText(line.slice(3))}
          </h2>
        </div>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx} style={{ margin: '0.75rem 0 0.3rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
          {formatText(line.slice(4))}
        </h3>
      );
    } else if (line.trim() === '---' || line.trim().startsWith('━')) {
      elements.push(
        <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.75rem 0' }} />
      );
    } else if (line.trim() === '') {
      elements.push(<div key={idx} style={{ height: '0.35rem' }} />);
    } else {
      elements.push(
        <p key={idx} style={{ margin: '0.3rem 0', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
          {formatText(line)}
        </p>
      );
    }
  });

  flushList(99998);
  if (inTable) flushTable(99999);

  return <div style={{ lineHeight: 1.6 }}>{elements}</div>;
}

function formatText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
