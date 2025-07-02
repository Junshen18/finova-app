"use client";
import Link from "next/link";
import { UserCircleIcon, HomeIcon, ListBulletIcon, PlusCircleIcon, Cog6ToothIcon, WalletIcon, DocumentCurrencyDollarIcon, PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useProfile } from "@/hooks/useProfile";
import { MdHistory } from "react-icons/md";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Sidebar() {
  const { profile } = useProfile();
  const pathname = usePathname();

  // Define navbar items for mobile
  const navItems = [
    {
      href: "/protected",
      icon: HomeIcon,
    },
    {
      href: "/protected/transactions",
      icon: DocumentCurrencyDollarIcon,
    },
    {
      href: "/protected/add",
      icon: PlusCircleIcon,
    },
    {
      href: "/protected/budget",
      icon: WalletIcon,
    },
    {
      href: "/protected/account",
      icon: UserCircleIcon,
    },
  ];

  // Find the active index
  const activeIndex = useMemo(() => navItems.findIndex(item => pathname === item.href), [pathname, navItems]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col justify-between px-4 shadow-lg h-screen ">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2 py-4">
            <Image
              src="/finova-logo.svg"
              alt="dashboard"
              width={150}
              height={100}
              className="w-24 md:w-[150px]"
            />
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/expense-tracker/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-50 transition">
              <HomeIcon className="h-5 w-5 text-violet-500" />
              <span>Dashboard</span>
            </Link>
            <Link href="/expense-tracker/transactions" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-50 transition">
              <ListBulletIcon className="h-5 w-5 text-violet-500" />
              <span>Transactions</span>
            </Link>
            <Link href="/expense-tracker/transactions/add" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-50 transition">
              <PlusCircleIcon className="h-5 w-5 text-violet-500" />
              <span>Add Transaction</span>
            </Link>
            <Link href="/expense-tracker/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-50 transition">
              <Cog6ToothIcon className="h-5 w-5 text-violet-500" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 px-2">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <span className="text-gray-600 py-4">{profile?.display_name}</span>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent flex justify-between items-center px-2 py-1 md:hidden h-20">
        <div className="relative flex justify-between items-center w-full bg-ring rounded-2xl h-14">
          <div className="flex justify-between items-center w-full bg-card rounded-2xl h-14 relative z-10">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center flex-1 justify-center">
                  {isActive ? (
                      <Icon className="h-7 w-7 text-foreground" />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12">
                      <Icon className="h-7 w-7 text-foreground/50" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
