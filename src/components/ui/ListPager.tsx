import { Button } from '@/components/ui/button';

type Props = {
  page: number;
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  noun?: string;
};

/** Numbered prev/next pager for lookup lists (invoices, patients, admin tables). */
export function ListPager({
  page,
  totalPages,
  totalElements,
  onPageChange,
  disabled,
  noun = 'results',
}: Props) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <p className="text-xs text-muted-foreground">
        {totalElements != null ? `${totalElements} ${noun}` : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

type LoadMoreProps = {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
};

/** Append-next-page control for chronological feeds. */
export function LoadMoreButton({ hasMore, loading, onLoadMore }: LoadMoreProps) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-1">
      <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onLoadMore}>
        {loading ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  );
}
