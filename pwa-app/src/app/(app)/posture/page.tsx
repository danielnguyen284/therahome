'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface PostureItem {
  id: string;
  category: string;
  image_url: string;
  image_urls?: string[];
  is_correct: boolean;
  description: string;
  sort_order: number;
}

interface PostureGroup {
  category: string;
  correct: PostureItem | null;
  incorrect: PostureItem | null;
}

const CATEGORY_ORDER = [
  'Làm việc',
  'Ngủ',
  'Ngồi, nghỉ',
  'Dùng điện thoại',
  'Lái xe',
  'Bê vác',
];

export default function PosturePage() {
  const [groups, setGroups] = useState<PostureGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPostures = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<PostureItem[]>('/postures');
        
        if (!data || !Array.isArray(data)) {
          setGroups([]);
          return;
        }

        const groupedMap = new Map<string, PostureGroup>();

        data.forEach((item) => {
          if (!groupedMap.has(item.category)) {
            groupedMap.set(item.category, {
              category: item.category,
              correct: null,
              incorrect: null,
            });
          }

          const group = groupedMap.get(item.category)!;
          if (item.is_correct) {
            group.correct = item;
          } else {
            group.incorrect = item;
          }
        });

        const sorted = Array.from(groupedMap.values()).sort((a, b) => {
          const aIndex = CATEGORY_ORDER.indexOf(a.category);
          const bIndex = CATEGORY_ORDER.indexOf(b.category);
          if (aIndex === -1 && bIndex === -1) {
            return a.category.localeCompare(b.category, 'vi');
          }
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        setGroups(sorted);
        if (sorted.length > 0) {
          setSelectedCategory(sorted[0].category);
        }
      } catch (err) {
        console.error('Error loading postures:', err);
        setError('Không thể tải danh sách tư thế lúc này.');
      } finally {
        setLoading(false);
      }
    };

    loadPostures();
  }, []);

  const activeGroup = groups.find((g) => g.category === selectedCategory) || groups[0] || null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Đang tải hướng dẫn tư thế...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <p className="text-rose-500 font-semibold text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Tư thế & Vận động
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">
          Định hình cơ thể đúng khi thực hiện các tư thế sinh hoạt hằng ngày để bảo vệ cột sống, giảm áp lực lên các khớp vai gáy và cơ thắt lưng.
        </p>
      </div>

      {/* Category selector chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {groups.map((group) => {
          const isActive = group.category === selectedCategory;
          return (
            <button
              key={group.category}
              onClick={() => setSelectedCategory(group.category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {group.category}
            </button>
          );
        })}
      </div>

      {/* Side-by-side or Top-to-Bottom Comparison layout */}
      {activeGroup && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Tư thế chuẩn: {activeGroup.category}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Incorrect Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-rose-600 bg-rose-500/5">
                <XCircle className="w-5 h-5 shrink-0" />
                <span className="font-bold text-xs md:text-sm">Tư thế sai / Tránh làm</span>
              </div>
              
              {activeGroup.incorrect ? (
                <div>
                  <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-slate-950 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={activeGroup.incorrect.image_url} 
                      alt="Tư thế sai" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                      {activeGroup.incorrect.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400 text-xs">
                  Chưa cập nhật ảnh minh họa tư thế sai.
                </div>
              )}
            </div>

            {/* Correct Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-emerald-650 bg-emerald-500/5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-bold text-xs md:text-sm">Tư thế đúng / Khuyên làm</span>
              </div>
              
              {activeGroup.correct ? (
                <div>
                  <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-slate-950 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={activeGroup.correct.image_url} 
                      alt="Tư thế đúng" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                      {activeGroup.correct.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400 text-xs">
                  Chưa cập nhật ảnh minh họa tư thế đúng.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
