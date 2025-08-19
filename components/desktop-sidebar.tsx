import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon, HomeIcon, ListBulletIcon, Cog6ToothIcon, WalletIcon, UserGroupIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { NotificationBadge } from "@/components/notification-badge";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  showBadge?: boolean;
}

export function DesktopSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/protected", label: "Dashboard", icon: HomeIcon },
    { href: "/protected/transactions", label: "Transactions", icon: ListBulletIcon },
    { href: "/protected/budget", label: "Budget", icon: WalletIcon },
    { href: "/protected/ai-analysis", label: "AI Analysis", icon: SparklesIcon },
    { href: "/protected/friends", label: "Friends", icon: UserGroupIcon },
    { href: "/protected/account", label: "Settings", icon: Cog6ToothIcon },
  ];

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
            width={120}
            height={40}
            className="w-24"
          />
        </div>
        <nav className="flex flex-col gap-3">
          {[...navItems, ...adminItems].map((item) => {
            // Check if current path matches this item's href
            const isActive = pathname === item.href || 
              (item.href === "/protected" && pathname === "/protected/dashboard") ||
              (item.href !== "/protected" && pathname.startsWith(item.href));
            
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
                <item.icon className={`h-5 w-5 ${
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm">
        <div className="w-8 h-8 bg-[#E9FE52] rounded-full flex items-center justify-center shadow-lg">
          <UserCircleIcon className="h-5 w-5 text-black" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{profile?.display_name || 'User'}</p>
          <p className="text-xs text-gray-400">Premium Member</p>
        </div>
      </div>
    </aside>
  );
} 