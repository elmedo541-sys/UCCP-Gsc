import Home from "./pages/Home";
import Register from "./pages/Register";
import UserLogin from "./pages/UserLogin";
import ForgotPassword from "./pages/ForgotPassword";
import UserProfile from "./pages/UserProfile";
import Feed from "./pages/Feed";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import HomepageImagesManager from "./pages/HomepageImagesManager";
import AdminManagement from "./pages/AdminManagement";
import Presentation from "./pages/Presentation";
import MediaGallery from "./pages/MediaGallery";
import Events from "./pages/Events";
import MemberDirectory from "./pages/MemberDirectory";
import PrayerRequests from "./pages/PrayerRequests";
import AdminEvents from "./pages/AdminEvents";
import NotFound from "./pages/NotFound";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <Home />,
    },
    {
      path: "/register",
      name: 'register',
      element: <Register />,
    },
    {
      path: "/user/login",
      name: 'user-login',
      element: <UserLogin />,
    },
    {
      path: "/user/forgot-password",
      name: 'forgot-password',
      element: <ForgotPassword />,
    },
    {
      path: "/user/profile",
      name: 'user-profile',
      element: <UserProfile />,
    },
    {
      path: "/feed",
      name: 'feed',
      element: <Feed />,
    },
    {
      path: "/admin/login",
      name: 'admin-login',
      element: <AdminLogin />,
    },
    {
      path: "/admin/dashboard",
      name: 'admin-dashboard',
      element: <AdminDashboard />,
    },
    {
      path: "/admin/homepage-images",
      name: 'homepage-images-manager',
      element: <HomepageImagesManager />,
    },
    {
      path: "/admin/manage-admins",
      name: 'admin-management',
      element: <AdminManagement />,
    },
    {
      path: "/presentation",
      name: 'presentation',
      element: <Presentation />,
    },
    {
      path: "/gallery",
      name: 'media-gallery',
      element: <MediaGallery />,
    },
    {
      path: "/events",
      name: 'events',
      element: <Events />,
    },
    {
      path: "/directory",
      name: 'member-directory',
      element: <MemberDirectory />,
    },
    {
      path: "/prayer-requests",
      name: 'prayer-requests',
      element: <PrayerRequests />,
    },
    {
      path: "/admin/events",
      name: 'admin-events',
      element: <AdminEvents />,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;