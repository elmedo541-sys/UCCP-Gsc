import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Film, Calendar, Users, Heart, MapPin, Clock, MessageSquare, Download, Lock, ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ChatSupportWidget from "@/components/ChatSupportWidget";
import { useUserAuth } from "@/hooks/useUserAuth";
import UserMenu from "@/components/UserMenu";
import { useAppUpdateAvailable } from "@/hooks/useAppUpdateAvailable";
import InstallAppModal from "@/components/InstallAppModal";
import { isStandalone } from "@/lib/installPrompt";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import "./Home.css";

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
  const [paused, setPaused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name: string; profile_picture: string | null } | null>(null);

  const updateAvailable = useAppUpdateAvailable();
  const [showUpdateAnim, setShowUpdateAnim] = useState(false);
  // ── Install app button ──
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [loginPromptFeature, setLoginPromptFeature] = useState<string | null>(null);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  useEffect(() => {
    setAlreadyInstalled(isStandalone()); // hide only if already installed
  }, []);
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

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setCurrentImageIndex(index => (index + 1) % images.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  const currentImage = images[currentImageIndex];
  useEffect(() => setImageFailed(false), [currentImage?.image_url]);

  const openMemberPage = (path: string, label: string) => {
    if (isLoggedIn) navigate(path);
    else setLoginPromptFeature(label);
  };
  const moveSlide = (direction: number) => {
    setPaused(true);
    setCurrentImageIndex(index => (index + direction + images.length) % images.length);
  };

  return (
    <div className="gsc-home">
      <a className="gsc-skip" href="#main-content">Skip to content</a>
      <header className="gsc-header">
        <div className="gsc-wrap gsc-header-inner">
          <a href="/" className="gsc-brand">
            <img src="/uccp-logo-transparent.png" alt="UCCP logo" width="52" height="52" />
            <span><small>UNITED CHURCH OF CHRIST IN THE PHILIPPINES</small><strong>Good Samaritan Church</strong></span>
          </a>
          <nav aria-label="Main navigation" className="gsc-nav">
            <a href="#church-life">Church life</a>
            <a href="#upcoming-events">Events</a>
            <button onClick={() => openMemberPage('/gallery', 'Gallery')}>Gallery</button>
          </nav>
          <div className="gsc-account">
            {isLoggedIn && userProfile ? <UserMenu name={userProfile.full_name} picture={userProfile.profile_picture} /> : <>
              <Button variant="ghost" onClick={() => navigate('/user/login')}>Log in</Button>
              <Button className="gsc-primary" onClick={() => navigate('/register')}>Register <UserPlus className="ml-2 h-4 w-4" /></Button>
            </>}
          </div>
        </div>
      </header>
      {showUpdateAnim && <div className="gsc-update" role="status">Updating the website…</div>}
      <main id="main-content">
        <section className="gsc-hero" aria-label="Welcome to Good Samaritan Church">
          {currentImage && !imageFailed && <img className="gsc-hero-photo" src={currentImage.image_url} alt={currentImage.title || 'Good Samaritan Church community'} onError={() => setImageFailed(true)} fetchPriority="high" />}
          <div className="gsc-hero-shade" />
          <div className="gsc-wrap gsc-hero-content">
            <p className="gsc-eyebrow">FAITH · FELLOWSHIP · SERVICE</p>
            <h1>Welcome to<br /><span>Good Samaritan Church.</span></h1>
            <p className="gsc-hero-description">A place to worship, serve, and grow together. Stay connected with our church family and the life of our community.</p>
            <div className="gsc-hero-actions">
              <Button size="lg" className="gsc-gold" onClick={() => isLoggedIn ? navigate('/feed') : navigate('/register')}>{isLoggedIn ? 'Open community feed' : 'Register as a member'}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              <a className="gsc-hero-link" href="#upcoming-events">See upcoming events <ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>
          {images.length > 1 && <div className="gsc-wrap gsc-slideshow">
            <p>{currentImage?.title || 'Church life'}<span>{currentImageIndex + 1} / {images.length}</span></p>
            <div className="gsc-slide-controls">
              <button aria-label="Previous photo" onClick={() => moveSlide(-1)}><ChevronLeft /></button>
              <button aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused(value => !value)}>{paused ? <Play /> : <Pause />}</button>
              <button aria-label="Next photo" onClick={() => moveSlide(1)}><ChevronRight /></button>
            </div>
          </div>}
        </section>
        <section className="gsc-intro gsc-wrap" id="church-life">
          <div><p className="gsc-eyebrow">OUR CHURCH COMMUNITY</p><h2>Connected through faith.<br />Present for one another.</h2></div>
          <div><p>Find church updates, share moments from our activities, and keep in touch with fellow members—all in one place.</p><button className="gsc-text-link" onClick={() => navigate('/presentation')}>New here? Learn how to use the website <ArrowRight className="h-4 w-4" /></button></div>
        </section>
        <section className="gsc-events-section" id="upcoming-events">
          <div className="gsc-wrap">
            <div className="gsc-section-heading"><div><p className="gsc-eyebrow">WHAT’S COMING UP</p><h2>Events & announcements</h2></div><button className="gsc-text-link" onClick={() => openMemberPage('/events', 'Events')}>View all events <ArrowRight className="h-4 w-4" /></button></div>
            {upcomingEvents.length > 0 ? <div className="gsc-event-grid">{upcomingEvents.map(event => {
              const date = new Date(event.event_date + 'T00:00:00');
              return <button key={event.id} className="gsc-event-card" onClick={() => openMemberPage('/events', 'Events')}>
                <div className="gsc-event-date"><span>{date.toLocaleDateString('en-US', { month: 'short' })}</span><strong>{date.getDate()}</strong></div>
                <div><Badge variant="outline">{event.category}</Badge><h3>{event.title}</h3>{event.event_time && <p><Clock />{event.event_time.slice(0, 5)}</p>}{event.location && <p><MapPin />{event.location}</p>}</div>
              </button>;
            })}</div> : <div className="gsc-empty"><Calendar /><div><h3>Watch this space for upcoming activities.</h3><p>Church events and announcements will appear here when posted.</p></div></div>}
          </div>
        </section>
        <section className="gsc-wrap gsc-member-section">
          <div className="gsc-section-heading"><div><p className="gsc-eyebrow">FOR OUR MEMBERS</p><h2>Your church, within reach.</h2></div>{!isLoggedIn && <p className="gsc-member-note"><Lock className="h-4 w-4" />Log in to access member features</p>}</div>
          <div className="gsc-member-grid">{[
            { label: 'Community feed', icon: MessageSquare, path: '/feed', desc: 'Read updates and share with fellow members.' },
            { label: 'Member directory', icon: Users, path: '/directory', desc: 'Find and connect with your church family.' },
            { label: 'Prayer wall', icon: Heart, path: '/prayer-requests', desc: 'Share a prayer request and pray for others.' },
            { label: 'Photo & video gallery', icon: Film, path: '/gallery', desc: 'Look back on worship, fellowship, and service.' },
          ].map(({ label, icon: Icon, path, desc }) => <button className="gsc-member-card" key={path} onClick={() => openMemberPage(path, label)}><Icon /><h3>{label}</h3><p>{desc}</p><span>{isLoggedIn ? 'Open' : 'Members only'}<ArrowRight className="h-4 w-4" /></span></button>)}</div>
        </section>
      </main>
      <footer className="gsc-footer">
        <div className="gsc-wrap gsc-footer-main"><div className="gsc-footer-brand"><img src="/uccp-logo-transparent.png" alt="" width="48" height="48" /><div><strong>Good Samaritan Church</strong><p>United Church of Christ in the Philippines</p></div></div><div className="gsc-footer-links"><button onClick={() => navigate('/presentation')}>Website guide</button>{!alreadyInstalled && <button onClick={() => setShowInstallModal(true)}><Download className="h-4 w-4" />Install app</button>}<button onClick={() => navigate('/admin/login')}>Admin access</button></div></div>
        <div className="gsc-wrap gsc-footer-bottom"><p>© {new Date().getFullYear()} UCCP–Good Samaritan Church. All rights reserved.</p><span>Faith. Fellowship. Service.</span></div>
      </footer>
      <Dialog open={!!loginPromptFeature} onOpenChange={open => !open && setLoginPromptFeature(null)}>
        <DialogContent className="max-w-sm"><DialogTitle>Sign in to your church account</DialogTitle><DialogDescription>{loginPromptFeature} is available to registered members. Log in or register to continue.</DialogDescription><div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" onClick={() => { setLoginPromptFeature(null); navigate('/user/login'); }}>Log in</Button><Button className="flex-1" onClick={() => { setLoginPromptFeature(null); navigate('/register'); }}>Register</Button></div></DialogContent>
      </Dialog>
      <ChatSupportWidget />
      <InstallAppModal open={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
}
