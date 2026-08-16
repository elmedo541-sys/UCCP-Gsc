import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, LogIn, BookOpen, Film, Calendar, Users, Heart, MapPin, Clock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ChatSupportWidget from "@/components/ChatSupportWidget";
import { useUserAuth } from "@/hooks/useUserAuth";
import UserMenu from "@/components/UserMenu";
import { useAppUpdateAvailable } from "@/hooks/useAppUpdateAvailable";

interface HomepageImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  category: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, personId } = useUserAuth();
  const [images, setImages] = useState<HomepageImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name: string; profile_picture: string | null } | null>(null);

  // ── Logo update animation ──
  const updateAvailable = useAppUpdateAvailable();
  const [showUpdateAnim, setShowUpdateAnim] = useState(false);
  useEffect(() => {
    if (!updateAvailable) return;
    setShowUpdateAnim(true);
    const timer = setTimeout(() => window.location.reload(), 1200);
    return () => clearTimeout(timer);
  }, [updateAvailable]);

  // Fetch logged-in user's name/photo for the header menu
  useEffect(() => {
    if (!isLoggedIn || !personId) { setUserProfile(null); return; }
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('people')
        .select('full_name, profile_picture')
        .eq('uuid', personId)
        .maybeSingle();
      if (data) setUserProfile({ full_name: data.full_name ?? 'Me', profile_picture: data.profile_picture ?? null });
    };
    fetchProfile();
  }, [isLoggedIn, personId]);

  // Fetch homepage images
  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('homepage_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setImages(data);
      }
    };

    fetchImages();
  }, []);

  // Fetch upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('events')
        .select('id, title, event_date, event_time, location, category')
        .eq('is_active', true)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(3);
      setUpcomingEvents((data || []) as Event[]);
    };
    fetchEvents();
  }, []);

  // Auto-advance slideshow every 4 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 500); // Transition duration
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const currentImage = images[currentImageIndex] || {
    image_url: 'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/0fa8.png',
    title: 'Welcome to GSC Members Profile Registration',
    description: 'Join our community and stay connected with the church family',
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header with Logo */}
      <header className="w-full bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 justify-center">
            <div className="relative inline-flex">
              {showUpdateAnim && <span className="logo-update-ring" aria-hidden="true" />}
              <img
                src="/uccp-logo.png"
                alt="UCCP-Good Samaritan Church Logo"
                className={`h-12 w-12 sm:h-16 sm:w-16 object-contain flex-shrink-0 ${
                  showUpdateAnim ? 'animate-logo-updating' : 'animate-logo-breathe'
                }`}
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 text-center sm:text-left leading-tight">UCCP-Good Samaritan Church</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/feed")}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
            </Button>
            {isLoggedIn && userProfile ? (
              <UserMenu name={userProfile.full_name} picture={userProfile.profile_picture} />
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/user/login")}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Register</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Slideshow */}
      <div className="relative">
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden relative">
          {/* Slideshow Images */}
          <div className={`w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <img 
              src={currentImage.image_url}
              alt={currentImage.title || 'Church'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
          
          {/* Slideshow Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white w-8' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Welcome Text Overlay — first slide only */}
          {currentImageIndex === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className={`max-w-4xl mx-auto space-y-6 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                Welcome to
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white drop-shadow-2xl">
                {currentImage.title || 'GSC Members Profile Registration'}
              </h3>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg mt-4">
                {currentImage.description || 'Join our community of faith and fellowship. Register today to become part of our growing church family.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    onClick={() => navigate("/feed")}
                    className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl text-lg px-8"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Go to Feed
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg"
                      onClick={() => navigate("/register")}
                      className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl text-lg px-8"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Register Now
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/user/login")}
                      className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 shadow-xl text-lg px-8"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Member Login
                    </Button>
                  </>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/presentation")}
                  className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 shadow-xl text-lg px-8"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  How to Use
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Easy Registration</h3>
            <p className="text-slate-600">
              Simple and quick registration process to join our church community
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Community</h3>
            <p className="text-slate-600">
              Be part of a vibrant and supportive church community
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Profile Management</h3>
            <p className="text-slate-600">
              Manage your information and stay connected with the church
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
                View All
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate('/events')}
                  className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                      <p className="text-xs font-semibold text-primary uppercase leading-none">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-lg font-bold text-primary leading-none">
                        {new Date(event.event_date).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1">{event.category}</Badge>
                      <p className="font-semibold text-foreground text-sm line-clamp-1">{event.title}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {event.event_time && (
                      <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{event.event_time}</p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Explore More</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {[
            { label: 'Community Feed', icon: MessageSquare, path: '/feed', desc: 'Posts & updates', color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Member Directory', icon: Users, path: '/directory', desc: 'Browse all church members', color: 'text-blue-600 bg-blue-50' },
            { label: 'Events', icon: Calendar, path: '/events', desc: 'Upcoming services & activities', color: 'text-purple-600 bg-purple-50' },
            { label: 'Prayer Wall', icon: Heart, path: '/prayer-requests', desc: 'Share & pray together', color: 'text-rose-600 bg-rose-50' },
            { label: 'Gallery', icon: Film, path: '/gallery', desc: 'Photos & videos', color: 'text-green-600 bg-green-50' },
          ].map(({ label, icon: Icon, path, desc, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/uccp-logo-transparent.png"
              alt="UCCP Logo"
              className="h-12 w-12 object-contain"
            />
            <div className="text-left">
              <p className="font-bold">UCCP-Good Samaritan Church</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            © 2024 GSC Members Profile Registration. All rights reserved.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/login')}
            className="text-slate-400 hover:text-white text-xs"
          >
            Admin Access
          </Button>
        </div>
      </footer>
      <ChatSupportWidget />
    </div>
  );
}