import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Phone, Stethoscope } from 'lucide-react';
import { RootState } from '@/module/store/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ackIncomingVideoCall, fetchIncomingVideoCall, type IncomingVideoCall } from '@/services/visitService';
import { hasAuthToken } from '@/utils/authStorage';
import {
  incomingCallerLabel,
  incomingCallerPhotoUrl,
  shouldShowIncomingVideoCall,
} from '@/utils/consult';

export const INCOMING_VIDEO_EVENT = 'kittyp-incoming-video';

export function notifyIncomingVideoRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(INCOMING_VIDEO_EVENT));
  }
}

export function IncomingVideoCallModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.authReducer.isAuthenticated);
  const [incoming, setIncoming] = useState<IncomingVideoCall | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !hasAuthToken()) {
      setIncoming(null);
      return;
    }
    try {
      const next = await fetchIncomingVideoCall();
      if (next && shouldShowIncomingVideoCall(location.pathname, next.joinPath)) {
        setIncoming(next);
      } else {
        setIncoming(null);
      }
    } catch {
      /* poll quietly */
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !hasAuthToken()) {
      setIncoming(null);
      return;
    }
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 4000);
    const onPush = () => {
      void refresh();
    };
    window.addEventListener(INCOMING_VIDEO_EVENT, onPush);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(INCOMING_VIDEO_EVENT, onPush);
    };
  }, [isAuthenticated, refresh]);

  const visible = incoming != null && shouldShowIncomingVideoCall(location.pathname, incoming.joinPath);
  const photoUrl = incomingCallerPhotoUrl(incoming?.callerPhotoUrl);

  const handleDismiss = async () => {
    const uuid = incoming?.bookingUuid;
    setIncoming(null);
    if (!uuid) return;
    try {
      await ackIncomingVideoCall(uuid);
    } catch {
      /* ignore */
    }
  };

  const handleJoin = async () => {
    const path = incoming?.joinPath;
    const uuid = incoming?.bookingUuid;
    setIncoming(null);
    if (uuid) {
      try {
        await ackIncomingVideoCall(uuid);
      } catch {
        /* still join */
      }
    }
    if (path) {
      navigate(path);
    }
  };

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) void handleDismiss();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center gap-3 pt-1">
          <Avatar className="h-20 w-20">
            {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
            <AvatarFallback className="bg-muted">
              <Stethoscope className="h-8 w-8 text-muted-foreground" aria-hidden />
            </AvatarFallback>
          </Avatar>
          <DialogHeader className="space-y-1">
            <DialogTitle>{incomingCallerLabel(incoming?.callerName)}</DialogTitle>
            <DialogDescription>Incoming video consult</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => void handleDismiss()}>
            Dismiss
          </Button>
          <Button onClick={() => void handleJoin()}>
            <Phone className="h-4 w-4" />
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
