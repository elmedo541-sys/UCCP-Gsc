import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Film } from "lucide-react";
import GalleryPanel from "@/components/GalleryPanel";
import ChatSupportWidget from "@/components/ChatSupportWidget";
import { useUserAuth } from "@/hooks/useUserAuth";
import { supabase } from "@/integrations/supabase/client";

export default function MediaGallery() {
  const navigate = useNavigate();
  const { isLoggedIn, personId } = useUserAuth();
  const [memberOrganization, setMemberOrganization] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !personId) { setMemberOrganization(null); return; }
    supabase
      .from('people')
      .select('organization')
      .eq('uuid', personId)
      .maybeSingle()
      .then(({ data }) => setMemberOrganization(data?.organization ?? null));
  }, [isLoggedIn, personId]);

  return (
    <div className="min-h-screen bg-muted/30">

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-16 flex items-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>

          <div>
            <h1 className="font-bold text-foreground text-sm leading-none">
              Media Gallery
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Photos &amp; Videos
            </p>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <GalleryPanel
          canUpload={isLoggedIn}
          canDelete={isLoggedIn}
          memberOrganization={memberOrganization}
        />
      </main>

      {/* Chat Support */}
      <ChatSupportWidget />
    </div>
  );
}