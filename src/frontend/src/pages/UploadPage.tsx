import { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useUploadVideo } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, Info, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const PREDEFINED_CATEGORIES = [
  'Music',
  'Education',
  'Entertainment',
  'Vlogs',
  'Gaming',
  'Sports',
  'News',
  'Technology',
  'Comedy',
  'Other',
];

export default function UploadPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const uploadMutation = useUploadVideo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing'>('idle');

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isAuthenticated = !!identity;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      setVideoFile(file);
      setThumbnailFile(null); // Reset thumbnail when new video is selected
    }
  };

  const captureThumbnail = async () => {
    if (!videoFile || !videoPreviewRef.current || !canvasRef.current) {
      toast.error('Please select a video first');
      return;
    }

    setIsCapturingThumbnail(true);

    try {
      const video = videoPreviewRef.current;
      const canvas = canvasRef.current;

      // Wait for video to load metadata
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
        video.src = URL.createObjectURL(videoFile);
      });

      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create thumbnail'));
          },
          'image/jpeg',
          0.9
        );
      });

      // Create File from blob
      const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
      setThumbnailFile(thumbnailFile);

      toast.success('Thumbnail captured successfully!');
    } catch (error) {
      console.error('Thumbnail capture error:', error);
      toast.error('Failed to capture thumbnail');
    } finally {
      setIsCapturingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to upload videos');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error('Please select or enter a category');
      return;
    }

    try {
      const videoId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      setUploadStatus('uploading');

      await uploadMutation.mutateAsync({
        id: videoId,
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        videoFile,
        thumbnailFile: thumbnailFile || undefined,
        onProgress: (percentage) => {
          setUploadProgress(percentage);
        },
      });

      // Show processing state briefly before navigating
      setUploadStatus('processing');
      
      // Brief delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 800));

      toast.success('Video uploaded successfully!');
      navigate({ to: '/' });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video. Please try again.');
      setUploadStatus('idle');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to upload videos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload Video
          </CardTitle>
          <CardDescription>Share your video with the world</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              By continuing, you agree to follow the Xocial.Stream Community & Ethics Policy.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video-file">Video File *</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
              />
              {videoFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {videoFile && (
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureThumbnail}
                    disabled={isCapturingThumbnail || uploadMutation.isPending}
                    className="w-full"
                  >
                    {isCapturingThumbnail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Capture Thumbnail from Video
                      </>
                    )}
                  </Button>
                  {thumbnailFile && (
                    <div className="rounded-lg border border-primary/20 bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">
                        ✓ Thumbnail ready: {thumbnailFile.name}
                      </p>
                    </div>
                  )}
                </div>
                <video ref={videoPreviewRef} className="hidden" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploadMutation.isPending}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description (optional)"
                disabled={uploadMutation.isPending}
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploadMutation.isPending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">Custom Category</option>
              </select>
            </div>

            {category === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-category">Custom Category *</Label>
                <Input
                  id="custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  disabled={uploadMutation.isPending}
                  maxLength={50}
                />
              </div>
            )}

            {uploadStatus === 'uploading' && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {uploadStatus === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-primary">Processing...</span>
                </div>
              </div>
            )}

            <Button type="submit" disabled={uploadMutation.isPending} className="w-full">
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : uploadStatus === 'processing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
