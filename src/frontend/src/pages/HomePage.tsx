import { useState, useEffect } from 'react';
import {
  useGetAllVideos,
  useGetFeaturedVideos,
  useSearchVideos,
  useGetVideosByCategory,
  useSearchVideosByCategory,
  useGetAllCategories,
} from '../hooks/useQueries';
import VideoGrid from '../components/VideoGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Upload, Sparkles, Search, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { VideoMetadata } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGetUserProfile } from '../hooks/useQueries';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function FeaturedVideoCard({ video }: { video: VideoMetadata }) {
  const navigate = useNavigate();
  const { data: uploaderProfile } = useGetUserProfile(video.uploader.toString());

  const uploaderName = uploaderProfile?.name || 'Anonymous';
  const uploadDate = new Date(Number(video.timestamp) / 1000000);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-2xl"
      onClick={() => navigate({ to: '/video/$videoId', params: { videoId: video.id } })}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src="/assets/generated/default-video-thumbnail.dim_320x180.png"
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-primary p-4 shadow-lg">
            <Play className="h-8 w-8 fill-primary-foreground text-primary-foreground" />
          </div>
        </div>
        <div className="absolute left-3 top-3">
          <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-tight">{video.title}</h3>
        {video.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
        )}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-sm text-primary-foreground">
              {uploaderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{uploaderName}</p>
            <p className="text-xs text-muted-foreground">{uploadDate.toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const isAuthenticated = !!identity;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch featured videos
  const { data: featuredVideos, isLoading: featuredLoading } = useGetFeaturedVideos();

  // Fetch categories
  const { data: categories } = useGetAllCategories();

  // Determine which query to use based on filters
  const hasSearch = debouncedSearchQuery.trim() !== '';
  const hasCategory = selectedCategory !== '';

  // Query for all videos (fallback when no filters)
  const { data: allVideos, isLoading: allVideosLoading } = useGetAllVideos();

  // Query for search only
  const { data: searchResults, isLoading: searchLoading } = useSearchVideos(debouncedSearchQuery);

  // Query for category only
  const { data: categoryResults, isLoading: categoryLoading } = useGetVideosByCategory(selectedCategory);

  // Query for combined search and category
  const { data: combinedResults, isLoading: combinedLoading } = useSearchVideosByCategory(
    debouncedSearchQuery,
    selectedCategory
  );

  // Determine which data to display
  let displayVideos: VideoMetadata[] = [];
  let isLoading = false;

  if (hasSearch && hasCategory) {
    // Both search and category active
    displayVideos = combinedResults || [];
    isLoading = combinedLoading;
  } else if (hasSearch) {
    // Only search active
    displayVideos = searchResults || [];
    isLoading = searchLoading;
  } else if (hasCategory) {
    // Only category active
    displayVideos = categoryResults || [];
    isLoading = categoryLoading;
  } else {
    // No filters - show all videos
    displayVideos = allVideos || [];
    isLoading = allVideosLoading;
  }

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== '';

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        <div className="absolute inset-0 bg-[url('/assets/generated/xocial-stream-hero-banner-bg.dim_1920x600.png')] bg-cover bg-center opacity-10" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <img
                src="/assets/generated/xocial-stream-logo-transparent.dim_200x200.png"
                alt="Xocial.Stream"
                className="h-24 w-24 animate-pulse drop-shadow-2xl md:h-32 md:w-32"
              />
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-primary-foreground md:text-6xl lg:text-7xl">
              Welcome to Xocial.Stream
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl lg:text-2xl">
              Upload everything. Share without limits.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => navigate({ to: '/upload' })}
                  className="group bg-background text-foreground shadow-xl transition-all hover:scale-105 hover:bg-background/90"
                >
                  <Upload className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-1" />
                  Upload Your Video
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => navigate({ to: '/upload' })}
                  className="group bg-background text-foreground shadow-xl transition-all hover:scale-105 hover:bg-background/90"
                >
                  <Upload className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-1" />
                  Get Started
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const videosSection = document.getElementById('all-videos');
                  videosSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-primary-foreground/20"
              >
                <Video className="mr-2 h-5 w-5" />
                Explore Videos
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Featured Videos Section */}
      {featuredLoading ? (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Featured Videos</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        featuredVideos &&
        featuredVideos.length > 0 && (
          <section className="container mx-auto px-4 py-16">
            <div className="mb-8 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Featured Videos</h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredVideos.slice(0, 3).map((video) => (
                <FeaturedVideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )
      )}

      {/* All Videos Section */}
      <section id="all-videos" className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold">All Videos</h2>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search videos by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters} className="shrink-0">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Category Filter */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
                className="rounded-full"
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  Category: {selectedCategory}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : !displayVideos || displayVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
            <div className="rounded-full bg-muted p-6">
              <Video className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">
              {hasActiveFilters ? 'No videos found' : 'No videos yet'}
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Be the first to upload a video!'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={handleClearFilters} variant="outline" className="mt-4">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            ) : (
              isAuthenticated && (
                <Button onClick={() => navigate({ to: '/upload' })} className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              )
            )}
          </div>
        ) : (
          <VideoGrid videos={displayVideos} />
        )}
      </section>
    </div>
  );
}
