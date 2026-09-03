import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  compact?: boolean;
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AuthorSelector({
  selectedAuthor,
  onAuthorChange,
  disabled = false,
  compact = false,
}: AuthorSelectorProps) {
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
      if (response.success) {
        // Ensure all author IDs are strings
        const authorsWithStringIds = response.data.models.map(author => ({
          ...author,
          id: author.id.toString()
        }));
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
    <div className={compact ? 'min-w-[11rem]' : 'grid gap-2'}>
      {!compact && <Label>Author</Label>}
      <div className="flex gap-2">
        <Select
          value={selectedAuthor?.id || ''}
          onValueChange={(value) => {
            const author = authors.find(a => a.id === value);
            onAuthorChange(author || null);
          }}
          disabled={isLoading || disabled}
        >
          <SelectTrigger className={compact ? 'h-7 w-auto min-w-0 gap-1.5 border-0 bg-transparent px-2 shadow-none text-primary focus:ring-0' : 'flex-1'}>
            <SelectValue placeholder={
              disabled ? "Author locked" :
              isLoading ? "Loading…" :
              "Author"
            }>
              {selectedAuthor && (
                <div className="flex items-center gap-1.5">
                  <Avatar className={compact ? 'h-5 w-5' : 'h-6 w-6'}>
                    {selectedAuthor.avatar ? (
                      <AvatarImage src={selectedAuthor.avatar} alt={selectedAuthor.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {authorInitials(selectedAuthor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className={compact ? 'text-xs text-muted-foreground' : 'text-left'}>
                    {compact ? (
                      <span className="text-xs font-medium text-primary">
                        {selectedAuthor.name}
                        {selectedAuthor.role ? ` · ${selectedAuthor.role}` : ''}
                      </span>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{selectedAuthor.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedAuthor.role}</p>
                      </>
                    )}
                  </span>
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
                      {author.avatar ? <AvatarImage src={author.avatar} alt={author.name} /> : null}
                      <AvatarFallback className="text-xs">{authorInitials(author.name)}</AvatarFallback>
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

        {!compact && selectedAuthor && !disabled && (
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
        {!compact && (
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
                      <AvatarImage src={newAuthor.avatar} alt="Preview" />
                      <AvatarFallback>{authorInitials(newAuthor.name || 'NA')}</AvatarFallback>
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
        )}
      </div>
    </div>
  );
}