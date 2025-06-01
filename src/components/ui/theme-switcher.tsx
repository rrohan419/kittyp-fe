import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun, Laptop } from "lucide-react";

const colorSchemes = [
  { 
    value: 'default',
    label: 'Pink',
    color: 'hsl(339, 85%, 60%)'
  },
  { 
    value: 'purple',
    label: 'Purple',
    color: 'hsl(265, 85%, 65%)'
  },
  { 
    value: 'blue',
    label: 'Blue',
    color: 'hsl(221, 83%, 53%)'
  },
  { 
    value: 'green',
    label: 'Green',
    color: 'hsl(142, 72%, 46%)'
  },
  { 
    value: 'autumn',
    label: 'Autumn',
    color: 'hsl(27, 96%, 61%)'
  },
  { 
    value: 'ocean',
    label: 'Ocean',
    color: 'hsl(199, 89%, 48%)'
  },
] as const;

const modes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    icon: Laptop,
  },
] as const;

export function ThemeSwitcher() {
  const { colorScheme, setColorScheme, mode, setMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
          <span 
            className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-border"
            style={{ 
              backgroundColor: colorSchemes.find(c => c.value === colorScheme)?.color 
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Color Scheme
        </DropdownMenuLabel>
        {colorSchemes.map(({ value, label, color }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setColorScheme(value)}
            className="flex items-center gap-2"
          >
            <div 
              className="h-4 w-4 rounded-full ring-1 ring-border"
              style={{ 
                backgroundColor: color,
                opacity: colorScheme === value ? 1 : 0.7
              }}
            />
            <span className={colorScheme === value ? "font-medium" : ""}>
              {label}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Mode
        </DropdownMenuLabel>
        {modes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setMode(value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className={mode === value ? "font-medium" : ""}>
              {label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 