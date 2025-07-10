"use client";
import React from "react";

interface ManualAddModalProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function ManualAddModal({ open, onClose, children }: ManualAddModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"} bg-white rounded-t-2xl shadow-xl p-6 min-h-[200px]`}
        style={{ willChange: "transform" }}
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-row items-center justify-between w-full">Test</div>
        </div>
      </div>
    </>
  );
}
