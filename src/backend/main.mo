import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";


import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import List "mo:base/List";
import Int "mo:base/Int";


actor {
    // Type for Stripe configuration and product URLs
    type StripeConfigAndUrls = {
        publishableKey : ?Text;
        secretKey : ?Text;
        basicPlanUrl : ?Text;
        creatorPlanUrl : ?Text;
        proPlanUrl : ?Text;
        subscriptionsEnabled : Bool;
        defaultPricing : ?Nat;
    };

    // Store Stripe configuration and product URLs
    var stripeConfigAndUrls : StripeConfigAndUrls = {
        publishableKey = null;
        secretKey = null;
        basicPlanUrl = null;
        creatorPlanUrl = null;
        proPlanUrl = null;
        subscriptionsEnabled = false;
        defaultPricing = null;
    };

    var permanentAdminPrincipal : ?Principal = null;

    let accessControlState = AccessControl.initState();
    let storage = Storage.new();
    include MixinStorage(storage);

    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public type UserProfile = {
        name : Text;
    };

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles = principalMap.empty<UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can save profiles");
        };
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own profile");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can save profiles");
        };
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    public type ThumbnailType = {
        #automatic;
        #custom;
    };

    public type VideoStatus = {
        #uploading;
        #processing;
        #live;
    };

    public type ModerationResult = {
        allowed : Bool;
        matchedWords : [Text];
    };

    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    type ModerationMap = OrderedMap.Map<Text, ModerationResult>;
    var moderationResults : ModerationMap = textMap.empty();

    // Configurable banned words list (admin-only)
    var bannedWords : [Text] = ["bannedword1", "bannedword2", "offensivephrase"];

    public type VideoMetadata = {
        id : Text;
        title : Text;
        description : Text;
        category : Text;
        uploader : Principal;
        blob : Storage.ExternalBlob;
        timestamp : Int;
        isFeatured : Bool;
        likeCount : Nat;
        thumbnail : ?Storage.ExternalBlob;
        thumbnailType : ?ThumbnailType;
        status : VideoStatus;
    };

    public type Comment = {
        id : Text;
        videoId : Text;
        author : Principal;
        text : Text;
        timestamp : Int;
    };

    // Free Plan tracking
    public type UserPlanData = {
        plan : { #free; #pro; #creatorPlus };
        monthlyUploads : Nat;
        lastResetMonth : Int;
    };

    var videos = textMap.empty<VideoMetadata>();
    var comments = textMap.empty<List.List<Comment>>();
    var likes = textMap.empty<List.List<Principal>>();
    var userPlans = principalMap.empty<UserPlanData>();

    // Video history
    public type VideoHistoryKey = {
        user : Principal;
        videoId : Text;
    };

    func compareHistoryKey(key1 : VideoHistoryKey, key2 : VideoHistoryKey) : { #less; #equal; #greater } {
        switch (Principal.compare(key1.user, key2.user)) {
            case (#less) #less;
            case (#greater) #greater;
            case (#equal) {
                switch (Text.compare(key1.videoId, key2.videoId)) {
                    case (#less) #less;
                    case (#greater) #greater;
                    case (#equal) #equal;
                };
            };
        };
    };

    transient let historyMap = OrderedMap.Make<VideoHistoryKey>(compareHistoryKey);
    var videoHistory = historyMap.empty<Nat>();

    // Helper function to get current month in YYYYMM format
    func getCurrentMonth() : Int {
        let now = Time.now();
        let seconds = now / 1_000_000_000;
        let days = seconds / 86400;
        let year = 1970 + (days / 365);
        let dayOfYear = days % 365;
        let month = (dayOfYear / 30) + 1;
        year * 100 + month;
    };

    // Helper function to get or initialize user plan data
    func getUserPlanData(user : Principal) : UserPlanData {
        switch (principalMap.get(userPlans, user)) {
            case (null) {
                let newPlan : UserPlanData = {
                    plan = #free;
                    monthlyUploads = 0;
                    lastResetMonth = getCurrentMonth();
                };
                userPlans := principalMap.put(userPlans, user, newPlan);
                newPlan;
            };
            case (?planData) {
                let currentMonth = getCurrentMonth();
                if (planData.lastResetMonth != currentMonth) {
                    let resetPlan : UserPlanData = {
                        plan = planData.plan;
                        monthlyUploads = 0;
                        lastResetMonth = currentMonth;
                    };
                    userPlans := principalMap.put(userPlans, user, resetPlan);
                    resetPlan;
                } else {
                    planData;
                };
            };
        };
    };

    // Helper function to perform moderation check
    func moderateContent(text : Text) : ModerationResult {
        let lowerText = Text.toLowercase(text);
        let matchedWords = Array.filter<Text>(
            bannedWords,
            func(word) {
                Text.contains(lowerText, #text(Text.toLowercase(word)))
            }
        );

        {
            allowed = matchedWords.size() == 0;
            matchedWords;
        };
    };

    public shared ({ caller }) func uploadVideo(id : Text, title : Text, description : Text, category : Text, blob : Storage.ExternalBlob, thumbnail : ?Storage.ExternalBlob, thumbnailType : ?ThumbnailType) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can upload videos");
        };

        let planData = getUserPlanData(caller);
        switch (planData.plan) {
            case (#free) {
                if (planData.monthlyUploads >= 10) {
                    Debug.trap("Upload limit reached: Free plan allows 10 uploads per month. Please upgrade to Pro or Creator Plus for unlimited uploads.");
                };
            };
            case (#pro or #creatorPlus) {};
        };

        let combinedText = title # " " # description;
        let moderationResult = moderateContent(combinedText);

        moderationResults := textMap.put(moderationResults, id, moderationResult);

        if (not moderationResult.allowed) {
            Debug.trap("Video upload blocked due to banned content: " # Text.join(", ", Iter.fromArray(moderationResult.matchedWords)));
        };

        let video : VideoMetadata = {
            id;
            title;
            description;
            category;
            uploader = caller;
            blob;
            timestamp = Time.now();
            isFeatured = false;
            likeCount = 0;
            thumbnail;
            thumbnailType;
            status = #processing;
        };

        videos := textMap.put(videos, id, video);

        let liveVideo : VideoMetadata = {
            video with
            status = #live;
        };
        videos := textMap.put(videos, id, liveVideo);

        switch (planData.plan) {
            case (#free) {
                let updatedPlan : UserPlanData = {
                    plan = planData.plan;
                    monthlyUploads = planData.monthlyUploads + 1;
                    lastResetMonth = planData.lastResetMonth;
                };
                userPlans := principalMap.put(userPlans, caller, updatedPlan);
            };
            case (#pro or #creatorPlus) {};
        };
    };

    public query func getAllVideos() : async [VideoMetadata] {
        let allVideos = Iter.toArray(textMap.vals(videos));
        Array.filter<VideoMetadata>(
            allVideos,
            func(video : VideoMetadata) : Bool {
                switch (textMap.get(moderationResults, video.id)) {
                    case (null) { true };
                    case (?result) { result.allowed };
                };
            }
        );
    };

    public query func getVideo(id : Text) : async ?VideoMetadata {
        switch (textMap.get(videos, id)) {
            case (null) { null };
            case (?video) {
                switch (textMap.get(moderationResults, id)) {
                    case (null) { ?video };
                    case (?result) {
                        if (result.allowed) { ?video } else { null };
                    };
                };
            };
        };
    };

    public query ({ caller }) func getModerationResult(videoId : Text) : async ?ModerationResult {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view moderation results");
        };
        textMap.get(moderationResults, videoId);
    };

    public query ({ caller }) func isVideoAllowed(videoId : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can check video moderation status");
        };
        switch (textMap.get(moderationResults, videoId)) {
            case (null) { true };
            case (?result) { result.allowed };
        };
    };

    public query ({ caller }) func getBlockedVideos() : async [VideoMetadata] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view blocked videos");
        };
        let videosArray = Iter.toArray(textMap.vals(videos));
        Array.filter<VideoMetadata>(
            videosArray,
            func(video : VideoMetadata) : Bool {
                switch (textMap.get(moderationResults, video.id)) {
                    case (null) { false };
                    case (?result) { result.allowed == false };
                };
            },
        );
    };

    public shared ({ caller }) func setBannedWords(words : [Text]) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can configure banned words");
        };
        bannedWords := words;
    };

    public query ({ caller }) func getBannedWords() : async [Text] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view banned words");
        };
        bannedWords;
    };

    public shared ({ caller }) func overrideModerationStatus(videoId : Text, allowed : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can override moderation status");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?_) {
                let currentResult = switch (textMap.get(moderationResults, videoId)) {
                    case (null) {
                        { allowed = true; matchedWords = [] };
                    };
                    case (?result) { result };
                };

                let overriddenResult : ModerationResult = {
                    allowed;
                    matchedWords = currentResult.matchedWords;
                };

                moderationResults := textMap.put(moderationResults, videoId, overriddenResult);
            };
        };
    };

    public shared ({ caller }) func rerunModeration(videoId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can re-run moderation");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?video) {
                let combinedText = video.title # " " # video.description;
                let moderationResult = moderateContent(combinedText);
                moderationResults := textMap.put(moderationResults, videoId, moderationResult);
            };
        };
    };

    public shared ({ caller }) func rerunModerationAll() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can re-run moderation on all videos");
        };

        for ((videoId, video) in textMap.entries(videos)) {
            let combinedText = video.title # " " # video.description;
            let moderationResult = moderateContent(combinedText);
            moderationResults := textMap.put(moderationResults, videoId, moderationResult);
        };
    };

    public shared ({ caller }) func updateThumbnail(videoId : Text, thumbnail : Storage.ExternalBlob, thumbnailType : ThumbnailType) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update thumbnails");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?video) {
                if (video.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                    Debug.trap("Unauthorized: Can only update your own videos");
                };
                let updatedVideo = { video with thumbnail = ?thumbnail; thumbnailType = ?thumbnailType };
                videos := textMap.put(videos, videoId, updatedVideo);
            };
        };
    };

    public query ({ caller }) func getUserVideos() : async [VideoMetadata] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view their videos");
        };

        let allVideos = Iter.toArray(textMap.vals(videos));
        Array.filter(allVideos, func(video : VideoMetadata) : Bool { video.uploader == caller });
    };

    public query func getFeaturedVideos() : async [VideoMetadata] {
        let allVideos = Iter.toArray(textMap.vals(videos));
        Array.filter(allVideos, func(video : VideoMetadata) : Bool {
            video.isFeatured and (
                switch (textMap.get(moderationResults, video.id)) {
                    case (null) { true };
                    case (?result) { result.allowed };
                }
            )
        });
    };

    public shared ({ caller }) func setFeaturedStatus(videoId : Text, isFeatured : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can set featured status");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?video) {
                let updatedVideo = { video with isFeatured };
                videos := textMap.put(videos, videoId, updatedVideo);
            };
        };
    };

    public shared ({ caller }) func likeVideo(videoId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can like videos");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?video) {
                switch (textMap.get(moderationResults, videoId)) {
                    case (?result) {
                        if (not result.allowed) {
                            Debug.trap("Cannot like a blocked video");
                        };
                    };
                    case (null) {};
                };

                let currentLikes = switch (textMap.get(likes, videoId)) {
                    case (null) { List.nil<Principal>() };
                    case (?existingLikes) { existingLikes };
                };

                if (List.some<Principal>(currentLikes, func(p) { p == caller })) {
                    Debug.trap("User has already liked this video");
                };

                let updatedLikes = List.push(caller, currentLikes);
                likes := textMap.put(likes, videoId, updatedLikes);

                let updatedVideo = { video with likeCount = List.size(updatedLikes) };
                videos := textMap.put(videos, videoId, updatedVideo);
            };
        };
    };

    public shared ({ caller }) func unlikeVideo(videoId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can unlike videos");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?video) {
                switch (textMap.get(likes, videoId)) {
                    case (null) { Debug.trap("No likes found for this video") };
                    case (?existingLikes) {
                        if (not List.some<Principal>(existingLikes, func(p) { p == caller })) {
                            Debug.trap("User has not liked this video");
                        };

                        let updatedLikes = List.filter<Principal>(existingLikes, func(p) { p != caller });
                        likes := textMap.put(likes, videoId, updatedLikes);

                        let updatedVideo = { video with likeCount = List.size(updatedLikes) };
                        videos := textMap.put(videos, videoId, updatedVideo);
                    };
                };
            };
        };
    };

    public query func getLikeCount(videoId : Text) : async Nat {
        switch (textMap.get(likes, videoId)) {
            case (null) { 0 };
            case (?existingLikes) { List.size(existingLikes) };
        };
    };

    public shared ({ caller }) func addComment(videoId : Text, text : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can add comments");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?_) {
                switch (textMap.get(moderationResults, videoId)) {
                    case (?result) {
                        if (not result.allowed) {
                            Debug.trap("Cannot comment on a blocked video");
                        };
                    };
                    case (null) {};
                };

                let comment : Comment = {
                    id = debug_show (Time.now());
                    videoId;
                    author = caller;
                    text;
                    timestamp = Time.now();
                };

                let currentComments = switch (textMap.get(comments, videoId)) {
                    case (null) { List.nil<Comment>() };
                    case (?existingComments) { existingComments };
                };

                let updatedComments = List.push(comment, currentComments);
                comments := textMap.put(comments, videoId, updatedComments);
            };
        };
    };

    public query func getComments(videoId : Text) : async [Comment] {
        switch (textMap.get(comments, videoId)) {
            case (null) { [] };
            case (?existingComments) {
                let commentsArray = List.toArray(existingComments);
                Array.sort(
                    commentsArray,
                    func(a : Comment, b : Comment) : { #less; #equal; #greater } {
                        if (a.timestamp < b.timestamp) #less else if (a.timestamp == b.timestamp) #equal else #greater;
                    },
                );
            };
        };
    };

    public shared ({ caller }) func deleteComment(videoId : Text, commentId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete comments");
        };

        switch (textMap.get(comments, videoId)) {
            case (null) { Debug.trap("No comments found for this video") };
            case (?existingComments) {
                let commentToDelete = List.find<Comment>(existingComments, func(c) { c.id == commentId });

                switch (commentToDelete) {
                    case (null) { Debug.trap("Comment not found") };
                    case (?comment) {
                        if (comment.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                            Debug.trap("Unauthorized: Can only delete your own comments");
                        };

                        let updatedComments = List.filter<Comment>(existingComments, func(c) { c.id != commentId });
                        comments := textMap.put(comments, videoId, updatedComments);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func deleteVideo(videoId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete videos");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?video) {
                if (video.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                    Debug.trap("Unauthorized: Can only delete your own videos");
                };

                videos := textMap.delete(videos, videoId);
                comments := textMap.delete(comments, videoId);
                likes := textMap.delete(likes, videoId);
                moderationResults := textMap.delete(moderationResults, videoId);
            };
        };
    };

    public query func searchVideos(searchQuery : Text) : async [VideoMetadata] {
        let allVideos = Iter.toArray(textMap.vals(videos));
        Array.filter(allVideos, func(video : VideoMetadata) : Bool {
            let lowerQuery = Text.toLowercase(searchQuery);
            let titleMatch = Text.contains(Text.toLowercase(video.title), #text lowerQuery);
            let descMatch = Text.contains(Text.toLowercase(video.description), #text lowerQuery);
            let isAllowed = switch (textMap.get(moderationResults, video.id)) {
                case (null) { true };
                case (?result) { result.allowed };
            };
            (titleMatch or descMatch) and isAllowed;
        });
    };

    public query func getVideosByCategory(category : Text) : async [VideoMetadata] {
        let allVideos = Iter.toArray(textMap.vals(videos));
        Array.filter(allVideos, func(video : VideoMetadata) : Bool {
            let isAllowed = switch (textMap.get(moderationResults, video.id)) {
                case (null) { true };
                case (?result) { result.allowed };
            };
            video.category == category and isAllowed;
        });
    };

    public query func searchVideosByCategory(searchQuery : Text, category : Text) : async [VideoMetadata] {
        let allVideos = Iter.toArray(textMap.vals(videos));
        Array.filter(allVideos, func(video : VideoMetadata) : Bool {
            let lowerQuery = Text.toLowercase(searchQuery);
            let titleMatch = Text.contains(Text.toLowercase(video.title), #text lowerQuery);
            let descMatch = Text.contains(Text.toLowercase(video.description), #text lowerQuery);
            let isAllowed = switch (textMap.get(moderationResults, video.id)) {
                case (null) { true };
                case (?result) { result.allowed };
            };
            (titleMatch or descMatch) and (video.category == category) and isAllowed;
        });
    };

    public query func getAllCategories() : async [Text] {
        let allVideos = Iter.toArray(textMap.vals(videos));
        let categories = Array.map<VideoMetadata, Text>(allVideos, func(video : VideoMetadata) : Text { video.category });
        Array.sort<Text>(
            Array.map<Text, Text>(categories, func(c) { Text.toLowercase(c) }),
            func(a : Text, b : Text) : { #less; #equal; #greater } {
                if (a < b) #less else if (a == b) #equal else #greater;
            },
        );
    };

    public query ({ caller }) func getAdminPrincipalId() : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view their principal ID");
        };
        Principal.toText(caller);
    };

    public query ({ caller }) func verifyAdminAccess() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public shared ({ caller }) func storePermanentAdminPrincipal() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can store their principal");
        };
        permanentAdminPrincipal := ?caller;
    };

    public query ({ caller }) func getPermanentAdminPrincipal() : async ?Principal {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view stored admin principal");
        };
        permanentAdminPrincipal;
    };

    var configuration : ?Stripe.StripeConfiguration = null;

    public query func isStripeConfigured() : async Bool {
        switch (stripeConfigAndUrls.publishableKey, stripeConfigAndUrls.secretKey) {
            case (?_, ?_) { true };
            case _ { false };
        };
    };

    public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        configuration := ?config;
    };

    func getStripeConfiguration() : Stripe.StripeConfiguration {
        switch (configuration) {
            case (null) { Debug.trap("Stripe needs to be first configured") };
            case (?value) { value };
        };
    };

    public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can check session status");
        };
        await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
    };

    public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can create checkout sessions");
        };
        await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
    };

    public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
        OutCall.transform(input);
    };

    // ADMIN-ONLY: Get full Stripe config including secret key
    public query ({ caller }) func getFullStripeConfigAndUrls() : async StripeConfigAndUrls {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view full Stripe configuration");
        };

        stripeConfigAndUrls;
    };

    // PUBLIC: Get Stripe config excluding secret key
    public query func getPublicStripeConfigAndUrls() : async StripeConfigAndUrls {
        {
            stripeConfigAndUrls with
            secretKey = null
        };
    };

    func isEmptyOrNull(text : ?Text) : Bool {
        switch (text) {
            case (null) { true };
            case (?value) { value == "" };
        };
    };

    func isNullOrZero(value : ?Nat) : Bool {
        switch (value) {
            case (null) { true };
            case (?natValue) { natValue == 0 };
        };
    };

    // ADMIN-ONLY: Update Stripe config with partial updates
    public shared ({ caller }) func updateStripeConfigAndUrls(config : StripeConfigAndUrls) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update Stripe configuration");
        };

        if (not config.subscriptionsEnabled) {
            if (config.defaultPricing == null) {
                Debug.trap("Default pricing must be set when subscriptions are disabled");
            };
        };

        // Perform partial update only for non-null fields
        stripeConfigAndUrls := {
            publishableKey = if (isEmptyOrNull(config.publishableKey)) { null } else if (config.publishableKey != null) { config.publishableKey } else { stripeConfigAndUrls.publishableKey };
            secretKey = if (isEmptyOrNull(config.secretKey)) { null } else if (config.secretKey != null) { config.secretKey } else { stripeConfigAndUrls.secretKey };
            basicPlanUrl = if (isEmptyOrNull(config.basicPlanUrl)) { null } else if (config.basicPlanUrl != null) { config.basicPlanUrl } else { stripeConfigAndUrls.basicPlanUrl };
            creatorPlanUrl = if (isEmptyOrNull(config.creatorPlanUrl)) { null } else if (config.creatorPlanUrl != null) { config.creatorPlanUrl } else { stripeConfigAndUrls.creatorPlanUrl };
            proPlanUrl = if (isEmptyOrNull(config.proPlanUrl)) { null } else if (config.proPlanUrl != null) { config.proPlanUrl } else { stripeConfigAndUrls.proPlanUrl };
            subscriptionsEnabled = config.subscriptionsEnabled;
            defaultPricing = if (isNullOrZero(config.defaultPricing)) { null } else if (config.defaultPricing != null) { config.defaultPricing } else { stripeConfigAndUrls.defaultPricing };
        };
    };

    public type FreePlanDetails = {
        isActive : Bool;
        uploadsRemaining : Nat;
    };

    public query ({ caller }) func getFreePlanStatus() : async FreePlanDetails {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can have a Free plan");
        };

        let planData = getUserPlanData(caller);
        switch (planData.plan) {
            case (#free) {
                let remaining = if (planData.monthlyUploads >= 10) { 0 } else {
                    let result = 10 - planData.monthlyUploads : Int;
                    if (result <= 0) { 0 } else { Int.abs(result) };
                };
                {
                    isActive = true;
                    uploadsRemaining = remaining;
                };
            };
            case (#pro or #creatorPlus) {
                {
                    isActive = false;
                    uploadsRemaining = 0;
                };
            };
        };
    };

    public query ({ caller }) func getVideoProgress(videoId : Text) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can get video progress");
        };

        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?_) {
                let key : VideoHistoryKey = {
                    user = caller;
                    videoId;
                };
                switch (historyMap.get(videoHistory, key)) {
                    case (null) { 0 };
                    case (?progress) { progress };
                };
            };
        };
    };

    public shared ({ caller }) func saveVideoProgress(videoId : Text, progressInSeconds : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save video progress");
        };
        switch (textMap.get(videos, videoId)) {
            case (null) { Debug.trap("Video not found") };
            case (?_) {
                let key : VideoHistoryKey = {
                    user = caller;
                    videoId;
                };
                videoHistory := historyMap.put(videoHistory, key, progressInSeconds);
            };
        };
    };
};



