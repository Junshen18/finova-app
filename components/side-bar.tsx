"use client";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNavbar } from "./mobile-navbar";
import { AddTransactionDrawer } from "./add-transaction-drawer";

export default function Sidebar() {
  const { profile } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DesktopSidebar profile={profile} onAddTransaction={() => setModalOpen(true)} />
      <MobileNavbar onAddTransaction={() => setModalOpen(true)} />
      <AddTransactionDrawer open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
