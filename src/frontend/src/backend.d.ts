import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface StripeConfigAndUrls {
    proPlanUrl?: string;
    basicPlanUrl?: string;
    secretKey?: string;
    creatorPlanUrl?: string;
    subscriptionsEnabled: boolean;
    defaultPricing?: bigint;
    publishableKey?: string;
}
export interface FreePlanDetails {
    isActive: boolean;
    uploadsRemaining: bigint;
}
export interface Comment {
    id: string;
    text: string;
    author: Principal;
    timestamp: bigint;
    videoId: string;
}
export interface ModerationResult {
    allowed: boolean;
    matchedWords: Array<string>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface VideoMetadata {
    id: string;
    status: VideoStatus;
    title: string;
    likeCount: bigint;
    thumbnail?: ExternalBlob;
    blob: ExternalBlob;
    description: string;
    isFeatured: boolean;
    thumbnailType?: ThumbnailType;
    timestamp: bigint;
    category: string;
    uploader: Principal;
}
export interface UserProfile {
    name: string;
}
export enum ThumbnailType {
    custom = "custom",
    automatic = "automatic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VideoStatus {
    live = "live",
    uploading = "uploading",
    processing = "processing"
}
export interface backendInterface {
    addComment(videoId: string, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteComment(videoId: string, commentId: string): Promise<void>;
    deleteVideo(videoId: string): Promise<void>;
    getAdminPrincipalId(): Promise<string>;
    getAllCategories(): Promise<Array<string>>;
    getAllVideos(): Promise<Array<VideoMetadata>>;
    getBannedWords(): Promise<Array<string>>;
    getBlockedVideos(): Promise<Array<VideoMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(videoId: string): Promise<Array<Comment>>;
    getFeaturedVideos(): Promise<Array<VideoMetadata>>;
    getFreePlanStatus(): Promise<FreePlanDetails>;
    getFullStripeConfigAndUrls(): Promise<StripeConfigAndUrls>;
    getLikeCount(videoId: string): Promise<bigint>;
    getModerationResult(videoId: string): Promise<ModerationResult | null>;
    getPermanentAdminPrincipal(): Promise<Principal | null>;
    getPublicStripeConfigAndUrls(): Promise<StripeConfigAndUrls>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserVideos(): Promise<Array<VideoMetadata>>;
    getVideo(id: string): Promise<VideoMetadata | null>;
    getVideoProgress(videoId: string): Promise<bigint>;
    getVideosByCategory(category: string): Promise<Array<VideoMetadata>>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    isVideoAllowed(videoId: string): Promise<boolean>;
    likeVideo(videoId: string): Promise<void>;
    overrideModerationStatus(videoId: string, allowed: boolean): Promise<void>;
    rerunModeration(videoId: string): Promise<void>;
    rerunModerationAll(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveVideoProgress(videoId: string, progressInSeconds: bigint): Promise<void>;
    searchVideos(searchQuery: string): Promise<Array<VideoMetadata>>;
    searchVideosByCategory(searchQuery: string, category: string): Promise<Array<VideoMetadata>>;
    setBannedWords(words: Array<string>): Promise<void>;
    setFeaturedStatus(videoId: string, isFeatured: boolean): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    storePermanentAdminPrincipal(): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unlikeVideo(videoId: string): Promise<void>;
    updateStripeConfigAndUrls(config: StripeConfigAndUrls): Promise<void>;
    updateThumbnail(videoId: string, thumbnail: ExternalBlob, thumbnailType: ThumbnailType): Promise<void>;
    uploadVideo(id: string, title: string, description: string, category: string, blob: ExternalBlob, thumbnail: ExternalBlob | null, thumbnailType: ThumbnailType | null): Promise<void>;
    verifyAdminAccess(): Promise<boolean>;
}
