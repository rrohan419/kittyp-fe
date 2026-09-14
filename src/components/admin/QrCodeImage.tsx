import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';


export function QrCodeImage({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setSrc(null);
    void toDataURL(value, {
      width: 224,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (failed) {
    return (
      <p className="text-sm text-destructive">Could not draw QR. Copy the setup key instead.</p>
    );
  }
  if (!src) {
    return <div className="h-56 w-56 rounded-md bg-muted animate-pulse" aria-hidden />;
  }
  return (
    <img
      src={src}
      alt={label}
      width={224}
      height={224}
      className="rounded-md border border-border bg-white p-2"
    />
  );
}
