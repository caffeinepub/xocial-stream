import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { VideoMetadata, UserProfile, Comment, StripeConfigAndUrls, ModerationResult } from '../backend';
import { ExternalBlob, ThumbnailType } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { useEffect } from 'react';
import { adminSession } from '../lib/adminSession';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: string) {
  const { actor } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const principal = Principal.fromText(userPrincipal);
        return actor.getUserProfile(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !!userPrincipal,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      category,
      videoFile,
      thumbnailFile,
      onProgress,
    }: {
      id: string;
      title: string;
      description: string;
      category: string;
      videoFile: File;
      thumbnailFile?: File;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');

      const arrayBuffer = await videoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let blob = ExternalBlob.fromBytes(uint8Array);

      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      let thumbnailBlob: ExternalBlob | null = null;
      let thumbnailType: ThumbnailType | null = null;

      if (thumbnailFile) {
        const thumbnailArrayBuffer = await thumbnailFile.arrayBuffer();
        const thumbnailUint8Array = new Uint8Array(thumbnailArrayBuffer);
        thumbnailBlob = ExternalBlob.fromBytes(thumbnailUint8Array);
        thumbnailType = ThumbnailType.automatic;
      }

      return actor.uploadVideo(id, title, description, category, blob, thumbnailBlob, thumbnailType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateThumbnail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      thumbnailFile,
      thumbnailType,
    }: {
      videoId: string;
      thumbnailFile: File;
      thumbnailType: ThumbnailType;
    }) => {
      if (!actor) throw new Error('Actor not available');

      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const thumbnailBlob = ExternalBlob.fromBytes(uint8Array);

      return actor.updateThumbnail(videoId, thumbnailBlob, thumbnailType);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      queryClient.invalidateQueries({ queryKey: ['featuredVideos'] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      queryClient.invalidateQueries({ queryKey: ['featuredVideos'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useGetAllVideos() {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['allVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor,
  });
}

export function useGetVideo(videoId: string) {
  const { actor } = useActor();

  return useQuery<VideoMetadata | null>({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVideo(videoId);
    },
    enabled: !!actor && !!videoId,
  });
}

export function useGetUserVideos() {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['userVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserVideos();
    },
    enabled: !!actor,
  });
}

export function useGetFeaturedVideos() {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['featuredVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeaturedVideos();
    },
    enabled: !!actor,
  });
}

export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likeVideo(videoId);
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      queryClient.invalidateQueries({ queryKey: ['featuredVideos'] });
    },
  });
}

export function useUnlikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlikeVideo(videoId);
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      queryClient.invalidateQueries({ queryKey: ['featuredVideos'] });
    },
  });
}

export function useGetComments(videoId: string) {
  const { actor } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(videoId);
    },
    enabled: !!actor && !!videoId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, text }: { videoId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(videoId, text);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, commentId }: { videoId: string; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(videoId, commentId);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
    },
  });
}

export function useSearchVideos(searchQuery: string) {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['searchVideos', searchQuery],
    queryFn: async () => {
      if (!actor || !searchQuery.trim()) return [];
      return actor.searchVideos(searchQuery);
    },
    enabled: !!actor && !!searchQuery.trim(),
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['videosByCategory', category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return actor.getVideosByCategory(category);
    },
    enabled: !!actor && !!category,
  });
}

export function useSearchVideosByCategory(searchQuery: string, category: string) {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['searchVideosByCategory', searchQuery, category],
    queryFn: async () => {
      if (!actor || !searchQuery.trim() || !category) return [];
      return actor.searchVideosByCategory(searchQuery, category);
    },
    enabled: !!actor && !!searchQuery.trim() && !!category,
  });
}

export function useGetAllCategories() {
  const { actor } = useActor();

  return useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCategories();
    },
    enabled: !!actor,
  });
}

/**
 * Hook to check if the current user is an admin
 * Uses persistent local storage to maintain admin session across page loads
 * Enhanced with automatic revalidation on session version mismatch
 */
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const currentPrincipal = identity?.getPrincipal().toString();

  // Check if session needs revalidation on mount
  useEffect(() => {
    if (currentPrincipal && adminSession.needsRevalidation()) {
      console.log('Admin session needs revalidation, clearing stale data');
      adminSession.forceReactivation();
      // Force refetch from backend
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin', currentPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['verifyAdminAccess', currentPrincipal] });
    }
  }, [currentPrincipal, queryClient]);

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin', currentPrincipal],
    queryFn: async () => {
      if (!actor || !currentPrincipal) return false;

      // First check local storage for persistent admin session
      if (adminSession.isStoredAdmin(currentPrincipal)) {
        console.log('Admin session restored from local storage');
        return true;
      }

      // If not in local storage, verify with backend
      try {
        console.log('Verifying admin status with backend...');
        const isAdmin = await actor.isCallerAdmin();
        // If backend confirms admin, store in local storage for persistence
        if (isAdmin) {
          console.log('Admin status confirmed by backend, storing in local storage');
          adminSession.setAdminPrincipal(currentPrincipal);
        }
        return isAdmin;
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !isInitializing && !!identity,
    staleTime: 0, // Always check on mount to ensure fresh data
    gcTime: Infinity, // Never garbage collect
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook to verify admin access with backend and store in local storage
 * This creates the persistent admin session
 * Enhanced with force reactivation capabilities
 */
export function useVerifyAdminAccess() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const currentPrincipal = identity?.getPrincipal().toString();

  const query = useQuery<boolean>({
    queryKey: ['verifyAdminAccess', currentPrincipal],
    queryFn: async () => {
      if (!actor || !currentPrincipal) return false;

      // Check if session needs revalidation
      if (adminSession.needsRevalidation()) {
        console.log('Session version mismatch, forcing revalidation');
        adminSession.forceReactivation();
      }

      // First check local storage for persistent admin session
      if (adminSession.isStoredAdmin(currentPrincipal)) {
        console.log('Admin session restored from local storage (verify)');
        return true;
      }

      // If not in local storage, verify with backend
      try {
        console.log('Verifying admin access with backend...');
        const isAdmin = await actor.verifyAdminAccess();
        // If backend confirms admin, store in local storage for permanent persistence
        if (isAdmin) {
          console.log('Admin access verified by backend, storing in local storage');
          adminSession.setAdminPrincipal(currentPrincipal);
          // Also update isCallerAdmin query
          queryClient.setQueryData(['isCallerAdmin', currentPrincipal], true);
        }
        return isAdmin;
      } catch (error) {
        console.error('Error verifying admin access:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !isInitializing && !!identity,
    staleTime: 0, // Always check on mount to ensure fresh data
    gcTime: Infinity, // Never garbage collect
    retry: 2,
    retryDelay: 1000,
  });

  // Automatically refetch admin verification when identity changes or actor becomes available
  useEffect(() => {
    if (actor && !actorFetching && !isInitializing && identity && currentPrincipal) {
      // Check if session needs revalidation
      if (adminSession.needsRevalidation()) {
        console.log('Forcing admin session reactivation due to version mismatch');
        adminSession.forceReactivation();
        queryClient.invalidateQueries({ queryKey: ['verifyAdminAccess', currentPrincipal] });
        queryClient.invalidateQueries({ queryKey: ['isCallerAdmin', currentPrincipal] });
        return;
      }

      // Check local storage first
      if (adminSession.isStoredAdmin(currentPrincipal)) {
        console.log('Restoring admin session from local storage on mount');
        // Update query cache with stored admin status
        queryClient.setQueryData(['verifyAdminAccess', currentPrincipal], true);
        queryClient.setQueryData(['isCallerAdmin', currentPrincipal], true);
      } else {
        // If not in local storage, trigger backend verification
        console.log('No stored admin session, triggering backend verification');
        queryClient.invalidateQueries({ queryKey: ['verifyAdminAccess', currentPrincipal] });
        queryClient.invalidateQueries({ queryKey: ['isCallerAdmin', currentPrincipal] });
      }
    }
  }, [actor, actorFetching, isInitializing, identity, currentPrincipal, queryClient]);

  return query;
}

/**
 * Hook to fetch public Stripe configuration from backend (excludes secret key)
 * Used by public pages like PricingPage to get checkout URLs
 */
export function useGetPublicStripeConfig() {
  const { actor } = useActor();

  return useQuery<StripeConfigAndUrls>({
    queryKey: ['publicStripeConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      console.log('Fetching public Stripe configuration from backend...');
      const config = await actor.getPublicStripeConfigAndUrls();
      console.log('✅ Public Stripe configuration loaded:', {
        hasBasicPlanUrl: !!config.basicPlanUrl,
        hasCreatorPlanUrl: !!config.creatorPlanUrl,
        hasProPlanUrl: !!config.proPlanUrl,
      });
      return config;
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch full Stripe configuration from backend (admin only, includes secret key)
 * Used by admin settings pages to load and edit complete configuration
 */
export function useGetFullStripeConfig() {
  const { actor } = useActor();

  return useQuery<StripeConfigAndUrls>({
    queryKey: ['fullStripeConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      console.log('Fetching full Stripe configuration from backend (admin only)...');
      const config = await actor.getFullStripeConfigAndUrls();
      console.log('✅ Full Stripe configuration restored from backend:', {
        hasPublishableKey: !!config.publishableKey,
        hasSecretKey: !!config.secretKey,
        hasBasicPlanUrl: !!config.basicPlanUrl,
        hasCreatorPlanUrl: !!config.creatorPlanUrl,
        hasProPlanUrl: !!config.proPlanUrl,
      });
      return config;
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to update Stripe configuration in backend (admin only)
 * Supports partial updates - omitted fields are not changed, empty strings clear values
 */
export function useUpdateStripeConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configAndUrls: StripeConfigAndUrls) => {
      if (!actor) throw new Error('Actor not available');
      console.log('Updating Stripe configuration in backend...');
      await actor.updateStripeConfigAndUrls(configAndUrls);
      console.log('✅ Stripe configuration updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicStripeConfig'] });
      queryClient.invalidateQueries({ queryKey: ['fullStripeConfig'] });
    },
  });
}

/**
 * Hook to fetch saved video playback progress for the current user
 * Returns progress in seconds (as bigint from backend, converted to number)
 */
export function useGetVideoProgress(videoId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const currentPrincipal = identity?.getPrincipal().toString();

  return useQuery<number>({
    queryKey: ['videoProgress', videoId, currentPrincipal],
    queryFn: async () => {
      if (!actor) return 0;
      try {
        const progress = await actor.getVideoProgress(videoId);
        return Number(progress);
      } catch (error) {
        // Silently return 0 if there's an error (e.g., no saved progress)
        return 0;
      }
    },
    enabled: !!actor && !actorFetching && !!identity && !!videoId,
    staleTime: 0, // Always fetch fresh progress
    retry: false, // Don't retry on error
  });
}

/**
 * Hook to save video playback progress for the current user
 * Saves progress in seconds (converted to bigint for backend)
 */
export function useSaveVideoProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  const currentPrincipal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async ({ videoId, progressInSeconds }: { videoId: string; progressInSeconds: number }) => {
      if (!actor) throw new Error('Actor not available');
      // Convert to bigint for backend
      const progressBigInt = BigInt(Math.floor(progressInSeconds));
      await actor.saveVideoProgress(videoId, progressBigInt);
    },
    onSuccess: (_, { videoId }) => {
      // Update the cache with the new progress
      queryClient.invalidateQueries({ queryKey: ['videoProgress', videoId, currentPrincipal] });
    },
    // Silently handle errors - don't show toasts for progress save failures
    onError: () => {
      // Silent failure for progress saves
    },
  });
}

/**
 * Hook to check if a video is allowed (not blocked by moderation)
 * Returns true if allowed, false if blocked
 */
export function useIsVideoAllowed(videoId: string) {
  const { actor } = useActor();

  return useQuery<boolean>({
    queryKey: ['isVideoAllowed', videoId],
    queryFn: async () => {
      if (!actor) return true;
      try {
        return await actor.isVideoAllowed(videoId);
      } catch (error) {
        // If error (e.g., not admin), assume allowed
        return true;
      }
    },
    enabled: !!actor && !!videoId,
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Hook to fetch moderation result for a video (admin only)
 * Returns moderation result with allowed status and matched words
 */
export function useGetModerationResult(videoId: string) {
  const { actor } = useActor();

  return useQuery<ModerationResult | null>({
    queryKey: ['moderationResult', videoId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getModerationResult(videoId);
      } catch (error) {
        // If error (e.g., not admin), return null
        return null;
      }
    },
    enabled: !!actor && !!videoId,
  });
}

/**
 * Hook to fetch banned words list (admin only)
 */
export function useGetBannedWords() {
  const { actor } = useActor();

  return useQuery<string[]>({
    queryKey: ['bannedWords'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getBannedWords();
      } catch (error) {
        console.error('Error fetching banned words:', error);
        return [];
      }
    },
    enabled: !!actor,
  });
}

/**
 * Hook to update banned words list (admin only)
 */
export function useSetBannedWords() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (words: string[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setBannedWords(words);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannedWords'] });
    },
  });
}

/**
 * Hook to override moderation status for a video (admin only)
 */
export function useOverrideModerationStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, allowed }: { videoId: string; allowed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.overrideModerationStatus(videoId, allowed);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['moderationResult', videoId] });
      queryClient.invalidateQueries({ queryKey: ['isVideoAllowed', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
    },
  });
}

/**
 * Hook to re-run moderation for a video (admin only)
 */
export function useRerunModeration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rerunModeration(videoId);
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ['moderationResult', videoId] });
      queryClient.invalidateQueries({ queryKey: ['isVideoAllowed', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
    },
  });
}

/**
 * Hook to re-run moderation for all videos (admin only)
 */
export function useRerunModerationAll() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.rerunModerationAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationResult'] });
      queryClient.invalidateQueries({ queryKey: ['isVideoAllowed'] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
    },
  });
}

/**
 * Hook to fetch blocked videos (admin only)
 */
export function useGetBlockedVideos() {
  const { actor } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['blockedVideos'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getBlockedVideos();
      } catch (error) {
        console.error('Error fetching blocked videos:', error);
        return [];
      }
    },
    enabled: !!actor,
  });
}
