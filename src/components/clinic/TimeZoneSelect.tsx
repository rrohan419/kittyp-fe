import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchTimeZones, type TimeZoneOption } from '@/services/timeZoneService';

const PAGE_SIZE = 30;

type Props = {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

export function TimeZoneSelect({ value, onChange, disabled, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<TimeZoneOption[]>([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeQueryRef = useRef('');
  const pageRequestRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(async (search: string, page: number, replace: boolean) => {
    if (pageRequestRef.current) return;
    pageRequestRef.current = true;
    setLoading(true);
    setError('');
    const requestId = ++requestIdRef.current;
    try {
      const result = await searchTimeZones(search, page, PAGE_SIZE);
      if (requestId !== requestIdRef.current || search !== activeQueryRef.current) return;
      setOptions((current) => {
        const next = replace ? result.models : [...current, ...result.models];
        return next.filter(
          (option, index) => next.findIndex((item) => item.timezoneId === option.timezoneId) === index
        );
      });
      setPageNumber(page);
      setHasMore(!result.isLast);
    } catch (cause: unknown) {
      if (requestId === requestIdRef.current && search === activeQueryRef.current) {
        setError(cause instanceof Error ? cause.message : 'Could not load time zones');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        pageRequestRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const search = query.trim();
    activeQueryRef.current = search;
    requestIdRef.current += 1;
    pageRequestRef.current = false;
    setOptions([]);
    setPageNumber(0);
    setHasMore(true);
    setError('');
    const timer = window.setTimeout(() => {
      void loadPage(search, 1, true);
    }, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, query, loadPage]);

  useEffect(() => {
    if (!open) return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !error && pageNumber > 0) {
          void loadPage(activeQueryRef.current, pageNumber + 1, false);
        }
      },
      { root, rootMargin: '0px 0px 48px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, loading, error, pageNumber, loadPage]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const openList = () => {
    if (disabled || readOnly || open) return;
    setQuery('');
    setOpen(true);
  };

  const select = (option: TimeZoneOption) => {
    onChange(option.timezoneId);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="clinic-timezone"
          role="combobox"
          aria-label="Time zone"
          aria-expanded={open}
          aria-controls="clinic-timezone-options"
          aria-autocomplete="list"
          value={open ? query : value}
          readOnly={!open || readOnly}
          disabled={disabled}
          autoComplete="off"
          placeholder="Search time zones"
          className="pl-9"
          onFocus={openList}
          onClick={openList}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        />
      </div>

      {open && (
        <div
          id="clinic-timezone-options"
          role="listbox"
          aria-label="Time zones"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option.timezoneId}
                type="button"
                role="option"
                aria-selected={value === option.timezoneId}
                className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                onClick={() => select(option)}
              >
                {option.displayName}
              </button>
            ))}
            <div ref={sentinelRef} aria-hidden="true" />
            {loading && (
              <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading time zones…
              </div>
            )}
            {!loading && error && (
              <div className="space-y-2 px-3 py-3 text-center text-sm" role="alert">
                <p className="text-destructive">{error}</p>
                <button
                  type="button"
                  className="font-medium underline underline-offset-4"
                  onClick={() => void loadPage(activeQueryRef.current, pageNumber ? pageNumber + 1 : 1, !pageNumber)}
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && options.length === 0 && (
              <p className="px-3 py-3 text-center text-sm text-muted-foreground">
                No time zones found.
              </p>
            )}
            {!loading && !error && options.length > 0 && !hasMore && (
              <p className="px-3 py-3 text-center text-xs text-muted-foreground" role="status">
                You’ve reached the end of the time zone list.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
