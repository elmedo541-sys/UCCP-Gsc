import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full
        bg-background/80 backdrop-blur-sm border border-border
        shadow-md flex items-center justify-center
        text-foreground hover:bg-accent hover:text-accent-foreground
        transition-all duration-200 hover:scale-110 active:scale-95"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
