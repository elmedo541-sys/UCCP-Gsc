import { lazy, Suspense } from "react";
import PageLoader from "@/components/PageLoader";

// Lazy-load every route so the browser only downloads the code for the
// page the visitor is actually on, instead of one giant bundle up front.
const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const UserLogin = lazy(() => import("./pages/UserLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Feed = lazy(() => import("./pages/Feed"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HomepageImagesManager = lazy(() => import("./pages/HomepageImagesManager"));
const AdminManagement = lazy(() => import("./pages/AdminManagement"));
const Presentation = lazy(() => import("./pages/Presentation"));
const MediaGallery = lazy(() => import("./pages/MediaGallery"));
const Events = lazy(() => import("./pages/Events"));
const MemberDirectory = lazy(() => import("./pages/MemberDirectory"));
const PrayerRequests = lazy(() => import("./pages/PrayerRequests"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Wraps a lazy page in Suspense with a lightweight fallback so navigating
// between routes shows a quick spinner instead of a blank white screen.
function withSuspense(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export const routers = [
    {
      path: "/",
      name: 'home',
      element: withSuspense(Home),
    },
    {
      path: "/register",
      name: 'register',
      element: withSuspense(Register),
    },
    {
      path: "/user/login",
      name: 'user-login',
      element: withSuspense(UserLogin),
    },
    {
      path: "/user/forgot-password",
      name: 'forgot-password',
      element: withSuspense(ForgotPassword),
    },
    {
      path: "/user/profile",
      name: 'user-profile',
      element: withSuspense(UserProfile),
    },
    {
      path: "/feed",
      name: 'feed',
      element: withSuspense(Feed),
    },
    {
      path: "/admin/login",
      name: 'admin-login',
      element: withSuspense(AdminLogin),
    },
    {
      path: "/admin/dashboard",
      name: 'admin-dashboard',
      element: withSuspense(AdminDashboard),
    },
    {
      path: "/admin/homepage-images",
      name: 'homepage-images-manager',
      element: withSuspense(HomepageImagesManager),
    },
    {
      path: "/admin/manage-admins",
      name: 'admin-management',
      element: withSuspense(AdminManagement),
    },
    {
      path: "/presentation",
      name: 'presentation',
      element: withSuspense(Presentation),
    },
    {
      path: "/gallery",
      name: 'media-gallery',
      element: withSuspense(MediaGallery),
    },
    {
      path: "/events",
      name: 'events',
      element: withSuspense(Events),
    },
    {
      path: "/directory",
      name: 'member-directory',
      element: withSuspense(MemberDirectory),
    },
    {
      path: "/prayer-requests",
      name: 'prayer-requests',
      element: withSuspense(PrayerRequests),
    },
    {
      path: "/admin/events",
      name: 'admin-events',
      element: withSuspense(AdminEvents),
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: withSuspense(NotFound),
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;