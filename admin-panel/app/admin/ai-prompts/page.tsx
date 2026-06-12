'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showSuccess, showError } from '@/lib/toast';

interface Prompt {
  id: string;
  prompt_type: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
}

const PROMPT_TYPES = {
  recommendation: 'Gợi ý bài tập',
  chatbot: 'Chatbot',
  tips: 'Mẹo sức khỏe',
  nutrition: 'Dinh dưỡng',
};

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await api.get('/ai-prompts');
      setPrompts(data || []);
    } catch (error) {
      console.error('Load prompts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (prompt: Prompt) => {
    setSaving(prompt.id);

    try {
      await api.put(`/ai-prompts/${prompt.id}`, {
        system_prompt: prompt.system_prompt,
        model: prompt.model,
        temperature: prompt.temperature,
        max_tokens: prompt.max_tokens,
        is_active: prompt.is_active,
      });

      showSuccess('Đã lưu prompt');
    } catch (error) {
      console.error('Save prompt error:', error);
      showError('Không thể lưu prompt');
    } finally {
      setSaving(null);
    }
  };

  const updatePrompt = (id: string, field: string, value: any) => {
    setPrompts(prompts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Quản lý AI Prompts</h1>

      <div className="space-y-6">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {PROMPT_TYPES[prompt.prompt_type as keyof typeof PROMPT_TYPES] || prompt.prompt_type}
              </h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prompt.is_active}
                  onChange={(e) => updatePrompt(prompt.id, 'is_active', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={prompt.system_prompt}
                  onChange={(e) => updatePrompt(prompt.id, 'system_prompt', e.target.value)}
                  className="input font-mono text-sm"
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Model
                  </label>
                  <select
                    value={prompt.model}
                    onChange={(e) => updatePrompt(prompt.id, 'model', e.target.value)}
                    className="input"
                  >
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b</option>
                    <option value="gemma2-9b-it">gemma2-9b</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Temperature: {prompt.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={prompt.temperature}
                    onChange={(e) => updatePrompt(prompt.id, 'temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={prompt.max_tokens}
                    onChange={(e) => updatePrompt(prompt.id, 'max_tokens', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave(prompt)}
                disabled={saving === prompt.id}
                className="btn btn-primary"
              >
                <Save size={20} className="inline mr-2" />
                {saving === prompt.id ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
