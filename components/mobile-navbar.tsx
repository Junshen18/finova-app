import Link from "next/link";
import { navItems } from "../data/navItems";
import { PlusCircleIcon, HomeIcon, DocumentCurrencyDollarIcon, UserCircleIcon, WalletIcon } from "@heroicons/react/24/outline";

export function MobileNavbar({ onAddTransaction }: { onAddTransaction: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent flex justify-between items-center px-2 py-1 md:hidden h-20">
      <div className="relative flex justify-between items-center w-full bg-ring rounded-2xl h-14 shadow-lg ">
        <div className="flex justify-between items-center w-full bg-card rounded-2xl h-14 relative z-10">
          {navItems.map((item) => {
            if (item.name === "Add Transaction") {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={onAddTransaction}
                  className="flex items-center justify-center w-12 h-12 bg-[#E9FE52] rounded-lg"
                >
                  <PlusCircleIcon className="h-7 w-7 text-black" />
                </button>
              );
            }
            const Icon =
              item.icon === "HomeIcon"
                ? HomeIcon
                : item.icon === "DocumentCurrencyDollarIcon"
                ? DocumentCurrencyDollarIcon
                : item.icon === "WalletIcon"
                ? WalletIcon
                : item.icon === "UserCircleIcon"
                ? UserCircleIcon
                : HomeIcon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center flex-1 justify-center"
              >
                <div className="flex items-center justify-center w-12 h-12">
                  <Icon className="h-7 w-7 text-foreground/50" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 