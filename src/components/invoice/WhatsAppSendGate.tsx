import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Wraps a disabled WhatsApp action and explains that the practice must connect WhatsApp first. */
export function WhatsAppSendGate({
  blocked,
  checking,
  configureTo,
  children,
}: {
  blocked: boolean;
  checking?: boolean;
  /** Set only when this user can open WhatsApp settings. */
  configureTo?: string;
  children: ReactNode;
}) {
  if (!blocked) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{children}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1.5">
        {checking ? (
          <p>Checking whether WhatsApp is connected.</p>
        ) : (
          <>
            <p>
              {configureTo
                ? 'WhatsApp is not connected for this practice, so the invoice cannot be sent.'
                : 'WhatsApp is not connected for this clinic. Ask the clinic admin to connect it before invoices can be sent.'}
            </p>
            {configureTo ? (
              <Link to={configureTo} className="font-medium underline">
                Configure WhatsApp
              </Link>
            ) : null}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
