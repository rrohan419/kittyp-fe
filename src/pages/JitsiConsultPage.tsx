import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/config/env';
import {
  endDoctorVideo,
  fetchBookingVideo,
  fetchBookingVideoLive,
  heartbeatDoctorVideo,
  type VideoJoinInfo,
} from '@/services/visitService';
import { getAuthItem } from '@/utils/authStorage';
import { parseApiErrorMessage } from '@/utils/validation';
import { isVideoJoinWindowClosed } from '@/utils/consult';

type JitsiApi = {
  addListener: (event: string, listener: () => void) => void;
  executeCommand: (command: string, ...args: string[]) => void;
  dispose: () => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

function loadJitsiScript(domain: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Jitsi is only available in the browser'));
  }
  const host = domain || 'meet.element.io';
  const src = `https://${host}/external_api.js`;
  const marker = `kittyp-jitsi-${host}`;
  if (window.JitsiMeetExternalAPI && document.querySelector(`script[data-kittyp-jitsi="${marker}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-kittyp-jitsi="${marker}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Jitsi')));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.kittypJitsi = marker;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Jitsi'));
    document.body.appendChild(script);
  });
}

function endDoctorCallKeepalive(bookingUuid: string) {
  const token = getAuthItem('access_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const base = API_BASE_URL || '';
  void fetch(`${base}/doctor/bookings/${bookingUuid}/video/end`, {
    method: 'POST',
    headers,
    keepalive: true,
  });
}

export default function JitsiConsultPage() {
  const { bookingUuid } = useParams<{ bookingUuid: string }>();
  const location = useLocation();
  const portal = location.pathname.startsWith('/doctor') ? 'doctor' : 'parent';
  const backTo = portal === 'doctor' ? '/doctor/appointments' : '/app/appointments';
  const meetRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const endedByDoctorRef = useRef(false);
  const [info, setInfo] = useState<VideoJoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [windowClosed, setWindowClosed] = useState(false);

  useEffect(() => {
    if (!bookingUuid) return;
    let cancelled = false;
    setLoading(true);
    setWaiting(false);
    setEnded(false);
    setWindowClosed(false);
    endedByDoctorRef.current = false;
    void fetchBookingVideo(bookingUuid, portal)
      .then((data) => {
        if (!cancelled) {
          setInfo(data);
          setWaiting(false);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = parseApiErrorMessage(e, '');
        if (axios.isAxiosError(e) && e.response?.status === 409 && isVideoJoinWindowClosed(msg)) {
          setInfo(null);
          setWaiting(false);
          setWindowClosed(true);
          return;
        }
        if (portal === 'parent' && axios.isAxiosError(e) && e.response?.status === 409) {
          setInfo(null);
          setWaiting(true);
          return;
        }
        toast.error(parseApiErrorMessage(e, 'Could not start the video consult'));
        setInfo(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUuid, portal]);

  useEffect(() => {
    if (portal !== 'parent' || !bookingUuid || ended) return;
    if (!waiting && !info) return;
    const id = window.setInterval(() => {
      void fetchBookingVideoLive(bookingUuid, 'parent')
        .then((status) => {
          if (!status.joinOpen) {
            setWindowClosed(true);
            setWaiting(false);
            if (info) {
              return;
            }
            setInfo(null);
            return;
          }
          if (status.live) {
            if (waiting) {
              setLoading(true);
              void fetchBookingVideo(bookingUuid, 'parent')
                .then((data) => {
                  setInfo(data);
                  setWaiting(false);
                })
                .catch((e: unknown) => {
                  const msg = parseApiErrorMessage(e, '');
                  if (axios.isAxiosError(e) && e.response?.status === 409 && isVideoJoinWindowClosed(msg)) {
                    setWindowClosed(true);
                    setWaiting(false);
                    return;
                  }
                  toast.error(parseApiErrorMessage(e, 'Could not join the video consult'));
                })
                .finally(() => setLoading(false));
            }
            return;
          }
          if (info) {
            endedByDoctorRef.current = true;
            try {
              apiRef.current?.executeCommand('hangup');
            } catch {
              /* already gone */
            }
            setEnded(true);
            setInfo(null);
          }
        })
        .catch(() => {
          /* poll quietly */
        });
    }, 4000);
    return () => window.clearInterval(id);
  }, [bookingUuid, portal, waiting, info, ended]);

  useEffect(() => {
    if (portal !== 'doctor' || !bookingUuid || !info || ended) return;
    void heartbeatDoctorVideo(bookingUuid).catch(() => {
      /* first beat best-effort */
    });
    const id = window.setInterval(() => {
      void heartbeatDoctorVideo(bookingUuid).catch(() => {
        /* keep trying */
      });
    }, 8000);
    const onHide = () => endDoctorCallKeepalive(bookingUuid);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', onHide);
    };
  }, [bookingUuid, portal, info, ended]);

  useEffect(() => {
    if (!info || !meetRef.current || ended) return;
    let cancelled = false;
    let api: JitsiApi | null = null;
    void loadJitsiScript(info.domain || 'meet.element.io')
      .then(() => {
        if (cancelled || !meetRef.current || !window.JitsiMeetExternalAPI) return;
        meetRef.current.innerHTML = '';
        const displayName = info.displayName || 'Kittyp';
        const domain = info.domain || 'meet.element.io';
        api = new window.JitsiMeetExternalAPI(domain, {
          roomName: info.roomName,
          parentNode: meetRef.current,
          userInfo: { displayName },
          width: '100%',
          height: '100%',
          configOverwrite: {
            prejoinPageEnabled: false,
            prejoinConfig: { enabled: false },
            disableProfile: true,
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
            hideEmailInSettings: true,
          },
          interfaceConfigOverwrite: {
            AUTHENTICATION_ENABLE: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          },
        });
        apiRef.current = api;
        api.addListener('videoConferenceJoined', () => {
          try {
            api?.executeCommand('displayName', displayName);
          } catch {
            /* name already set */
          }
        });
        const onLeft = () => {
          if (portal === 'doctor' && !endedByDoctorRef.current && bookingUuid) {
            endedByDoctorRef.current = true;
            void endDoctorVideo(bookingUuid).catch(() => {
              /* already ended */
            });
            setEnded(true);
            setInfo(null);
          }
        };
        api.addListener('videoConferenceLeft', onLeft);
        api.addListener('readyToClose', onLeft);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Could not load Jitsi');
        }
      });
    return () => {
      cancelled = true;
      try {
        api?.dispose();
      } catch {
        /* ignore */
      }
      apiRef.current = null;
    };
  }, [info, ended, portal, bookingUuid]);

  const handleDoctorBack = () => {
    if (portal !== 'doctor' || !bookingUuid || endedByDoctorRef.current) return;
    endedByDoctorRef.current = true;
    void endDoctorVideo(bookingUuid).catch(() => {
      /* leaving anyway */
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backTo} aria-label="Back to appointments" onClick={handleDoctorBack}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Video consult</h1>
            <p className="text-sm text-muted-foreground">
              {portal === 'doctor'
                ? 'You host this call. Leaving ends it for everyone.'
                : 'Join while the doctor is on the call. You can leave and come back.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : ended ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call ended</CardTitle>
            <CardDescription>The doctor ended this video consult.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : info ? (
        <div className="rounded-lg overflow-hidden border bg-black min-h-[70vh]">
          <div ref={meetRef} className="w-full h-[70vh]" />
        </div>
      ) : windowClosed ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join window closed</CardTitle>
            <CardDescription>
              Video join closes 30 minutes after the appointment start. The doctor can start early if they are free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : waiting ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Waiting for the doctor
            </CardTitle>
            <CardDescription>Join video unlocks when the doctor starts the call.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video room unavailable</CardTitle>
            <CardDescription>
              This appointment may be in-person, cancelled, or you may not be on the booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
