import { Moon, Sun, Monitor } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Theme } from '@/types/settings';

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];

export function Header() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const Icon = THEME_ICONS[theme];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <div />
      <button
        onClick={cycleTheme}
        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title={`테마: ${theme}`}
      >
        <Icon size={20} />
      </button>
    </header>
  );
}
