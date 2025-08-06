"use client";
import { Button } from "./ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AddTransactionDrawer } from "./add-transaction-drawer";

export function FloatingActionButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90 shadow-lg z-50 md:flex justify-center items-center hidden hover:scale-110 transition-all duration-300 cursor-pointer"
      >
        <PlusIcon className="h-8 w-8 stroke-2" />
      </div>
      <AddTransactionDrawer open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
} 