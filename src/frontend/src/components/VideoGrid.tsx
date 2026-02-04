import { useNavigate } from '@tanstack/react-router';
import type { VideoMetadata } from '../backend';
import { VideoStatus } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useGetUserProfile, useDeleteVideo, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Play, Heart, Trash2, Loader2 } from 'lucide-react';
import ShareButton from './ShareButton';
import { useState } from 'react';
import { toast } from 'sonner';

interface VideoCardProps {
  video: VideoMetadata;
}

function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate();
  const { data: uploaderProfile } = useGetUserProfile(video.uploader.toString());
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteVideo = useDeleteVideo();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const uploaderName = uploaderProfile?.name || 'Anonymous';
  const uploadDate = new Date(Number(video.timestamp) / 1000000);
  const likeCount = Number(video.likeCount);

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const isVideoOwner = currentUserPrincipal === video.uploader.toString();
  const canDelete = isVideoOwner || isAdmin;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on share button or delete button
    if (
      (e.target as HTMLElement).closest('[data-share-button]') ||
      (e.target as HTMLElement).closest('[data-delete-button]')
    ) {
      return;
    }
    navigate({ to: '/video/$videoId', params: { videoId: video.id } });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteVideo.mutateAsync(video.id);
      toast.success('Video deleted successfully');
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      if (error.message?.includes('Can only delete your own')) {
        toast.error('You can only delete your own videos');
      } else if (error.message?.includes('Unauthorized')) {
        toast.error('You do not have permission to delete this video');
      } else {
        toast.error('Failed to delete video');
      }
      setShowDeleteDialog(false);
    }
  };

  // Use custom thumbnail if available, otherwise use default
  const thumbnailUrl = video.thumbnail
    ? video.thumbnail.getDirectURL()
    : '/assets/generated/default-video-thumbnail.dim_320x180.png';

  // Determine status badge text and variant
  const getStatusBadge = () => {
    if (video.status === VideoStatus.processing) {
      return { text: 'Processing', variant: 'secondary' as const };
    }
    if (video.status === VideoStatus.uploading) {
      return { text: 'Uploading', variant: 'secondary' as const };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <Card
        className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
        onClick={handleCardClick}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-primary p-3">
              <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
            </div>
          </div>
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            {video.category && video.category !== 'Uncategorized' && (
              <Badge variant="secondary" className="text-xs shadow-lg">
                {video.category}
              </Badge>
            )}
            {statusBadge && (
              <Badge variant={statusBadge.variant} className="text-xs shadow-lg">
                {statusBadge.text}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 md:p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold leading-tight md:mb-2">{video.title}</h3>
          
          {/* Desktop Layout - Unchanged */}
          <div className="hidden md:flex md:items-center md:justify-between md:gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {uploaderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-muted-foreground">{uploaderName}</p>
                <p className="text-xs text-muted-foreground">{uploadDate.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 fill-primary text-primary" />
                <span className="font-medium">{likeCount}</span>
              </div>
              <div data-share-button onClick={(e) => e.stopPropagation()}>
                <ShareButton
                  videoId={video.id}
                  videoTitle={video.title}
                  variant="ghost"
                  size="icon"
                  showLabel={false}
                />
              </div>
              {canDelete && (
                <div data-delete-button onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteClick}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Delete video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout - Compact with single icon bar */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {uploaderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-muted-foreground">{uploaderName}</p>
              </div>
            </div>
            
            {/* Compact icon bar for mobile */}
            <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-medium">{likeCount}</span>
                </div>
                <span>{uploadDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <div data-share-button onClick={(e) => e.stopPropagation()} className="[&_button]:h-7 [&_button]:w-7">
                  <ShareButton
                    videoId={video.id}
                    videoTitle={video.title}
                    variant="ghost"
                    size="icon"
                    showLabel={false}
                  />
                </div>
                {canDelete && (
                  <div data-delete-button onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteClick}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Delete video"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{video.title}"? This action cannot be undone. All
              comments and likes associated with this video will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVideo.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteVideo.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVideo.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface VideoGridProps {
  videos: VideoMetadata[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
