import Link from "next/link";
import { navItemsMobile } from "../data/navItems";
import { HomeIcon, UserCircleIcon, SparklesIcon, PuzzlePieceIcon, UserGroupIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { FaRegFileAlt } from "react-icons/fa";

type MobileItem = { label: string; href: string; icon: string };

export function MobileNavbar({ onAddTransaction, items }: { onAddTransaction: () => void; items?: MobileItem[] }) {
  const list = items && items.length > 0 ? items : navItemsMobile;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-transparent px-2 py-1 md:hidden h-fit">
      <div className="relative w-full bg-ring rounded-2xl h-14 shadow-lg">
        <div className="grid grid-cols-5 items-center w-full bg-card rounded-2xl h-14 relative z-10 px-2">
          {/* Left two items */}
          {list.slice(0, 2).map((item) => {
            const Icon =
              item.icon === "HomeIcon"
                ? HomeIcon
                : item.icon === "SparklesIcon"
                ? SparklesIcon
                : item.icon === "UserGroupIcon"
                ? UserGroupIcon
                : item.icon === "ListBulletIcon"
                ? ListBulletIcon
                : item.icon === "FaRegFileAlt"
                ? (FaRegFileAlt as unknown as React.ComponentType<any>)
                : item.icon === "PuzzlePieceIcon"
                ? PuzzlePieceIcon
                : UserCircleIcon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center h-12"
              >
                <Icon className="h-7 w-7 text-foreground/50" />
              </Link>
            );
          })}

          {/* Center spacer for FAB dock */}
          <div />

          {/* Right two items */}
          {list.slice(2).map((item) => {
            const Icon =
              item.icon === "HomeIcon"
                ? HomeIcon
                : item.icon === "SparklesIcon"
                ? SparklesIcon
                : item.icon === "UserGroupIcon"
                ? UserGroupIcon
                : item.icon === "ListBulletIcon"
                ? ListBulletIcon
                : item.icon === "FaRegFileAlt"
                ? (FaRegFileAlt as unknown as React.ComponentType<any>)
                : item.icon === "PuzzlePieceIcon"
                ? PuzzlePieceIcon
                : item.icon === "UserCircleIcon"
                ? UserCircleIcon
                : UserCircleIcon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center h-12"
              >
                <Icon className="h-7 w-7 text-foreground/50" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 