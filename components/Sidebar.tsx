import Link from "next/link";
import { UserCircleIcon, HomeIcon, ListBulletIcon, PlusCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between px-4 shadow-lg h-screen ">
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
        <span className="text-gray-600 py-4">Your Name</span>
      </div>
    </aside>
  );
}
