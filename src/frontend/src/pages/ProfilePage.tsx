import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetUserVideos, useGetCallerUserProfile } from '../hooks/useQueries';
import VideoGrid from '../components/VideoGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video } from 'lucide-react';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: videos, isLoading: videosLoading } = useGetUserVideos();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading || videosLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const userName = profile?.name || 'User';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{userName}</h1>
          <p className="text-muted-foreground">
            {videos?.length || 0} {videos?.length === 1 ? 'video' : 'videos'}
          </p>
        </div>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">No videos yet</h2>
          <p className="text-muted-foreground">Upload your first video to get started!</p>
        </div>
      ) : (
        <>
          <h2 className="mb-6 text-2xl font-bold">Your Videos</h2>
          <VideoGrid videos={videos} />
        </>
      )}
    </div>
  );
}
