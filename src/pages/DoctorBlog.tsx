import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DoctorBlog() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write and publish articles to build your independent brand.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/articles">
            <Plus className="h-4 w-4 mr-1.5" />
            Browse public articles
          </Link>
        </Button>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Authoring workspace
          </CardTitle>
          <CardDescription>
            Doctor article create/edit APIs are being enabled. Use the public articles feed for now; draft/publish
            tools will attach to your doctor author profile next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/ai-assistant">Open AI Assistant for content ideas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
