import { MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WhatsAppBusinessPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kittyp messaging account</h1>
        <p className="text-sm text-muted-foreground">
          Outgoing clinic and personal-practice communications use Kittyp&apos;s WhatsApp Business account.
        </p>
      </header>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            No separate connection needed
          </CardTitle>
          <CardDescription>
            You do not need to connect your clinic or personal WhatsApp number to send messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Messaging shows the templates approved for Kittyp&apos;s account.</p>
          <p>Billing sends invoice PDFs using Kittyp&apos;s approved invoice document template.</p>
          <p>Sender credentials and template approvals are managed by Kittyp.</p>
        </CardContent>
      </Card>
    </div>
  );
}
