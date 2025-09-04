"use client";
import { Button } from "./ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AddTransactionDrawer } from "./add-transaction-drawer";

export function FloatingActionButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted &&
        createPortal(
          <div className="fixed inset-x-0 md:bottom-6 bottom-8 z-50 flex justify-center pointer-events-none">
            <div
              onClick={() => setModalOpen(true)}
              className="pointer-events-auto w-14 h-14 rounded-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90 shadow-lg flex justify-center items-center hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <PlusIcon className="h-9 w-9 stroke-2" />
            </div>
          </div>,
          document.body
        )}
      <AddTransactionDrawer open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
} 