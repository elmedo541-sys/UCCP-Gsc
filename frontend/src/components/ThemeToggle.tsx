import { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const STORAGE_KEY = 'theme-toggle-position';
const BUTTON_SIZE = 40; // w-10 h-10
const MARGIN = 8;
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a click

type Position = { x: number; y: number };

function defaultPosition(): Position {
  // Default: top-right corner, matching the original placement.
  return { x: window.innerWidth - BUTTON_SIZE - 16, y: 16 };
}

function clampPosition(pos: Position): Position {
  const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
  const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
  return {
    x: Math.min(Math.max(pos.x, MARGIN), Math.max(maxX, MARGIN)),
    y: Math.min(Math.max(pos.y, MARGIN), Math.max(maxY, MARGIN)),
  };
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [position, setPosition] = useState<Position>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return clampPosition(JSON.parse(stored));
    } catch { /* ignore malformed storage */ }
    return defaultPosition();
  });

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number }>({
    pointerX: 0, pointerY: 0, originX: 0, originY: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Keep the button on-screen if the window is resized.
  useEffect(() => {
    const onResize = () => setPosition(p => clampPosition(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    buttonRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.pointerX;
    const dy = e.clientY - startRef.current.pointerY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      movedRef.current = true;
    }
    if (movedRef.current) {
      setPosition(clampPosition({
        x: startRef.current.originX + dx,
        y: startRef.current.originY + dy,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    buttonRef.current?.releasePointerCapture(e.pointerId);

    if (movedRef.current) {
      // Was a drag — save the new position, don't toggle theme.
      setPosition(p => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
        return p;
      });
    } else {
      // Was a tap/click — toggle theme instead.
      toggleTheme();
    }
    movedRef.current = false;
  };

  return (
    <button
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
      className="fixed z-50 w-10 h-10 rounded-full
        bg-background/80 backdrop-blur-sm border border-border
        shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing
        text-foreground hover:bg-accent hover:text-accent-foreground
        transition-[background-color,color,transform] duration-200 hover:scale-110 active:scale-95"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 pointer-events-none" />
      ) : (
        <Moon className="w-4 h-4 pointer-events-none" />
      )}
    </button>
  );
}
