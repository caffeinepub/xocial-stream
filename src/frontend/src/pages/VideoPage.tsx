import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  useGetVideo,
  useGetUserProfile,
  useLikeVideo,
  useUnlikeVideo,
  useGetComments,
  useAddComment,
  useDeleteComment,
  useUpdateThumbnail,
  useIsCallerAdmin,
  useDeleteVideo,
  useGetVideoProgress,
  useSaveVideoProgress,
  useGetModerationResult,
  useOverrideModerationStatus,
  useRerunModeration,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCoarsePointer } from '../hooks/useIsCoarsePointer';
import { useVideoPinchPan } from '../hooks/useVideoPinchPan';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar, Heart, Trash2, Loader2, Tag, Upload, Image as ImageIcon, Shield, AlertTriangle, RefreshCw, CheckCircle, XCircle, ZoomIn, ZoomOut, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import ShareButton from '../components/ShareButton';
import { ThumbnailType } from '../backend';

export default function VideoPage() {
  const { videoId } = useParams({ from: '/video/$videoId' });
  const navigate = useNavigate();
  const { data: video, isLoading } = useGetVideo(videoId);
  const { data: uploaderProfile } = useGetUserProfile(video?.uploader.toString() || '');
  const { data: comments, isLoading: commentsLoading } = useGetComments(videoId);
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: moderationResult } = useGetModerationResult(videoId);
  const likeVideo = useLikeVideo();
  const unlikeVideo = useUnlikeVideo();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const updateThumbnail = useUpdateThumbnail();
  const deleteVideo = useDeleteVideo();
  const overrideModeration = useOverrideModerationStatus();
  const rerunModeration = useRerunModeration();
  const isCoarsePointer = useIsCoarsePointer();

  // Continue Watching hooks
  const { data: savedProgress } = useGetVideoProgress(videoId);
  const saveProgress = useSaveVideoProgress();

  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showThumbnailUpload, setShowThumbnailUpload] = useState(false);
  const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hasResumedRef = useRef(false);
  const lastSavedTimeRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!identity;
  const currentUserPrincipal = identity?.getPrincipal().toString();
  const isVideoOwner = currentUserPrincipal === video?.uploader.toString();
  const canUploadThumbnail = isVideoOwner || isAdmin;
  const canDelete = isVideoOwner || isAdmin;

  // Check if video is blocked by moderation
  const isBlocked = moderationResult ? !moderationResult.allowed : false;

  // Zoom constants
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.3;

  // Video dimensions for aspect ratio calculation (16:9 standard)
  const VIDEO_ASPECT_RATIO = 16 / 9;
  const getVideoDimensions = () => {
    if (!videoContainerRef.current) return { width: 1920, height: 1080 };
    const containerWidth = videoContainerRef.current.clientWidth;
    const containerHeight = containerWidth / VIDEO_ASPECT_RATIO;
    return { width: containerWidth, height: containerHeight };
  };

  const videoDimensions = getVideoDimensions();

  // Pinch-to-zoom and pan hook
  const {
    state: { scale: zoomScale, translateX: panX, translateY: panY },
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    reset: resetZoom,
    zoomIn: handleZoomInHook,
    zoomOut: handleZoomOutHook,
  } = useVideoPinchPan({
    minScale: MIN_ZOOM,
    maxScale: MAX_ZOOM,
    containerRef: videoContainerRef,
    contentWidth: videoDimensions.width,
    contentHeight: videoDimensions.height,
  });

  // Show zoom controls briefly
  const showZoomControlsBriefly = useCallback(() => {
    setShowZoomControls(true);
    
    if (zoomControlsTimeoutRef.current) {
      clearTimeout(zoomControlsTimeoutRef.current);
    }
    
    zoomControlsTimeoutRef.current = setTimeout(() => {
      setShowZoomControls(false);
    }, 3000);
  }, []);

  // Wrap touch handlers to show controls
  const handleTouchStartWrapper = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      onTouchStart(e);
      if (e.touches.length === 1) {
        showZoomControlsBriefly();
      }
    },
    [onTouchStart, showZoomControlsBriefly]
  );

  // Zoom in handler
  const handleZoomIn = useCallback(() => {
    handleZoomInHook(ZOOM_STEP);
    showZoomControlsBriefly();
  }, [handleZoomInHook, showZoomControlsBriefly]);

  // Zoom out handler
  const handleZoomOut = useCallback(() => {
    handleZoomOutHook(ZOOM_STEP);
    showZoomControlsBriefly();
  }, [handleZoomOutHook, showZoomControlsBriefly]);

  // Reset zoom handler
  const handleZoomReset = useCallback(() => {
    resetZoom();
    showZoomControlsBriefly();
  }, [resetZoom, showZoomControlsBriefly]);

  // Clean up zoom controls timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomControlsTimeoutRef.current) {
        clearTimeout(zoomControlsTimeoutRef.current);
      }
    };
  }, []);

  // Quiet resume: Seek to saved position once metadata is loaded
  useEffect(() => {
    if (!videoRef.current || !isAuthenticated || hasResumedRef.current || isBlocked) return;

    const videoElement = videoRef.current;

    const handleLoadedMetadata = () => {
      if (savedProgress && savedProgress > 0 && !hasResumedRef.current) {
        // Only resume if saved progress is meaningful (more than 5 seconds and not near the end)
        const duration = videoElement.duration;
        if (savedProgress > 5 && savedProgress < duration - 10) {
          videoElement.currentTime = savedProgress;
          hasResumedRef.current = true;
        }
      }
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    // If metadata is already loaded, trigger immediately
    if (videoElement.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [savedProgress, isAuthenticated, isBlocked]);

  // Stable save function that doesn't change on every render
  const saveProgressStable = useCallback(
    (time: number) => {
      if (!isAuthenticated || isBlocked) return;
      saveProgress.mutate({ videoId, progressInSeconds: time });
    },
    [isAuthenticated, videoId, saveProgress.mutate, isBlocked]
  );

  // Throttled progress save function
  const saveProgressThrottled = useCallback(
    (time: number) => {
      if (!isAuthenticated || !videoRef.current || isBlocked) return;

      const duration = videoRef.current.duration;
      // Don't save if near the end (last 10 seconds) or at the very beginning
      if (time < 5 || time > duration - 10) return;

      // Only save if time has changed significantly (at least 5 seconds)
      if (Math.abs(time - lastSavedTimeRef.current) < 5) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Throttle: save after 2 seconds of no new updates
      saveTimeoutRef.current = setTimeout(() => {
        saveProgressStable(time);
        lastSavedTimeRef.current = time;
      }, 2000);
    },
    [isAuthenticated, saveProgressStable, isBlocked]
  );

  // Save progress on time update (throttled)
  const handleTimeUpdate = () => {
    if (videoRef.current && !isBlocked) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      saveProgressThrottled(time);
    }
  };

  // Save progress on pause
  const handlePause = () => {
    if (isAuthenticated && videoRef.current && !isBlocked) {
      const time = videoRef.current.currentTime;
      saveProgressStable(time);
      lastSavedTimeRef.current = time;
    }
  };

  // Save progress on ended (reset to 0)
  const handleEnded = () => {
    if (isAuthenticated && !isBlocked) {
      saveProgressStable(0);
      lastSavedTimeRef.current = 0;
    }
  };

  // Save progress on unmount and navigation - Fixed to prevent infinite loop
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && videoRef.current && !isBlocked) {
        const time = videoRef.current.currentTime;
        // Use sendBeacon for reliable save on page unload
        if (time > 5 && time < videoRef.current.duration - 10) {
          saveProgressStable(time);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isAuthenticated && videoRef.current && !isBlocked) {
        const time = videoRef.current.currentTime;
        if (time > 5 && time < videoRef.current.duration - 10) {
          saveProgressStable(time);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Save on unmount
      if (isAuthenticated && videoRef.current && !isBlocked) {
        const time = videoRef.current.currentTime;
        if (time > 5 && time < videoRef.current.duration - 10) {
          saveProgressStable(time);
        }
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // Only depend on stable values that won't cause re-renders
  }, [isAuthenticated, saveProgressStable, isBlocked]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like videos');
      return;
    }

    try {
      if (isLiked) {
        await unlikeVideo.mutateAsync(videoId);
        setIsLiked(false);
        toast.success('Video unliked');
      } else {
        await likeVideo.mutateAsync(videoId);
        setIsLiked(true);
        toast.success('Video liked');
      }
    } catch (error: any) {
      if (error.message?.includes('already liked')) {
        setIsLiked(true);
        toast.error('You have already liked this video');
      } else if (error.message?.includes('has not liked')) {
        setIsLiked(false);
        toast.error('You have not liked this video');
      } else {
        toast.error('Failed to update like status');
      }
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      await addComment.mutateAsync({ videoId, text: commentText.trim() });
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ videoId, commentId });
      toast.success('Comment deleted');
    } catch (error: any) {
      if (error.message?.includes('Can only delete your own')) {
        toast.error('You can only delete your own comments');
      } else {
        toast.error('Failed to delete comment');
      }
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setCustomThumbnailFile(file);
    }
  };

  const handleUploadCustomThumbnail = async () => {
    if (!customThumbnailFile) {
      toast.error('Please select a thumbnail image');
      return;
    }

    try {
      await updateThumbnail.mutateAsync({
        videoId,
        thumbnailFile: customThumbnailFile,
        thumbnailType: ThumbnailType.custom,
      });
      toast.success('Custom thumbnail uploaded successfully!');
      setShowThumbnailUpload(false);
      setCustomThumbnailFile(null);
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast.error('Failed to upload thumbnail');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteVideo.mutateAsync(videoId);
      toast.success('Video deleted successfully');
      setShowDeleteDialog(false);
      navigate({ to: '/' });
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

  const handleOverrideModeration = async (allowed: boolean) => {
    try {
      await overrideModeration.mutateAsync({ videoId, allowed });
      toast.success(allowed ? 'Video unblocked' : 'Video blocked');
    } catch (error) {
      toast.error('Failed to update moderation status');
    }
  };

  const handleRerunModeration = async () => {
    try {
      await rerunModeration.mutateAsync(videoId);
      toast.success('Moderation re-run complete');
    } catch (error) {
      toast.error('Failed to re-run moderation');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Video not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const videoUrl = video.blob.getDirectURL();
  const thumbnailUrl = video.thumbnail?.getDirectURL();
  const uploaderName = uploaderProfile?.name || 'Anonymous';
  const uploadDate = new Date(Number(video.timestamp) / 1000000);
  const likeCount = Number(video.likeCount);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Video Player or Blocked State */}
        {isBlocked ? (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-destructive">Video Unavailable</h2>
                <p className="text-muted-foreground max-w-md">
                  This video is unavailable because it was flagged by our Community & Ethics Policy filter.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/policy">
                  View Community & Ethics Policy
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div 
            ref={videoContainerRef}
            className="relative overflow-hidden rounded-lg bg-black"
            style={{ 
              minHeight: '400px',
              touchAction: isCoarsePointer ? 'none' : 'auto',
            }}
            onTouchStart={isCoarsePointer ? handleTouchStartWrapper : undefined}
            onTouchMove={isCoarsePointer ? onTouchMove : undefined}
            onTouchEnd={isCoarsePointer ? onTouchEnd : undefined}
          >
            <video
              ref={videoRef}
              controls
              className="aspect-video w-full"
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out',
              }}
              src={videoUrl}
              poster={thumbnailUrl}
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
              onEnded={handleEnded}
            >
              Your browser does not support the video tag.
            </video>

            {/* Mobile Zoom Controls */}
            {isCoarsePointer && (
              <div 
                className={`absolute bottom-20 right-4 flex flex-col gap-2 transition-opacity duration-300 ${
                  showZoomControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= MAX_ZOOM}
                  className="h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= MIN_ZOOM}
                  className="h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                {zoomScale > MIN_ZOOM && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleZoomReset}
                    className="h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Zoom indicator */}
            {isCoarsePointer && zoomScale > MIN_ZOOM && (
              <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {(zoomScale * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}

        {/* Admin Moderation Panel */}
        {isAdmin && moderationResult && (
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Admin Moderation Panel</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {moderationResult.allowed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      Status: {moderationResult.allowed ? 'Allowed' : 'Blocked'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {moderationResult.allowed ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOverrideModeration(false)}
                        disabled={overrideModeration.isPending}
                      >
                        {overrideModeration.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Block Video'
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOverrideModeration(true)}
                        disabled={overrideModeration.isPending}
                      >
                        {overrideModeration.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Unblock Video'
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRerunModeration}
                      disabled={rerunModeration.isPending}
                    >
                      {rerunModeration.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Re-scan
                    </Button>
                  </div>
                </div>

                {moderationResult.matchedWords.length > 0 && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-destructive mb-2">Matched Words:</p>
                    <div className="flex flex-wrap gap-2">
                      {moderationResult.matchedWords.map((word, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold md:text-3xl">{video.title}</h1>
            {video.category && video.category !== 'Uncategorized' && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-sm">
                  {video.category}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {uploaderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{uploaderName}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{uploadDate.toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="default"
                onClick={handleLikeToggle}
                disabled={likeVideo.isPending || unlikeVideo.isPending || isBlocked}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {likeVideo.isPending || unlikeVideo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                )}
                <span>{likeCount}</span>
              </Button>

              <ShareButton
                videoId={videoId}
                videoTitle={video.title}
                currentTime={currentTime}
                variant="outline"
                size="default"
                showLabel={true}
              />

              {canDelete && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleDeleteClick}
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              )}
            </div>
          </div>

          {video.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap text-sm">{video.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Custom Thumbnail Upload Section */}
          {canUploadThumbnail && (
            <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Custom Thumbnail</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a custom thumbnail for this video
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowThumbnailUpload(!showThumbnailUpload)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {showThumbnailUpload ? 'Cancel' : 'Upload Thumbnail'}
                  </Button>
                </div>

                {showThumbnailUpload && (
                  <div className="space-y-3 rounded-lg border border-primary/20 bg-background p-4">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail-file">Select Thumbnail Image</Label>
                      <Input
                        id="thumbnail-file"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        disabled={updateThumbnail.isPending}
                      />
                      {customThumbnailFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {customThumbnailFile.name}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleUploadCustomThumbnail}
                      disabled={!customThumbnailFile || updateThumbnail.isPending}
                      className="w-full"
                    >
                      {updateThumbnail.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Custom Thumbnail
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-accent/5">
            <CardContent className="space-y-6 pt-6">
              <h2 className="text-xl font-bold">Comments ({comments?.length || 0})</h2>

              {/* Add Comment */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isBlocked}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={addComment.isPending || !commentText.trim() || isBlocked}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      {addComment.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post Comment'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="border-primary/20 bg-muted/50">
                  <CardContent className="py-4 text-center text-sm text-muted-foreground">
                    Please log in to post comments
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments && comments.length > 0 ? (
                  comments.map((comment) => {
                    const commentDate = new Date(Number(comment.timestamp) / 1000000);
                    const isOwnComment = currentUserPrincipal === comment.author.toString();

                    return (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        commentDate={commentDate}
                        isOwnComment={isOwnComment}
                        onDelete={() => handleDeleteComment(comment.id)}
                        isDeleting={deleteComment.isPending}
                      />
                    );
                  })
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      No comments yet. Be the first to comment!
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}

interface CommentItemProps {
  comment: {
    id: string;
    author: { toString: () => string };
    text: string;
  };
  commentDate: Date;
  isOwnComment: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

function CommentItem({ comment, commentDate, isOwnComment, onDelete, isDeleting }: CommentItemProps) {
  const { data: authorProfile } = useGetUserProfile(comment.author.toString());
  const authorName = authorProfile?.name || 'Anonymous';

  return (
    <Card className="border-primary/10 transition-colors hover:border-primary/30">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{authorName}</p>
                <span className="text-xs text-muted-foreground">
                  {commentDate.toLocaleDateString()} {commentDate.toLocaleTimeString()}
                </span>
              </div>
              {isOwnComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
