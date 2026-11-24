import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ClinicEmailUsage, fetchClinicEmailUsage } from '@/services/clinicService';

function emailTypeLabel(value: string) {
  return value
    .replace(/^(ZEPTO|ZOHO)_/, '')
    .replace(/_(EMAIL_)?TEMPLATE_ID$/, '')
    .replace(/_+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateTimeLabel(value: string) {
  return new Date(value).toLocaleString();
}

export default function ClinicEmailUsagePage({ embedded = false }: { embedded?: boolean }) {
  const { clinic, clinicUuid, isPersonalPractice, loading: clinicLoading } = useActiveClinic();
  const location = useLocation();
  const doctorPortal = location.pathname.startsWith('/doctor');
  const [usage, setUsage] = useState<ClinicEmailUsage | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageNumber(0);
  }, [clinicUuid]);

  useEffect(() => {
    if (!clinicUuid || (doctorPortal && !isPersonalPractice)) {
      setUsage(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void fetchClinicEmailUsage(clinicUuid, pageNumber)
      .then((result) => {
        if (active) setUsage(result);
      })
      .catch(() => {
        if (active) setError('Email usage could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clinicUuid, doctorPortal, isPersonalPractice, pageNumber]);

  const usedPercent = usage
    ? Math.min(100, (usage.sentThisMonth / usage.monthlyAllowance) * 100)
    : 0;

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 p-4 md:p-6'}>
      <header>
        {embedded
          ? <h2 className="text-xl font-semibold">Email details</h2>
          : <h1 className="text-2xl font-semibold">Email usage</h1>}
        <p className="mt-1 text-sm text-muted-foreground">
          {clinic?.name ?? 'Your practice'} receives 2,000 free email credits each month.
          Unused credits reset at 00:00 UTC on the first of the month.
        </p>
      </header>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {doctorPortal && !isPersonalPractice && (
        <p className="text-sm text-muted-foreground">
          Email credit usage is available to the owner of a personal practice.
        </p>
      )}

      {(loading || clinicLoading) && !usage && (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading email usage...</p>
      )}
      {!clinicUuid && !clinicLoading && (
        <p className="text-sm text-muted-foreground">No practice account is selected.</p>
      )}

      {usage && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Monthly allowance</CardDescription>
                <CardTitle>{usage.monthlyAllowance.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Resets {new Date(`${usage.nextResetDate}T00:00:00`).toLocaleDateString()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Accepted this month</CardDescription>
                <CardTitle>{usage.sentThisMonth.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Monthly email credits used"
                  aria-valuemin={0}
                  aria-valuemax={usage.monthlyAllowance}
                  aria-valuenow={usage.sentThisMonth}
                >
                  <div className="h-full bg-primary" style={{ width: `${usedPercent}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Available</CardDescription>
                <CardTitle>{usage.availableCredits.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {usage.reservedThisMonth > 0
                  ? `${usage.reservedThisMonth} email${usage.reservedThisMonth === 1 ? '' : 's'} currently sending`
                  : 'Failed sends do not use credits'}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email activity
              </CardTitle>
              <CardDescription>
                Account emails such as invoices, invitations, reminders, and practice messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading email activity…</p>
              ) : usage.activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No email activity yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Recipient</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.activities.map((activity) => (
                        <tr key={activity.id} className="border-b last:border-0">
                          <td className="whitespace-nowrap px-3 py-3">{dateTimeLabel(activity.createdAt)}</td>
                          <td className="px-3 py-3">{emailTypeLabel(activity.emailType)}</td>
                          <td className="px-3 py-3">{activity.recipientEmail}</td>
                          <td className="px-3 py-3">
                            <span className="capitalize">{activity.status.toLowerCase()}</span>
                            {activity.failureCode && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({activity.failureCode.toLowerCase().replace(/_/g, ' ')})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {usage.totalElements.toLocaleString()} email activities
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageNumber === 0 || loading}
                    onClick={() => setPageNumber((current) => Math.max(0, current - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {usage.totalPages === 0 ? 0 : pageNumber + 1} / {usage.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageNumber + 1 >= usage.totalPages || loading}
                    onClick={() => setPageNumber((current) => current + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
