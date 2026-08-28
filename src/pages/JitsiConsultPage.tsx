import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBookingVideo, type VideoJoinInfo } from '@/services/visitService';

export default function JitsiConsultPage() {
  const { bookingUuid } = useParams<{ bookingUuid: string }>();
  const location = useLocation();
  const portal = location.pathname.startsWith('/doctor') ? 'doctor' : 'parent';
  const backTo = portal === 'doctor' ? '/doctor/appointments' : '/app/appointments';
  const [info, setInfo] = useState<VideoJoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  useEffect(() => {
    if (!bookingUuid) return;
    let cancelled = false;
    setLoading(true);
    void fetchBookingVideo(bookingUuid, portal)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Could not start the video consult');
          setInfo(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUuid, portal]);

  const joinUrl = info?.joinUrl;
  const iframeSrc = joinUrl
    ? `${joinUrl}#userInfo.displayName="${encodeURIComponent(info.displayName || 'Kittyp')}"`
    : '';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backTo} aria-label="Back to appointments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Video consult</h1>
            <p className="text-sm text-muted-foreground">
              Same Jitsi room for you and the other person on this booking.
            </p>
          </div>
        </div>
        {joinUrl ? (
          <Button asChild>
            <a href={joinUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in new window
            </a>
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !joinUrl ? (
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
      ) : (
        <div className="space-y-3">
          {iframeBlocked ? (
            <Card>
              <CardContent className="py-10 text-center space-y-3">
                <Video className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Your browser blocked the embedded call. Open it in a new window to join.
                </p>
                <Button asChild>
                  <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                    Join video consult
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg overflow-hidden border bg-black min-h-[70vh]">
              <iframe
                title="Kittyp video consult"
                src={iframeSrc}
                className="w-full h-[70vh] border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                allowFullScreen
                onError={() => setIframeBlocked(true)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
