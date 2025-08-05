"use client";
import { useState } from "react";
import { FaAngleUp, FaEllipsis, FaArrowDown, FaArrowUp } from "react-icons/fa6";

export default function BalanceCard() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-full h-44 bg-[#E9FE52] rounded-xl p-6 flex flex-col justify-between shadow-lg">
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-row justify-between items-start w-full">
          <div
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className="text-sm font-semibold opacity-90 flex flex-row items-center gap-1 cursor-pointer select-none text-black hover:opacity-100 transition-opacity"
          >
            Total Balance{" "}
            <FaAngleUp
              className={`text-base ${
                isOpen ? "rotate-180" : ""
              } transition-all duration-300`}
            />
          </div>
          <FaEllipsis className="text-black/70 text-base cursor-pointer hover:text-black transition-colors" />
        </div>
        {/* Balance */}
        <div className="text-3xl font-black text-black tracking-tight">
            RM 2,548.00
        </div>
      </div>
      {/* Income & Expenses */}
      <div className="flex flex-row justify-between w-full mt-4">
        {/* Income */}
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <span className="bg-black/20 rounded-full p-1.5">
              <FaArrowDown className="text-black/80 text-sm" />
            </span>
            <span className="text-black/80 text-sm font-semibold">
              Income
            </span>
          </div>
          <div className="text-black text-lg font-bold mt-1">
            RM 1,840.00
          </div>
        </div>
        {/* Expenses */}
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <span className="bg-black/20 rounded-full p-1.5">
              <FaArrowUp className="text-black/80 text-sm" />
            </span>
            <span className="text-black/80 text-sm font-semibold">
              Expenses
            </span>
          </div>
          <div className="text-black text-lg font-bold mt-1">
            RM 284.00
          </div>
        </div>
      </div>
    </div>
  );
}
