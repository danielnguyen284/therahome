'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { chatWithAssistant } from '../../../lib/groq';
import { Bot, User as UserIcon, Send, Sparkles, Trash2, ArrowRight, X } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  message: string;
  created_at?: string;
}

const SUGGESTIONS = [
  'Tôi bị mỏi cổ vai gáy khi làm việc',
  'Tôi bị tê dọc cánh tay phải',
  'Lưng thắt lưng bị đau ê ẩm',
  'Cách tập bài McKenzie như thế nào?',
];

export default function ChatPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load History
  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const history = await api.get<any[]>('/chat-history');
      if (history && Array.isArray(history)) {
        // Map backend key `message` to standard structure
        const mapped = history.map((h) => ({
          id: h.id || h._id,
          role: h.role,
          message: h.message,
          created_at: h.created_at,
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Clear Chat History
  const handleClearHistory = async () => {
    if (!confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện?')) return;
    try {
      await api.delete('/chat-history');
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  // Send Message
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    setInputVal('');
    setLoading(true);

    // Append user message locally & save to DB
    const userTempMsg: Message = { role: 'user', message: text };
    setMessages((prev) => [...prev, userTempMsg]);

    try {
      // 1. Sync User Message to DB
      const userSaved = await api.post<Message>('/chat-history', {
        role: 'user',
        message: text,
      });

      // Update the local list with saved item if returned
      if (userSaved) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = userSaved;
          return next;
        });
      }

      // 2. Prepare Groq payload
      const chatHistoryPayload = messages.map((m) => ({
        role: m.role,
        content: m.message,
      }));

      // 3. Call AI Assistant
      const aiReply = await chatWithAssistant(text, chatHistoryPayload);

      // 4. Save AI Reply to DB
      const aiSaved = await api.post<Message>('/chat-history', {
        role: 'assistant',
        message: aiReply,
      });

      if (aiSaved) {
        setMessages((prev) => [...prev, aiSaved]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', message: aiReply }]);
      }
    } catch (err) {
      console.error('Chat transaction error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', message: 'Hệ thống gặp sự cố phản hồi. Hãy thử lại sau ít phút!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[78vh] w-full max-w-5xl flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm md:h-[calc(100vh-7rem)]">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 bg-slate-50 relative">
            <img
              src="/images/xin-chao-toi-la-tro-ly.png"
              alt="Trợ lý bác sĩ"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-bold text-slate-850 dark:text-white text-xs md:text-sm">Trợ lý TheraHome</h2>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Đang hoạt động
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
              title="Xóa cuộc trò chuyện"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/home');
              }
            }}
            className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Đóng chat"
            aria-label="Đóng chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/10"
      >
        {messages.length === 0 ? (
          <div className="space-y-6 py-2">
            {/* Assistant Welcome Bubble */}
            <div className="flex gap-3 max-w-[85%] md:max-w-[72%] mr-auto">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 bg-slate-50">
                <img
                  src="/images/xin-chao-toi-la-tro-ly.png"
                  alt="Trợ lý bác sĩ"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-tl-none">
                <p className="whitespace-pre-line">
                  Xin chào! Tôi là trợ lý AI TheraHome. Bạn có đang gặp vấn đề nhức mỏi cơ, khớp thắt lưng hay vai gáy không? Hãy mô tả để tôi hỗ trợ tư vấn bài tập nhé.
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="max-w-sm md:max-w-xl mx-auto mt-8 px-4 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Gợi ý câu hỏi</p>
              <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-left text-xs font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                  >
                    <span className="line-clamp-1">{suggestion}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-600 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] md:max-w-[72%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                    isUser
                      ? 'bg-emerald-600 text-white text-xs'
                      : 'border border-slate-200 dark:border-slate-800 bg-slate-50'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4.5 h-4.5" /> : (
                    <img
                      src="/images/xin-chao-toi-la-tro-ly.png"
                      alt="Trợ lý bác sĩ"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Bubble content */}
                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] md:max-w-[72%] mr-auto items-end">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 bg-slate-50">
              <img
                src="/images/xin-chao-toi-la-tro-ly.png"
                alt="Trợ lý bác sĩ"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-1.5">
          <input
            type="text"
            placeholder="Nhập tin nhắn tư vấn..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent py-2.5 outline-none text-xs md:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="p-2 rounded-xl bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 transition-all shrink-0 ml-2 shadow-md shadow-indigo-100 dark:shadow-none"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>
      </form>
    </div>
  );
}
