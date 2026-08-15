import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ShieldCheck, Eye, Pencil,
  UserPlus, LogIn, User, BarChart2, Download, Trash2,
  Edit, Image, Menu, X, ZoomIn, LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Images ────────────────────────────────────────────────────────────────────
const IMG = {
  register:    'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_register_form_351cb3d9.png',
  login:       'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_user_login_8ff91421.png',
  profile:     'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_user_profile_0254be7d.png',
  dashboard:   'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_admin_dashboard_79fd1c22.png',
  memberTable: 'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_member_table_d92b4ec2.png',
  editMember:  'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_edit_member_4cd95007.png',
  manageAdmins:'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_manage_admins_8756256e.png',
  homepageImg: 'https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/step_homepage_images_f03dd836.png',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type Role = 'welcome' | 'user' | 'viewer' | 'editor' | 'superadmin';

interface Slide {
  role: Role;
  section: string;
  stepNum?: number;
  totalSteps?: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
  image?: string;
  isCover?: boolean;
  permissions?: { allowed: string[]; denied: string[] };
}

// ─── Slide definitions ─────────────────────────────────────────────────────────
const SLIDES: Slide[] = [
  // ── WELCOME ──────────────────────────────────────────────────────────────────
  {
    role: 'welcome', section: 'Welcome', isCover: true,
    icon: <ShieldCheck className="w-10 h-10" />,
    title: 'UCCP-GSC Member System',
    description: 'A step-by-step guide to using the membership portal. This presentation covers how to use the system as a Member, Admin Viewer, Admin Editor, or Super Admin.',
    image: IMG.dashboard,
  },

  // ── MEMBER ───────────────────────────────────────────────────────────────────
  {
    role: 'user', section: 'For Members', stepNum: 1, totalSteps: 4,
    icon: <UserPlus className="w-5 h-5" />,
    title: 'Step 1 — Open the Registration Form',
    description: 'Visit the homepage and click the "Register Now" button. This opens the membership registration form where you will fill in all your personal information.',
    tip: 'Make sure to prepare your personal details before filling the form — name, birthday, contact info.',
    image: IMG.register,
  },
  {
    role: 'user', section: 'For Members', stepNum: 2, totalSteps: 4,
    icon: <UserPlus className="w-5 h-5" />,
    title: 'Step 2 — Fill In Your Details',
    description: 'Complete all required fields: First Name, Last Name, Date of Birth, Gender, Marital Status, Organization (CYAF, CYF, CWA, UCM, or Children), Email, and Password. Then click "Register".',
    tip: 'All fields marked with * are required. Double-check your email — it will be used to log in.',
    image: IMG.register,
  },
  {
    role: 'user', section: 'For Members', stepNum: 3, totalSteps: 4,
    icon: <LogIn className="w-5 h-5" />,
    title: 'Step 3 — Log In to Your Account',
    description: 'After registering, go to "Member Login" from the homepage. Enter your email address and password, then click "Login" to access your account.',
    tip: 'Forgot your password? Click "Forgot Password?" on the login page to receive a reset link via email.',
    image: IMG.login,
  },
  {
    role: 'user', section: 'For Members', stepNum: 4, totalSteps: 4,
    icon: <User className="w-5 h-5" />,
    title: 'Step 4 — View & Update Your Profile',
    description: 'Once logged in, your profile page shows all your registered information. Click "Edit Profile" to update your address, phone number, occupation, or profile picture.',
    tip: 'Keep your profile up to date so the church records are always accurate.',
    image: IMG.profile,
  },

  // ── VIEWER ───────────────────────────────────────────────────────────────────
  {
    role: 'viewer', section: 'Admin: Viewer', stepNum: 1, totalSteps: 4,
    icon: <LogIn className="w-5 h-5" />,
    title: 'Step 1 — Log In as Admin',
    description: 'Go to /admin/login and enter the admin username and password given to you by the Super Admin. Viewer accounts can only read data — no editing is allowed.',
    tip: 'Contact the Super Admin if you have not received your login credentials yet.',
    image: IMG.login,
  },
  {
    role: 'viewer', section: 'Admin: Viewer', stepNum: 2, totalSteps: 4,
    icon: <BarChart2 className="w-5 h-5" />,
    title: 'Step 2 — Explore the Dashboard',
    description: 'The dashboard displays colorful charts: Organization breakdown, Gender distribution, Marital Status, and Birthdays by Month. Stat cards at the top show total counts per organization.',
    tip: 'Click on any stat card (CYAF, CYF, etc.) to filter the member list by that organization.',
    image: IMG.dashboard,
  },
  {
    role: 'viewer', section: 'Admin: Viewer', stepNum: 3, totalSteps: 4,
    icon: <Eye className="w-5 h-5" />,
    title: 'Step 3 — Browse the Member List',
    description: 'Scroll down to see the full member table. Each row shows the member\'s name, organization badge, age, gender, and marital status. Use the search bar to find a specific member.',
    tip: 'Click on any member row to open a detail panel on the right showing their complete profile.',
    image: IMG.memberTable,
  },
  {
    role: 'viewer', section: 'Admin: Viewer', stepNum: 4, totalSteps: 4,
    icon: <Eye className="w-5 h-5" />,
    title: 'Viewer Permissions Summary',
    description: 'As a Viewer, you have read-only access. You can see all data and statistics but cannot make any changes to member records.',
    permissions: {
      allowed: ['View all member profiles', 'Browse statistics and charts', 'Filter by organization', 'Search members', 'View member details'],
      denied: ['Edit or delete members', 'Export data', 'Reset passwords', 'Manage admins or images'],
    },
  },

  // ── EDITOR ───────────────────────────────────────────────────────────────────
  {
    role: 'editor', section: 'Admin: Editor', stepNum: 1, totalSteps: 4,
    icon: <LogIn className="w-5 h-5" />,
    title: 'Step 1 — Log In as Editor Admin',
    description: 'Go to /admin/login and enter your Editor admin credentials. Editor accounts have full member management capabilities on top of all Viewer features.',
    tip: 'If you cannot log in, contact the Super Admin to verify your account credentials.',
    image: IMG.login,
  },
  {
    role: 'editor', section: 'Admin: Editor', stepNum: 2, totalSteps: 4,
    icon: <Edit className="w-5 h-5" />,
    title: 'Step 2 — Edit a Member\'s Profile',
    description: 'Click on any member row in the table to open their detail panel. Click the "Edit" button to modify their information — name, organization, marital status, contact details. Click "Save" when done.',
    tip: 'Only change information that the member has confirmed needs updating.',
    image: IMG.editMember,
  },
  {
    role: 'editor', section: 'Admin: Editor', stepNum: 3, totalSteps: 4,
    icon: <Trash2 className="w-5 h-5" />,
    title: 'Step 3 — Delete or Reset Members',
    description: 'In the member table, each row has "Reset" and "Delete" buttons. Reset sends a password reset email to the member. Delete permanently removes their record — a confirmation prompt will appear.',
    tip: 'Deletion is permanent. Always confirm with the church coordinator before removing a member.',
    image: IMG.memberTable,
  },
  {
    role: 'editor', section: 'Admin: Editor', stepNum: 4, totalSteps: 4,
    icon: <Download className="w-5 h-5" />,
    title: 'Step 4 — Export Data to Excel',
    description: 'Click the "Export to Excel" button at the top of the dashboard. This downloads the currently visible member list (with any active filters applied) as a spreadsheet (.xlsx) file.',
    tip: 'Apply an organization filter first if you only need to export one group (e.g., CYF members only).',
    image: IMG.dashboard,
  },

  // ── SUPER ADMIN ──────────────────────────────────────────────────────────────
  {
    role: 'superadmin', section: 'Super Admin', stepNum: 1, totalSteps: 4,
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Step 1 — Access Super Admin Features',
    description: 'After logging in as Super Admin, you will see two extra buttons in the top right of the dashboard: "Manage Admins" and "Homepage Images". These features are only visible to the Super Admin.',
    tip: 'The Super Admin account cannot be deleted. Keep its credentials safe.',
    image: IMG.dashboard,
  },
  {
    role: 'superadmin', section: 'Super Admin', stepNum: 2, totalSteps: 4,
    icon: <User className="w-5 h-5" />,
    title: 'Step 2 — Create a New Admin Account',
    description: 'Click "Manage Admins" to open the admin management page. Enter a username and password for the new admin, then select their role — Viewer (read-only) or Editor (can edit/delete). Click "Create Admin".',
    tip: 'Use a strong password for new admin accounts. Share credentials securely with the admin.',
    image: IMG.manageAdmins,
  },
  {
    role: 'superadmin', section: 'Super Admin', stepNum: 3, totalSteps: 4,
    icon: <Trash2 className="w-5 h-5" />,
    title: 'Step 3 — Remove an Admin Account',
    description: 'On the Manage Admins page, each Viewer or Editor account has a "Delete" button. Click it to remove that admin\'s access. Super Admin accounts are protected and cannot be deleted.',
    tip: 'Remove admin accounts immediately if an admin no longer serves in that role.',
    image: IMG.manageAdmins,
  },
  {
    role: 'superadmin', section: 'Super Admin', stepNum: 4, totalSteps: 4,
    icon: <Image className="w-5 h-5" />,
    title: 'Step 4 — Manage Homepage Images',
    description: 'Click "Homepage Images" to upload and manage the slideshow on the public homepage. Upload new images, set a title and display order for each, and delete old ones. Changes appear on the homepage immediately.',
    tip: 'Set the "Order" number to control which image appears first in the slideshow.',
    image: IMG.homepageImg,
  },
];

// ─── Role style map ────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<Role, { gradient: string; badge: string; label: string; icon: React.ReactNode }> = {
  welcome:    { gradient: 'from-slate-700 to-slate-900',       badge: 'bg-slate-500',   label: 'Overview',    icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  user:       { gradient: 'from-blue-600 to-indigo-700',       badge: 'bg-blue-500',    label: 'Member',      icon: <User className="w-3.5 h-3.5" /> },
  viewer:     { gradient: 'from-emerald-600 to-teal-700',      badge: 'bg-emerald-500', label: 'Viewer Admin',icon: <Eye className="w-3.5 h-3.5" /> },
  editor:     { gradient: 'from-violet-600 to-purple-700',     badge: 'bg-violet-500',  label: 'Editor Admin',icon: <Pencil className="w-3.5 h-3.5" /> },
  superadmin: { gradient: 'from-orange-500 to-rose-600',       badge: 'bg-orange-500',  label: 'Super Admin', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
};

// ─── Cover Slide ───────────────────────────────────────────────────────────────
function CoverSlide({ slide, onZoom }: { slide: Slide; onZoom: (src: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto px-4">
      {/* Image — large and prominent */}
      {slide.image && (
        <div
          className="w-full relative cursor-zoom-in group"
          onClick={() => onZoom(slide.image!)}
        >
          <img
            src={slide.image}
            alt="App preview"
            className="w-full rounded-2xl shadow-2xl border border-white/20 object-cover max-h-[55vh]"
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}
      {/* Text */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 border border-white/30">
          {slide.icon}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{slide.title}</h1>
        <p className="text-white/70 text-base sm:text-lg">{slide.description}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {(['user','viewer','editor','superadmin'] as Role[]).map(r => (
            <Badge key={r} variant="outline" className={`${ROLE_STYLE[r].badge} text-white border-white/30 gap-1.5 px-2.5 py-1 text-xs`}>
              {ROLE_STYLE[r].icon} {ROLE_STYLE[r].label}
            </Badge>
          ))}
        </div>
        <p className="text-white/40 text-sm">Press → or click Next to begin</p>
      </div>
    </div>
  );
}

// ─── Permissions Slide ─────────────────────────────────────────────────────────
function PermissionsSlide({ slide }: { slide: Slide }) {
  const { permissions } = slide;
  if (!permissions) return null;
  return (
    <div className="w-full max-w-3xl mx-auto px-4 space-y-5">
      <div className="space-y-1">
        <p className="text-white/60 text-sm font-medium uppercase tracking-widest">{slide.section}</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{slide.title}</h2>
        <p className="text-white/70">{slide.description}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {permissions.allowed.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-green-300" /> Allowed
            </h4>
            <ul className="space-y-2">
              {permissions.allowed.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-green-300 mt-0.5 flex-shrink-0 font-bold">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {permissions.denied.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wide">
              <X className="w-4 h-4 text-red-300" /> Restricted
            </h4>
            <ul className="space-y-2">
              {permissions.denied.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-red-300 mt-0.5 flex-shrink-0 font-bold">✗</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step Slide ────────────────────────────────────────────────────────────────
function StepSlide({ slide, onZoom }: { slide: Slide; onZoom: (src: string) => void }) {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 gap-4">

      {/* ── Big image (top, full width) ── */}
      {slide.image && (
        <div
          className="w-full relative cursor-zoom-in group"
          onClick={() => onZoom(slide.image!)}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full rounded-2xl shadow-2xl border border-white/20 object-cover"
            style={{ maxHeight: '52vh', objectFit: 'cover', objectPosition: 'top' }}
          />
          {/* Zoom hint on hover */}
          <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3 shadow-xl">
              <ZoomIn className="w-7 h-7 text-white" />
            </div>
          </div>
          {/* Step badge on image */}
          {slide.stepNum && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">{slide.stepNum}</span>
              Step {slide.stepNum} of {slide.totalSteps}
            </div>
          )}
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white/70 text-xs px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
            <ZoomIn className="w-3 h-3" /> Click to zoom
          </div>
        </div>
      )}

      {/* ── Text panel (below image) ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Step progress */}
        {slide.stepNum && slide.totalSteps && (
          <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <span className="text-white font-bold">{slide.stepNum}</span>
            </div>
            {slide.stepNum < slide.totalSteps && (
              <div className="w-0.5 h-8 bg-white/20 rounded-full" />
            )}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">{slide.section}</p>
          <div className="flex items-center gap-2">
            <span className="text-white/70">{slide.icon}</span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-snug">{slide.title}</h2>
          </div>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed">{slide.description}</p>
          {slide.tip && (
            <div className="flex gap-2 bg-white/10 border border-white/20 rounded-xl p-3 mt-1">
              <div>
                <span className="text-yellow-300 font-semibold text-xs uppercase tracking-wide">Tip: </span>
                <span className="text-white/80 text-sm leading-relaxed">{slide.tip}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section separator ─────────────────────────────────────────────────────────
function SectionDivider({ role }: { role: Role }) {
  const rs = ROLE_STYLE[role];
  return (
    <div className="flex items-center gap-2 px-4">
      <div className={`w-2 h-2 rounded-full ${rs.badge}`} />
      <span className="text-white/50 text-xs font-medium uppercase tracking-wider">{rs.label}</span>
    </div>
  );
}

// ─── Jump Menu ────────────────────────────────────────────────────────────────
function JumpMenu({ current, onJump, onClose }: { current: number; onJump: (i: number) => void; onClose: () => void }) {
  const sections: { role: Role; label: string; indices: number[] }[] = [];
  SLIDES.forEach((s, i) => {
    const last = sections[sections.length - 1];
    if (last && last.role === s.role) last.indices.push(i);
    else sections.push({ role: s.role, label: ROLE_STYLE[s.role].label, indices: [i] });
  });

  return (
    <div className="absolute top-14 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl w-72 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-semibold text-sm">Jump to Slide</span>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {sections.map(sec => (
          <div key={sec.role}>
            <SectionDivider role={sec.role} />
            {sec.indices.map(i => (
              <button
                key={i}
                onClick={() => { onJump(i); onClose(); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                  i === current ? 'bg-white/20 text-white font-semibold' : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs flex-shrink-0">{i + 1}</span>
                <span className="truncate">{SLIDES[i].title}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Presentation() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const total = SLIDES.length;
  const slide = SLIDES[current];
  const rs = ROLE_STYLE[slide.role];

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (animating || index === current) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setCurrent(index); setAnimating(false); }, 250);
  }, [animating, current]);

  const next = useCallback(() => { if (current < total - 1) goTo(current + 1, 'next'); }, [current, total, goTo]);
  const prev = useCallback(() => { if (current > 0) goTo(current - 1, 'prev'); }, [current, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox) { if (e.key === 'Escape') setLightbox(null); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, lightbox]);

  const roleBoundaries = SLIDES.reduce<Record<number, boolean>>((acc, s, i) => {
    if (i > 0 && SLIDES[i - 1].role !== s.role) acc[i] = true;
    return acc;
  }, {});

  return (
    <div className={`min-h-screen bg-gradient-to-br ${rs.gradient} transition-all duration-700 flex flex-col select-none`}>

      {/* ── Lightbox overlay ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="Full size preview"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/40 text-xs">Click anywhere or press Esc to close</p>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10 relative z-10">
        {/* Back to Dashboard button */}
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate('/dashboard')}
          className="text-white hover:bg-white/20 gap-1.5 text-xs h-8 px-2"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Back to Dashboard
        </Button>

        <Badge variant="outline" className={`${rs.badge} text-white border-white/30 gap-1.5 px-2.5 py-1 text-xs`}>
          {rs.icon}{rs.label}
        </Badge>

        <div className="flex items-center gap-1 flex-wrap justify-center max-w-sm">
          {SLIDES.map((_, i) => (
            <div key={i} className="flex items-center">
              {roleBoundaries[i] && <div className="w-2" />}
              <button
                onClick={() => goTo(i, i > current ? 'next' : 'prev')}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            </div>
          ))}
        </div>

        <button onClick={() => setMenuOpen(v => !v)} className="text-white/70 hover:text-white p-1 transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        {menuOpen && (
          <JumpMenu
            current={current}
            onJump={i => goTo(i, i > current ? 'next' : 'prev')}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {/* ── Slide content ── */}
      <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? `translateX(${direction === 'next' ? '40px' : '-40px'})` : 'translateX(0)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            width: '100%',
          }}
        >
          {slide.isCover ? (
            <CoverSlide slide={slide} onZoom={setLightbox} />
          ) : slide.permissions ? (
            <PermissionsSlide slide={slide} />
          ) : (
            <StepSlide slide={slide} onZoom={setLightbox} />
          )}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm border-t border-white/10">
        <Button
          variant="ghost" size="sm"
          onClick={prev} disabled={current === 0}
          className="text-white hover:bg-white/20 disabled:opacity-25 gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        <span className="text-white/50 text-xs tabular-nums">{current + 1} / {total}</span>

        <Button
          variant="ghost" size="sm"
          onClick={next} disabled={current === total - 1}
          className="text-white hover:bg-white/20 disabled:opacity-25 gap-1"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
