import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User, Loader2 } from 'lucide-react';
import { ProfilePictureUpload } from '@/components/ui/FileUpload';
import { Author, SaveAuthor } from '@/pages/Interface/PagesInterface';
import { fetchAuthors, createAuthors } from '@/services/authorService';
import { useToast } from '@/hooks/use-toast';

interface AuthorSelectorProps {
  selectedAuthor: Author | null;
  onAuthorChange: (author: Author | null) => void;
  disabled?: boolean;
}

export function AuthorSelector({ selectedAuthor, onAuthorChange, disabled = false }: AuthorSelectorProps) {
  const [authors, setAuthors] = React.useState<Author[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAddingAuthor, setIsAddingAuthor] = React.useState(false);
  const [isCreatingAuthor, setIsCreatingAuthor] = React.useState(false);
  const [newAuthor, setNewAuthor] = React.useState<SaveAuthor>({
    name: '',
    role: '',
    avatar: ''
  });
  const { toast } = useToast();

  // Fetch authors on component mount
  React.useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAuthors({ page: 0, size: 100 });
      console.log('Authors API response:', response);
      if (response.success) {
        // Ensure all author IDs are strings
        const authorsWithStringIds = response.data.models.map(author => ({
          ...author,
          id: author.id.toString()
        }));
        console.log('Processed authors:', authorsWithStringIds);
        setAuthors(authorsWithStringIds);
      } else {
        toast.error("Failed to load authors");
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      toast.error("Failed to load authors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAuthor = async () => {
    if (newAuthor.name && newAuthor.role) {
      setIsCreatingAuthor(true);
      try {
        const response = await createAuthors(newAuthor);
        if (response.success) {
          const createdAuthor = {
            ...response.data,
            id: response.data.id.toString()
          };
          setAuthors(prev => [...prev, createdAuthor]);
          onAuthorChange(createdAuthor);
          setNewAuthor({ name: '', role: '', avatar: '' });
          setIsAddingAuthor(false);
          toast.success("Author created successfully");
        } else {
          toast.error(response.message || "Failed to create author");
        }
      } catch (error) {
        console.error('Error creating author:', error);
        toast.error("Failed to create author");
      } finally {
        setIsCreatingAuthor(false);
      }
    }
  };

  const handleProfilePictureUpload = (url: string) => {
    setNewAuthor({ ...newAuthor, avatar: url });
  };

  const handleProfilePictureError = (error: string) => {
    console.error('Profile picture upload error:', error);
    toast.error("Failed to upload profile picture");
  };

  return (
    <div className="grid gap-2">
      <Label>Author</Label>
      <div className="flex gap-2">
        <Select
          value={selectedAuthor?.id || ''}
          onValueChange={(value) => {
            console.log('AuthorSelector onValueChange called with:', value);
            console.log('Available authors:', authors);
            const author = authors.find(a => a.id === value);
            console.log('Found author:', author);
            onAuthorChange(author || null);
          }}
          disabled={isLoading || disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={
              disabled ? "Author cannot be changed when editing" : 
              isLoading ? "Loading authors..." : 
              "Select an author"
            }>
              {selectedAuthor && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <img src={selectedAuthor.avatar} alt={selectedAuthor.name} />
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{selectedAuthor.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAuthor.role}</p>
                  </div>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading authors...</span>
              </div>
            ) : authors.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No authors found
              </div>
            ) : (
              authors.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <img src={author.avatar} alt={author.name} />
                    </Avatar>
                    <div>
                      <p className="font-medium">{author.name}</p>
                      <p className="text-xs text-muted-foreground">{author.role}</p>
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedAuthor && !disabled && (
          <Button 
            variant="outline" 
            size="icon" 
            className="flex-shrink-0"
            onClick={() => onAuthorChange(null)}
            title="Clear selection"
          >
            <User className="h-4 w-4" />
          </Button>
        )}
        <Dialog open={isAddingAuthor} onOpenChange={setIsAddingAuthor}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0" disabled={disabled}>
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Author</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="author-name">Name</Label>
                <Input
                  id="author-name"
                  value={newAuthor.name}
                  onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })}
                  placeholder="Dr. John Smith"
                  disabled={isCreatingAuthor}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author-role">Role/Title</Label>
                <Input
                  id="author-role"
                  value={newAuthor.role}
                  onChange={(e) => setNewAuthor({ ...newAuthor, role: e.target.value })}
                  placeholder="Veterinarian"
                  disabled={isCreatingAuthor}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author-avatar">Profile Picture</Label>
                <ProfilePictureUpload
                  onUploadComplete={handleProfilePictureUpload}
                  onUploadError={handleProfilePictureError}
                  className="w-full"
                  disabled={isCreatingAuthor}
                />
                {newAuthor.avatar && (
                  <div className="mt-2">
                    <Avatar className="h-16 w-16">
                      <img src={newAuthor.avatar} alt="Preview" />
                    </Avatar>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingAuthor(false)}
                disabled={isCreatingAuthor}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddAuthor}
                disabled={isCreatingAuthor || !newAuthor.name || !newAuthor.role}
              >
                {isCreatingAuthor ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Author'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedAuthor && (
        <Card className="mt-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <img src={selectedAuthor.avatar} alt={selectedAuthor.name} />
              </Avatar>
              <div>
                <p className="font-medium">{selectedAuthor.name}</p>
                <p className="text-sm text-muted-foreground">{selectedAuthor.role}</p>
                <p className="text-xs text-green-600 dark:text-green-400">✓ Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}