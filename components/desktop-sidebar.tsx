import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon, HomeIcon, ListBulletIcon, Cog6ToothIcon, WalletIcon, UserGroupIcon, SparklesIcon, PuzzlePieceIcon, DocumentCurrencyDollarIcon } from "@heroicons/react/24/outline";
import { NotificationBadge } from "@/components/notification-badge";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { navItems } from "@/data/navItems";
import { FaCircleUser } from "react-icons/fa6";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
interface NavItem {
  href: string;
  label: string;
  icon: string | IconType;
  showBadge?: boolean;
}

export function DesktopSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  const adminItems = profile?.role === 'admin' ? [
    { 
      href: "/protected/admin/applications", 
      label: "Professional Applications", 
      icon: UserGroupIcon,
      showBadge: true 
    },
  ] : [];

  return (
    <aside className="hidden fixed md:flex w-64 bg-black text-white flex-col justify-between px-6 py-8 h-screen">
      <div>
        <div className="flex items-center gap-2 mb-12 px-2">
          <Image
            src="/finova-white-logo.svg"
            alt="Finova"
            width={150}
            height={40}
            className="w-32"
          />
        </div>
        <nav className="flex flex-col gap-3">
          {[...navItems, ...adminItems].map((item: NavItem) => {
            // Check if current path matches this item's href
            const isActive = pathname === item.href || 
              (item.href === "/protected" && pathname === "/protected/dashboard") ||
              (item.href !== "/protected" && pathname.startsWith(item.href));
            const iconMap: Record<string, IconType> = {
              HomeIcon,
              DocumentCurrencyDollarIcon,
              WalletIcon,
              SparklesIcon,
              UserGroupIcon,
              PuzzlePieceIcon,
              Cog6ToothIcon,
              ListBulletIcon,
            };
            const IconComp: IconType = typeof item.icon === 'string' ? (iconMap[item.icon] || HomeIcon) : (item.icon as IconType);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#E9FE52] text-black shadow-lg' 
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <IconComp className={`h-5 w-5 ${
                  isActive ? 'text-black' : 'text-white group-hover:text-[#E9FE52]'
                }`} />
                <div className="flex items-center flex-1">
                  <span className={`font-medium ${
                    isActive ? 'text-black' : 'text-white'
                  }`}>
                    {item.label}
                  </span>
                  {item.showBadge && <NotificationBadge />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm w-full text-left hover:bg-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-black/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10">
                <FaCircleUser className="text-foreground/70 text-lg" />
              </div>
            )}
          </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-gray-400">Premium Member</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px] w-[208px]">
          <DropdownMenuItem asChild>
            <Link href="/protected/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/subscription">Subscription</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = '/auth/login'; }}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
} 