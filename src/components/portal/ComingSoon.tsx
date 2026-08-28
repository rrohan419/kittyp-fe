import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ComingSoonProps {
  title?: string;
  backTo?: string;
}

export default function ComingSoon({ title = 'Coming Soon', backTo = '/' }: ComingSoonProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>The page is not available yet. We are building it for you.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className={cn('text-sm text-muted-foreground')}>
            This section is coming soon. If you were expecting to use this page, you can go back to the previous area and check again later.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link to={backTo}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
