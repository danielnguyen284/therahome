'use client';

import React, { useState } from 'react';
import { ZONES_PATHS, STATIC_PATHS, BODY_OUTLINE, ZONE_LABELS, PAIN_LEVELS, PAIN_COLORS } from './bodyMapData';

interface BodyMapProps {
  selectedAreas: Record<string, number>;
  onAreaPress: (area: string, level: number) => void;
}

const getPainColor = (level: number): string => {
  if (level === 0) return PAIN_COLORS.none;
  if (level <= 3) return PAIN_COLORS.mild;
  if (level <= 7) return PAIN_COLORS.moderate;
  return PAIN_COLORS.severe;
};

export default function BodyMap({ selectedAreas, onAreaPress }: BodyMapProps) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const getFillColor = (zoneId: string): string => {
    if (selectedArea) {
      if (zoneId === selectedArea) return '#FDE047';
      return '#4B5563';
    }
    if (selectedAreas[zoneId] !== undefined) return getPainColor(selectedAreas[zoneId]);
    return '#3F3F46';
  };

  const handleBodyPartPress = (areaId: string) => {
    setSelectedArea(areaId);
  };

  const handleLevelSelect = (level: number) => {
    if (!selectedArea) return;
    onAreaPress(selectedArea, level);
    setSelectedArea(null);
  };

  const VIEW_BOX = '724 60 724 780';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Body Map Card */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3 font-medium">
          Chạm vào cơ thể để chọn vùng bị đau và chọn mức độ.
        </p>

        <div className="w-full aspect-[1/1.08] flex items-center justify-center overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox={VIEW_BOX}
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            {/* Body outline */}
            <path d={BODY_OUTLINE} fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

            {/* Static body parts (non-interactive) */}
            <g>
              {STATIC_PATHS.map((pathData, index) => (
                <path key={`s-${index}`} d={pathData} fill="#3F3F46" />
              ))}
            </g>

            {/* Interactive zones */}
            <g>
              {Object.entries(ZONES_PATHS).map(([zoneId, paths]) => (
                <g key={zoneId}>
                  {paths.map((pathData, index) => (
                    <path
                      key={`${zoneId}-${index}`}
                      d={pathData}
                      fill={getFillColor(zoneId)}
                      onClick={() => handleBodyPartPress(zoneId)}
                      style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
                    />
                  ))}
                </g>
              ))}
            </g>

            {/* White stroke overlay for separation lines */}
            <g strokeWidth="3" stroke="#FFFFFF" strokeLinejoin="round" fill="none">
              {STATIC_PATHS.map((pathData, index) => (
                <path key={`ss-${index}`} d={pathData} />
              ))}
              {Object.entries(ZONES_PATHS).map(([zoneId, paths]) =>
                paths.map((pathData, index) => (
                  <path key={`zs-${zoneId}-${index}`} d={pathData} />
                ))
              )}
            </g>
          </svg>
        </div>

        {/* Region legend chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {Object.entries(ZONE_LABELS).map(([id, label]) => {
            const savedLevel = selectedAreas[id];
            let dotColor = '#CBD5E1';
            if (selectedArea === id) {
              dotColor = '#93C5FD';
            } else if (savedLevel !== undefined) {
              dotColor = getPainColor(savedLevel);
            }

            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedArea(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                {label}
                {savedLevel !== undefined ? ` ${savedLevel}/10` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Level selector panel */}
      {selectedArea && (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Mức đau: {ZONE_LABELS[selectedArea] || selectedArea}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Chọn mức phù hợp nhất với cảm giác của bạn ở vùng này.
            </p>
          </div>

          <div className="flex justify-between gap-3">
            {PAIN_LEVELS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleLevelSelect(item.value)}
                className="flex-1 aspect-square max-w-[72px] rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: item.color }}
              >
                <span className="text-lg font-extrabold text-white">{item.value}</span>
                <span className="text-[9px] font-bold text-white/90">{item.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSelectedArea(null)}
            className="w-full py-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Color legend */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Chú thích:</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { color: PAIN_COLORS.none, text: 'Không đau' },
            { color: PAIN_COLORS.mild, text: 'Đau nhẹ (ấm ấm)' },
            { color: PAIN_COLORS.moderate, text: 'Đau vừa (khó chịu)' },
            { color: PAIN_COLORS.severe, text: 'Đau nặng/Tê' },
          ].map((item) => (
            <div key={item.color} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md shrink-0 border border-black/5" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
