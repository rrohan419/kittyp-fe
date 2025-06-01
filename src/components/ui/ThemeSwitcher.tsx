import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";
import { cn } from '@/lib/utils';

const themes = [
  { 
    name: "Default", 
    value: "default", 
    color: "hsl(339, 85%, 60%)",
    class: "bg-primary"
  },
  { 
    name: "Purple", 
    value: "purple", 
    color: "hsl(265, 85%, 65%)",
    class: "bg-primary"
  },
  { 
    name: "Blue", 
    value: "blue", 
    color: "hsl(221, 83%, 53%)",
    class: "bg-primary"
  },
  { 
    name: "Green", 
    value: "green", 
    color: "hsl(142, 72%, 46%)",
    class: "bg-primary"
  },
  { 
    name: "Autumn", 
    value: "autumn", 
    color: "hsl(27, 96%, 61%)",
    class: "bg-primary"
  },
  { 
    name: "Ocean", 
    value: "ocean", 
    color: "hsl(199, 89%, 48%)",
    class: "bg-primary"
  },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-theme') || 'default';
    }
    return 'default';
  });

  const [mounted, setMounted] = useState(false);

  // Ensure hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Remove any existing theme
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove(...themes.map(t => `theme-${t.value}`));
    
    if (theme !== 'default') {
      // Apply new theme
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem('app-theme', theme);
  }, [theme, mounted]);

  if (!mounted) {
    return null;
  }

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "relative bg-background hover:bg-accent",
            "transition-colors duration-200"
          )}
        >
          <Palette className="h-4 w-4" />
          <span 
            className={cn(
              "absolute bottom-1 right-1 w-2 h-2 rounded-full",
              "ring-2 ring-background",
              currentTheme?.class
            )}
            style={{
              backgroundColor: currentTheme?.color
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === t.value && "bg-accent"
            )}
          >
            <span
              className="w-2 h-2 rounded-full ring-1 ring-border"
              style={{
                backgroundColor: t.color
              }}
            />
            <span className={theme === t.value ? "font-medium" : ""}>
              {t.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 