import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Bool "mo:core/Bool";
import List "mo:core/List";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";


import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // COMPONENTS
  // ==========
  let accessControlState = AccessControl.initState();
  include MixinStorage();
  include MixinAuthorization(accessControlState);

  // CONSTANTS
  // =========
  let ADMIN_USER = "vikaskharb00007@admin";
  let ADMIN_PASS = "Vikas00007@admin";
  let VISITOR_ADMIN_EMAIL = "vikaskharb00007@gmail.com";
  let VISITOR_ADMIN_PASS = "Miku03@love";

  let NANOS_PER_DAY : Int = 86_400_000_000_000;

  // TYPES
  // =====

  public type Timestamp = Time.Time;

  public type NumerologyUser = {
    username : Text;
    passwordHash : Text;
    sectionLevel : Nat;
  };

  public type UserProfile = {
    id : Principal;
    name : Text;
    email : Text;
    createdAt : Timestamp;
  };

  public type Service = {
    id : Nat;
    name : Text;
    price : Nat;
  };

  public type Person = {
    name : Text;
    dob : ?Text;
    tob : ?Text;
  };

  public type PalmPhoto = {
    blob : ?Storage.ExternalBlob;
  };

  public type Inquiry = {
    id : Text;
    serviceId : Nat;
    visitorName : Text;
    dob : ?Text;
    tob : ?Text;
    question : Text;
    pastLifeNotes : Text;
    handPicture : ?Storage.ExternalBlob;
    palmPhotos : [?Storage.ExternalBlob];
    relationshipPerson2 : ?Person;
    birthCountry : ?Text;
    city : ?Text;
    state : ?Text;
    seedNumber : ?Nat;
    submittedAt : Timestamp;
    authorId : ?Principal;
  };

  public type BlogPost = {
    id : Text;
    title : Text;
    content : Text;
    author : Text;
    createdAt : Timestamp;
    published : Bool;
  };

  public type VisitorID = {
    username : Text;
    password : Text;
    service : Text;
    visitorName : Text;
    createdAt : Timestamp;
    expiresAt : Timestamp;
  };

  public type Notice = {
    id : Text;
    title : Text;
    message : Text;
    createdAt : Timestamp;
    active : Bool;
  };

  public type VisitorQuery = {
    name : Text;
    contactInfo : Text;
    message : Text;
    submittedAt : Timestamp;
  };

  module BlogPost {
    public func compareByCreatedAt(b1 : BlogPost, b2 : BlogPost) : Order.Order {
      Int.compare(b2.createdAt, b1.createdAt);
    };
  };

  // STATE
  // =====
  let numerologyUsers = Map.empty<Text, NumerologyUser>();
  var nextInquiryId = 1;
  var nextBlogPostId = 1;
  var nextNoticeId = 1;
  var nextVisitorQueryId = 1;

  let predefinedServices = [
    { id = 1; name = "One Question"; price = 500 },
    { id = 2; name = "Matchmaking"; price = 1500 },
    { id = 3; name = "Muhurat"; price = 1500 },
    { id = 4; name = "Professional Advice"; price = 1100 },
    { id = 5; name = "Personal Phone Consultation"; price = 2500 },
    { id = 6; name = "Daily Pooja Muhurat"; price = 1100 },
  ];

  let inquiries = Map.empty<Text, Inquiry>();
  let blogPosts = Map.empty<Text, BlogPost>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let visitorIDs = Map.empty<Text, VisitorID>();
  let notices = Map.empty<Text, Notice>();
  let visitorQueries = Map.empty<Text, VisitorQuery>();
  // service name -> isPublic (false = private/requires ID)
  let serviceAccess = Map.empty<Text, Bool>();

  // GENERAL UTILITIES
  // =================
  func getNextInquiryId() : Text {
    let id = nextInquiryId;
    nextInquiryId += 1;
    id.toText();
  };

  func getNextBlogPostId() : Text {
    let id = nextBlogPostId;
    nextBlogPostId += 1;
    id.toText();
  };

  func getNextNoticeId() : Text {
    let id = nextNoticeId;
    nextNoticeId += 1;
    id.toText();
  };

  func getNextVisitorQueryId() : Text {
    let id = nextVisitorQueryId;
    nextVisitorQueryId += 1;
    id.toText();
  };

  func isValidAdminCreds(email : Text, pass : Text) : Bool {
    email == VISITOR_ADMIN_EMAIL and pass == VISITOR_ADMIN_PASS;
  };

  // SERVICE ACCESS CONTROL
  // ======================

  public shared func serviceSetPublic(adminEmail : Text, adminPassword : Text, service : Text, isPublic : Bool) : async () {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    serviceAccess.add(service, isPublic);
  };

  public query func serviceIsPublic(service : Text) : async Bool {
    switch (serviceAccess.get(service)) {
      case (null) { false };
      case (?v) { v };
    };
  };

  public query func serviceGetAllAccess(adminEmail : Text, adminPassword : Text) : async [(Text, Bool)] {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized");
    };
    serviceAccess.entries().toArray();
  };

  // VISITOR ID MANAGEMENT (email/password auth, no II required)
  // ===========================================================

  public shared func adminCreateVisitorId(adminEmail : Text, adminPassword : Text, service : Text, visitorName : Text, username : Text, password : Text, expiryDays : Nat) : async () {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    if (expiryDays != 30 and expiryDays != 180 and expiryDays != 365) {
      Runtime.trap("Invalid expiry days: must be 30, 180, or 365");
    };
    if (service != "astro-chart" and service != "numerology" and service != "horary") {
      Runtime.trap("Invalid service");
    };
    let now = Time.now();
    let expiresAt = now + (Int.fromNat(expiryDays) * NANOS_PER_DAY);
    let newID : VisitorID = {
      username;
      password;
      service;
      visitorName;
      createdAt = now;
      expiresAt;
    };
    visitorIDs.add(username, newID);
  };

  public query func adminListVisitorIds(adminEmail : Text, adminPassword : Text) : async [VisitorID] {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    visitorIDs.values().toArray();
  };

  public shared func adminDeleteVisitorId(adminEmail : Text, adminPassword : Text, username : Text) : async () {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    visitorIDs.remove(username);
  };

  // VISITOR ID MANAGEMENT (II-based, kept for compatibility)
  // =========================================================

  public shared ({ caller }) func visitorCreateId(adminEmail : Text, adminPassword : Text, service : Text, visitorName : Text, username : Text, password : Text, expiryDays : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create visitor IDs");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    if (expiryDays != 30 and expiryDays != 180 and expiryDays != 365) {
      Runtime.trap("Invalid expiry days: must be 30, 180, or 365");
    };
    if (service != "astro-chart" and service != "numerology" and service != "horary") {
      Runtime.trap("Invalid service: must be astro-chart, numerology, or horary");
    };
    let now = Time.now();
    let expiresAt = now + (Int.fromNat(expiryDays) * NANOS_PER_DAY);
    let newID : VisitorID = {
      username;
      password;
      service;
      visitorName;
      createdAt = now;
      expiresAt;
    };
    visitorIDs.add(username, newID);
  };

  public query func visitorValidateId(service : Text, username : Text, password : Text) : async Bool {
    switch (visitorIDs.get(username)) {
      case (null) { false };
      case (?vid) {
        if (vid.service != service) {
          return false;
        };
        if (vid.password != password) {
          return false;
        };
        if (Time.now() > vid.expiresAt) {
          return false;
        };
        true;
      };
    };
  };

  public query ({ caller }) func visitorListIds(adminEmail : Text, adminPassword : Text) : async [VisitorID] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list visitor IDs");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    visitorIDs.values().toArray();
  };

  public shared ({ caller }) func visitorDeleteId(adminEmail : Text, adminPassword : Text, username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete visitor IDs");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    visitorIDs.remove(username);
  };

  // NUMEROLOGY USER MANAGEMENT
  // ==========================

  public func numerologyLogin(username : Text, password : Text) : async Nat {
    switch (numerologyUsers.get(username)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (user.passwordHash == password) {
          user.sectionLevel;
        } else {
          Runtime.trap("Wrong password");
        };
      };
    };
  };

  public shared ({ caller }) func numerologyCreateUser(adminUsername : Text, adminPassword : Text, username : Text, password : Text, sectionLevel : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create numerology users");
    };
    if (adminUsername != ADMIN_USER or adminPassword != ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid numerology admin credentials");
    };
    if (sectionLevel < 1 or sectionLevel > 9) {
      Runtime.trap("Section level must be between 1-9");
    };
    let newUser = {
      username;
      passwordHash = password;
      sectionLevel;
    };
    numerologyUsers.add(username, newUser);
  };

  public query ({ caller }) func numerologyListUsers(adminUsername : Text, adminPassword : Text) : async [NumerologyUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list numerology users");
    };
    if (adminUsername != ADMIN_USER or adminPassword != ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid numerology admin credentials");
    };
    numerologyUsers.values().toArray();
  };

  public shared ({ caller }) func numerologyDeleteUser(adminUsername : Text, adminPassword : Text, username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete numerology users");
    };
    if (adminUsername != ADMIN_USER or adminPassword != ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid numerology admin credentials");
    };
    numerologyUsers.remove(username);
  };

  // USER PROFILES
  // =============
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.id != caller) {
      Runtime.trap("Unauthorized: You can only update your own profile");
    };

    let updatedProfile : UserProfile = switch (userProfiles.get(profile.id)) {
      case (null) { { profile with createdAt = Time.now() } : UserProfile };
      case (?existing) {
        { profile with createdAt = existing.createdAt } : UserProfile;
      };
    };
    userProfiles.add(profile.id, updatedProfile);
  };

  // SERVICES
  // ========
  public query func getServices() : async [Service] {
    predefinedServices;
  };

  // BLOG POSTS
  // ==========
  public query func getAllPosts() : async [BlogPost] {
    blogPosts.values().toArray().filter(func(post) { post.published }).sort(BlogPost.compareByCreatedAt);
  };

  public query ({ caller }) func getAllPostsAdmin() : async [BlogPost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all posts");
    };
    blogPosts.values().toArray().sort(BlogPost.compareByCreatedAt);
  };

  public shared ({ caller }) func createPost(title : Text, content : Text, author : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create posts");
    };
    if (title.size() < 5) {
      Runtime.trap("Title must be at least 5 characters");
    };
    if (content.size() < 20) {
      Runtime.trap("Content must be at least 20 characters");
    };
    let newPost = {
      id = getNextBlogPostId();
      title;
      content;
      author;
      createdAt = Time.now();
      published = false;
    };
    blogPosts.add(newPost.id, newPost);
    newPost.id;
  };

  public shared ({ caller }) func updatePost(id : Text, title : Text, content : Text, author : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update posts");
    };
    let post = switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
    if (title.size() < 5) {
      Runtime.trap("Title must be at least 5 characters");
    };
    if (content.size() < 20) {
      Runtime.trap("Content must be at least 20 characters");
    };
    let updatedPost : BlogPost = { post with title; content; author };
    blogPosts.add(id, updatedPost);
  };

  public shared ({ caller }) func deletePost(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete posts");
    };
    blogPosts.remove(id);
  };

  public shared ({ caller }) func publishPost(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can publish posts");
    };
    let post = switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
    let updatedPost : BlogPost = { post with published = true };
    blogPosts.add(id, updatedPost);
  };

  // INQUIRIES
  // =========
  public shared ({ caller }) func submitInquiry(inquiry : Inquiry) : async Text {
    let newId = getNextInquiryId();
    let newInquiry : Inquiry = {
      inquiry with
      id = newId;
      submittedAt = Time.now();
    };
    inquiries.add(newId, newInquiry);
    newId;
  };

  public query ({ caller }) func getAllInquiries() : async [Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all inquiries");
    };
    inquiries.values().toArray().sort(
      func(i1, i2) {
        Int.compare(i2.submittedAt, i1.submittedAt);
      }
    );
  };

  public shared ({ caller }) func deleteInquiry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete inquiries");
    };
    inquiries.remove(id);
  };

  // VISITOR QUERIES (contact form submissions)
  // ==========================================
  public shared func submitVisitorQuery(name : Text, contactInfo : Text, message : Text) : async () {
    let newQuery : VisitorQuery = {
      name;
      contactInfo;
      message;
      submittedAt = Time.now();
    };
    visitorQueries.add(getNextVisitorQueryId(), newQuery);
  };

  public query func adminGetVisitorQueries(adminEmail : Text, adminPassword : Text) : async [VisitorQuery] {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized");
    };
    visitorQueries.values().toArray().sort(
      func(q1, q2) {
        Int.compare(q2.submittedAt, q1.submittedAt);
      }
    );
  };

  // kept for backward compat
  public query ({ caller }) func getVisitorQueries() : async [VisitorQuery] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    visitorQueries.values().toArray().sort(
      func(q1, q2) {
        Int.compare(q2.submittedAt, q1.submittedAt);
      }
    );
  };

  // NOTICE BOARD
  // ============
  public shared func adminCreateNotice(adminEmail : Text, adminPassword : Text, title : Text, message : Text) : async Text {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized");
    };
    let newNotice : Notice = {
      id = getNextNoticeId();
      title;
      message;
      createdAt = Time.now();
      active = true;
    };
    notices.add(newNotice.id, newNotice);
    newNotice.id;
  };

  public query func adminListNotices(adminEmail : Text, adminPassword : Text) : async [Notice] {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized");
    };
    notices.values().toArray().sort(
      func(n1, n2) {
        Int.compare(n2.createdAt, n1.createdAt);
      }
    );
  };

  public shared func adminDeleteNotice(adminEmail : Text, adminPassword : Text, id : Text) : async () {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized");
    };
    notices.remove(id);
  };

  public shared func adminToggleNotice(adminEmail : Text, adminPassword : Text, id : Text) : async () {
    if (not isValidAdminCreds(adminEmail, adminPassword)) {
      Runtime.trap("Unauthorized");
    };
    let notice = switch (notices.get(id)) {
      case (null) { Runtime.trap("Notice not found") };
      case (?n) { n };
    };
    let updatedNotice : Notice = { notice with active = not notice.active };
    notices.add(id, updatedNotice);
  };

  public shared ({ caller }) func noticeCreate(adminEmail : Text, adminPassword : Text, title : Text, message : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create notices");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    let newNotice : Notice = {
      id = getNextNoticeId();
      title;
      message;
      createdAt = Time.now();
      active = true;
    };
    notices.add(newNotice.id, newNotice);
    newNotice.id;
  };

  public query func noticeList() : async [Notice] {
    notices.values().toArray().filter(func(n) { n.active }).sort(
      func(n1, n2) {
        Int.compare(n2.createdAt, n1.createdAt);
      }
    );
  };

  public query ({ caller }) func noticeListAll(adminEmail : Text, adminPassword : Text) : async [Notice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all notices");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    notices.values().toArray().sort(
      func(n1, n2) {
        Int.compare(n2.createdAt, n1.createdAt);
      }
    );
  };

  public shared ({ caller }) func noticeDelete(adminEmail : Text, adminPassword : Text, id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete notices");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    notices.remove(id);
  };

  public shared ({ caller }) func noticeToggleActive(adminEmail : Text, adminPassword : Text, id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle notice status");
    };
    if (adminEmail != VISITOR_ADMIN_EMAIL or adminPassword != VISITOR_ADMIN_PASS) {
      Runtime.trap("Unauthorized: Invalid admin credentials");
    };
    let notice = switch (notices.get(id)) {
      case (null) { Runtime.trap("Notice not found") };
      case (?n) { n };
    };
    let updatedNotice : Notice = { notice with active = not notice.active };
    notices.add(id, updatedNotice);
  };
};
