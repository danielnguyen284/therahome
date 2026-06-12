'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Library as LibraryIcon, Play, X, Search, Sparkles } from 'lucide-react';

interface LibraryItem {
  _id: string;
  title: string;
  category: string;
  coverImage?: string;
  link: string;
}

const DEFAULT_CATEGORIES = [
  'Hiểu đúng về bài tập',
  'Liệu pháp MC GILL',
  'Liệu pháp MC KENZIE',
  'Yoga Trị Liệu',
  'Dưỡng sinh Trị liệu',
  'Tập cùng TheraNECK',
];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await api.get<LibraryItem[]>('/library');
        if (data && Array.isArray(data)) {
          setItems(data);
        }
      } catch (err) {
        console.error('Failed to load library items:', err);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  // Filter based on search query
  const filteredItems = items.filter((item) => {
    const titleMatch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || categoryMatch;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, LibraryItem[]>);

  // Extract all present categories in desired order
  const displayCategories = [
    ...new Set([
      ...DEFAULT_CATEGORIES.filter((c) => groupedItems[c]?.length > 0),
      ...Object.keys(groupedItems),
    ]),
  ].filter(c => groupedItems[c]?.length > 0);

  // Parse embeddable URL for YouTube or default fallback
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
      }
    } catch (e) {
      console.warn('Error parsing video URL:', e);
    }
    return url;
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LibraryIcon className="w-6 h-6 text-indigo-650" />
          Thư viện trị liệu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">
          Tổng hợp kiến thức khoa học, liệu pháp phục hồi xương khớp được cố vấn chuyên môn bởi các bác sĩ phục hồi chức năng hàng đầu.
        </p>

        {/* Search Bar */}
        <div className="relative mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài tập, phương pháp trị liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs md:text-sm text-slate-800 dark:text-slate-250 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm animate-pulse">Đang tải tài liệu chuyên khoa...</p>
        </div>
      ) : displayCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center opacity-70">
          <LibraryIcon className="w-10 h-10 text-slate-350" />
          <p className="mt-4 text-slate-400 text-xs">Không tìm thấy nội dung phù hợp với từ khóa.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayCategories.map((category) => {
            const categoryItems = groupedItems[category];
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 bg-indigo-600 rounded"></div>
                  <h3 className="font-bold text-slate-850 dark:text-white text-sm md:text-base">
                    {category}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => setActiveVideo({ url: item.link, title: item.title })}
                      className="w-full text-left bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center p-3 gap-3"
                    >
                      {/* Image Thumbnail / Placeholder */}
                      <div className="relative aspect-[4/3] w-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 flex items-center justify-center">
                        {item.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Play className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
                        )}
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <div className="p-1.5 rounded-full bg-white/90 shadow-sm text-slate-950">
                            <Play className="w-3 h-3 fill-slate-950" />
                          </div>
                        </div>
                      </div>

                      {/* Content Description */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                          {item.title}
                        </h4>
                        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          Xem video
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Video Overlay Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-950 rounded-3xl overflow-hidden max-w-3xl w-full border border-slate-800 shadow-2xl relative">
            
            {/* Header Title & Close button */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <span className="text-xs font-bold line-clamp-1 pr-6">{activeVideo.title}</span>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video w-full bg-black">
              {activeVideo.url.includes('youtube.com') || activeVideo.url.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  className="absolute inset-0 w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full object-contain"
                ></video>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
