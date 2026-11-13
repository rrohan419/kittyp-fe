import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { DoctorSmartPhrase } from '@/services/doctorSmartPhraseService';

type DoctorSmartPhrasesManagerProps = {
  phrases: DoctorSmartPhrase[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onClearError: () => void;
  onCreate: (text: string) => Promise<boolean>;
  onUpdate: (uuid: string, text: string) => Promise<boolean>;
  onDelete: (uuid: string) => Promise<boolean>;
};

export function DoctorSmartPhrasesManager({
  phrases,
  loading,
  saving,
  error,
  onClearError,
  onCreate,
  onUpdate,
  onDelete,
}: DoctorSmartPhrasesManagerProps) {
  const [newPhrase, setNewPhrase] = useState('');
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  const saveNewPhrase = async () => {
    if (!newPhrase.trim()) return;
    if (await onCreate(newPhrase.trim())) setNewPhrase('');
  };

  const saveEdit = async () => {
    if (!editingUuid || !editingText.trim()) return;
    if (await onUpdate(editingUuid, editingText.trim())) {
      setEditingUuid(null);
      setEditingText('');
    }
  };

  const confirmDelete = async () => {
    if (!deleteUuid) return;
    if (await onDelete(deleteUuid)) setDeleteUuid(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My smart phrases</CardTitle>
          <CardDescription>
            Manage reusable text available in your clinic and personal-practice charts. These phrases are private to your doctor account; do not save patient-specific details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <label htmlFor="smart-phrase-new" className="text-sm font-medium">
              Add a phrase
            </label>
            <Textarea
              id="smart-phrase-new"
              value={newPhrase}
              onChange={(event) => setNewPhrase(event.target.value)}
              maxLength={4000}
              rows={3}
              placeholder="Write reusable text"
            />
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={() => void saveNewPhrase()} disabled={saving || !newPhrase.trim()}>
                <Plus className="h-4 w-4" />
                Save phrase
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Saved phrases</h3>
            {loading ? <p className="text-sm text-muted-foreground">Loading phrases…</p> : null}
            {!loading && phrases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No phrases saved yet.</p>
            ) : null}
            <ul className="space-y-2">
              {phrases.map((phrase) => (
                <li key={phrase.uuid} className="rounded-md border p-3">
                  {editingUuid === phrase.uuid ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        maxLength={4000}
                        rows={3}
                        aria-label="Edit saved phrase"
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingUuid(null)}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" onClick={() => void saveEdit()} disabled={saving || !editingText.trim()}>
                          Save changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm">{phrase.phraseText}</p>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        aria-label="Edit phrase"
                        onClick={() => {
                          setEditingUuid(phrase.uuid);
                          setEditingText(phrase.phraseText);
                          onClearError();
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-destructive"
                        aria-label="Delete phrase"
                        onClick={() => setDeleteUuid(phrase.uuid)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteUuid} onOpenChange={(isOpen) => !isOpen && setDeleteUuid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this phrase?</AlertDialogTitle>
            <AlertDialogDescription>This removes it from your saved phrases.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
