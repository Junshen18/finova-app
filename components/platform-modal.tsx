import Image from "next/image";
import React from "react";

interface PlatformModalProps {
  open: boolean;
  onClose: () => void;
}

const PlatformModal: React.FC<PlatformModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
        <button
          className="absolute top-4 right-4 text-2xl cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-6">Choose Platform</h2>
        <div className="flex gap-6">
          {/* Mobile Card */}
          <div
            className="flex-1 rounded-2xl p-1 border-3 border-transparent hover:border-blue-500 transition-all duration-200 cursor-pointer"
          >
            <div className="bg-gray-50 flex flex-col shadow rounded-xl relative overflow-hidden border-1 border-zinc-200 items-center justify-center w-full h-full">
              <Image src="/mobile.png" alt="Mobile" className="w-full" width={100} height={80} />
              <div className="flex flex-col items-start justify-center p-3">
                <div className=" font-semibold">Mobile</div>
                <div className="text-gray-500 text-sm">Get the full experience on iOS</div>
              </div>
            </div>
          </div>
          {/* Desktop Card */}
          <div
            className="flex-1 rounded-2xl p-1 border-3 border-transparent hover:border-blue-500 transition-all duration-200 cursor-pointer"
          >
            <div className="bg-gray-50 flex flex-col shadow rounded-xl relative overflow-hidden border-1 border-zinc-200 items-center justify-center w-full h-full">
              <Image src="/mobile.png" alt="Mobile" className="w-full" width={100} height={80} />
              <div className="flex flex-col items-start justify-center p-3">
                <div className=" font-semibold">Desktop</div>
                <div className="text-gray-500 text-sm">Sign up or manage your account.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformModal;
