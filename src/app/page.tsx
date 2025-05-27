import Image from "next/image";
import { useState } from "react";

export default function Dashboard() {
  // Format current date and time
  const now = new Date();
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      {/* Main content */}
      <div className="section flex-1 p-4 sm:p-8 pb-20 sm:pb-8 overflow-y-auto">
        <div className="flex flex-col xl:flex-row gap-0 relative max-w-full !col-start-1 !col-end-4 lg:!col-start-2 lg:!col-end-3">
          <div className="flex flex-col lg:border lg:border-solid lg:border-[#E4E6EB] rounded-3xl relative lg:bg-[#fbfbfb] lg:py-4 col-start-1 col-end-4">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 border-b border-solid border-[#E4E6EB] pb-4 px-4">
              <Image src="/finova-logo.svg" alt="dashboard" width={150} height={100} className="w-24 md:w-[150px]" />
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-600 ">
                  {formattedTime} ({timeZone})
                </p>
                <p className="text-xs text-gray-500">{formattedDate}</p>
              </div>
            </header>
            <div className="flex justify-between md:items-center gap-6 flex-col md:flex-row px-4 relative">
                <div className="flex flex-col border border-[#6BE264] rounded-xl overflow-hidden">
                  <Image src="/Finova.png" alt="dashboard" width={600} height={200} objectFit="cover"/>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold">Welcome back, John Doe</h2>
                <p className="text-sm text-gray-600">
                  Your dashboard is ready to help you manage your finances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
