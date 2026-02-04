import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetBannedWords, useSetBannedWords, useIsCallerAdmin, useRerunModerationAll } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, X, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function BannedWordsAdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: bannedWords, isLoading: wordsLoading } = useGetBannedWords();
  const setBannedWords = useSetBannedWords();
  const rerunModerationAll = useRerunModerationAll();

  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    if (bannedWords) {
      setWords(bannedWords);
    }
  }, [bannedWords]);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      toast.error('Access denied: Admin only');
      navigate({ to: '/' });
    }
  }, [isAdmin, isAdminLoading, navigate]);

  const handleAddWord = () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) {
      toast.error('Word cannot be empty');
      return;
    }
    if (words.includes(trimmed)) {
      toast.error('Word already exists');
      return;
    }
    setWords([...words, trimmed]);
    setNewWord('');
  };

  const handleRemoveWord = (word: string) => {
    setWords(words.filter((w) => w !== word));
  };

  const handleSave = async () => {
    try {
      await setBannedWords.mutateAsync(words);
      toast.success('Banned words updated successfully');
    } catch (error) {
      toast.error('Failed to update banned words');
    }
  };

  const handleRerunAll = async () => {
    try {
      await rerunModerationAll.mutateAsync();
      toast.success('All videos re-scanned successfully');
    } catch (error) {
      toast.error('Failed to re-scan videos');
    }
  };

  if (isAdminLoading || wordsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Content Moderation</h1>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Banned Words Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Videos containing these words in their title or description will be automatically blocked from playback.
              </p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a banned word..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddWord();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddWord} disabled={!newWord.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Current Banned Words ({words.length})
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={setBannedWords.isPending}
                >
                  {setBannedWords.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>

              {words.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No banned words configured. Add words above to start filtering content.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-wrap gap-2 rounded-lg border p-4 bg-background">
                  {words.map((word) => (
                    <Badge
                      key={word}
                      variant="destructive"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {word}
                      <button
                        onClick={() => handleRemoveWord(word)}
                        className="ml-1 hover:bg-destructive-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Re-scan All Videos</p>
                  <p className="text-sm text-muted-foreground">
                    Apply the current banned words list to all existing videos. This will update moderation status for all content.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleRerunAll}
                disabled={rerunModerationAll.isPending}
                className="w-full"
              >
                {rerunModerationAll.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-scanning...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-scan All Videos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
