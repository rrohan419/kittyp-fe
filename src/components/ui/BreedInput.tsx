import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { searchBreeds, type BreedOption } from '@/services/breedService';

type Props = {
  id: string;
  species: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function BreedInput({ id, species, value, onChange, disabled, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<BreedOption[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useEffect(() => {
    request.current?.abort();
    const currentId = ++requestId.current;
    setOptions([]);
    setPage(0);
    setHasMore(false);
    setActive(-1);
    setError(false);
    if (!open || disabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(() => {
      void searchBreeds(species, value, 1, controller.signal)
        .then((result) => {
          if (currentId !== requestId.current) return;
          setOptions(result.models);
          setPage(1);
          setHasMore(!result.isLast);
        })
        .catch(() => {
          if (!controller.signal.aborted && currentId === requestId.current) setError(true);
        })
        .finally(() => {
          if (currentId === requestId.current) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      request.current?.abort();
    };
  }, [open, disabled, species, value, retry]);

  const loadMore = async () => {
    if (loading || !page) return;
    const currentId = requestId.current;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(false);
    try {
      const result = await searchBreeds(species, value, page + 1, controller.signal);
      if (currentId !== requestId.current) return;
      setOptions((previous) => [...previous, ...result.models]);
      setPage(page + 1);
      setHasMore(!result.isLast);
    } catch {
      if (!controller.signal.aborted && currentId === requestId.current) setError(true);
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  };

  const select = (option: BreedOption) => {
    onChange(option.name);
    setOpen(false);
  };

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${options[active]?.id}` : undefined}
        value={value}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, options.length - 1));
          }
          if (event.key === 'ArrowUp' && options.length) {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          }
          if (event.key === 'Enter' && open && active >= 0 && options[active]) {
            event.preventDefault();
            select(options[active]);
          }
        }}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder || 'Type to search or enter a breed'}
        className={className}
      />
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div id={listId} role="listbox" aria-label="Breed suggestions" className="max-h-52 overflow-y-auto p-1">
            {options.map((option, index) => {
              const matchedAlias = option.aliases.find((alias) =>
                value.trim() && alias.toLowerCase().includes(value.trim().toLowerCase()));
              return (
                <div
                  key={option.id}
                  id={`${listId}-${option.id}`}
                  role="option"
                  aria-selected={index === active}
                  className={`cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent ${index === active ? 'bg-accent' : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(option)}
                >
                  <div>{option.name}</div>
                  {matchedAlias && <div className="text-xs text-muted-foreground">{matchedAlias}</div>}
                </div>
              );
            })}
          </div>
          {loading && <p className="px-3 py-2 text-sm text-muted-foreground" role="status">Loading breeds...</p>}
          {!loading && error && (
            <div className="px-3 py-2 text-sm" role="alert">
              <span className="text-destructive">Could not load breeds. </span>
              <button type="button" className="underline" onClick={() => page ? void loadMore() : setRetry((n) => n + 1)}>Retry</button>
            </div>
          )}
          {!loading && !error && !options.length && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No breeds found. You can keep your typed value.</p>
          )}
          {!loading && !error && hasMore && (
            <button type="button" className="w-full px-3 py-2 text-left text-sm underline" onClick={() => void loadMore()}>
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
