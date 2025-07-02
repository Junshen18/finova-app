"use client";
import { useState } from "react";
import { FaAngleUp, FaEllipsis, FaArrowDown, FaArrowUp } from "react-icons/fa6";

export default function BalanceCard() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-full h-44 bg-gradient-to-b from-[#17304D] to-[#5894DD] rounded-xl shadow-xl shadow-[#5894DD]/50 p-6 flex flex-col justify-between">
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-row justify-between items-start w-full">
          <div
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className="text-sm font-medium opacity-80 flex flex-row items-center gap-1 cursor-pointer select-none"
          >
            Total Balance{" "}
            <FaAngleUp
              className={`text-base ${
                isOpen ? "rotate-180" : ""
              } transition-all duration-300`}
            />
          </div>
          <FaEllipsis className="text-white/70 text-base cursor-pointer" />
        </div>
        {/* Balance */}
        <div className="text-2xl font-extrabold text-white tracking-tight">
            RM 2,548.00
        </div>
      </div>
      {/* Income & Expenses */}
      <div className="flex flex-row justify-between w-full mt-4">
        {/* Income */}
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <span className="bg-foreground/10 rounded-full p-1">
              <FaArrowDown className="text-foreground/70 text-sm" />
            </span>
            <span className="text-foreground/70 text-sm font-medium opacity-80">
              Income
            </span>
          </div>
          <div className="text-white text-base font-semibold mt-1">
            RM 1,840.00
          </div>
        </div>
        {/* Expenses */}
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <span className="bg-foreground/10 rounded-full p-1">
              <FaArrowUp className="text-foreground/70 text-sm" />
            </span>
            <span className="text-foreground/70 text-sm font-medium opacity-80">
              Expenses
            </span>
          </div>
          <div className="text-white text-base font-semibold mt-1">
            RM 284.00
          </div>
        </div>
      </div>
    </div>
  );
}
