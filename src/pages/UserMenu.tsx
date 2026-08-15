import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUserAuth } from '@/hooks/useUserAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCircle, Heart, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  name: string;
  picture: string | null;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function UserMenu({ name, picture }: UserMenuProps) {
  const navigate = useNavigate();
  const { signOut } = useUserAuth();
  const [imgError, setImgError] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5 hover:bg-muted transition-colors">
          <div className="p-[1.5px] rounded-full bg-gradient-to-br from-primary/60 via-primary/30 to-transparent">
            {picture && !imgError ? (
              <img
                src={picture}
                alt={name}
                onError={() => setImgError(true)}
                className="w-8 h-8 rounded-full object-cover block ring-2 ring-background"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary ring-2 ring-background">
                {getInitials(name)}
              </div>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/user/profile')} className="gap-2 cursor-pointer">
          <UserCircle className="w-4 h-4" /> My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/prayer-requests')} className="gap-2 cursor-pointer">
          <Heart className="w-4 h-4" /> My Prayer Requests
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4" /> Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}