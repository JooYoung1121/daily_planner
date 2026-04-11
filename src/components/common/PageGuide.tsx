import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

interface PageGuideProps {
  pageId: string;
  title: string;
  tips: string[];
}

export function PageGuide({ pageId, title, tips }: PageGuideProps) {
  const dismissedGuides = useSettingsStore((s) => s.dismissedGuides ?? []);
  const setDismissedGuides = useSettingsStore((s) => s.setDismissedGuides);
  const [visible, setVisible] = useState(!dismissedGuides.includes(pageId));

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    setDismissedGuides([...dismissedGuides, pageId]);
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Lightbulb size={16} className="shrink-0 mt-0.5 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{title}</p>
            <ul className="mt-1.5 space-y-1">
              {tips.map((tip, i) => (
                <li key={i} className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5 text-blue-400">-</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 rounded p-0.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
