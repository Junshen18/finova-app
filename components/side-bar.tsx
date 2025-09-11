"use client";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNavbar } from "./mobile-navbar";
import { AddTransactionDrawer } from "./add-transaction-drawer";
import { FloatingActionButton } from "./floating-action-button";

export default function Sidebar() {
  const { profile } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DesktopSidebar profile={profile} />
      {profile?.role === 'admin' ? (
        <MobileNavbar onAddTransaction={() => {}} items={[
          { label: 'Admin', href: '/protected/admin', icon: 'HomeIcon' },
          { label: 'Users', href: '/protected/admin/users', icon: 'UserGroupIcon' },
          { label: 'Audit', href: '/protected/admin/audit-logs', icon: 'FaRegFileAlt' },
          { label: 'Profile', href: '/protected/profile', icon: 'UserCircleIcon' }
        ]} />
      ) : (
        <>
          <MobileNavbar onAddTransaction={() => setModalOpen(true)} />
          <AddTransactionDrawer open={modalOpen} onClose={() => setModalOpen(false)} />
          <FloatingActionButton />
        </>
      )}
    </>
  );
}
