"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import PlatformModal from "@/components/platform-modal";
import { FaArrowRight } from "react-icons/fa6";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-transparent backdrop-blur-md ">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px] md:h-[90px]">
              {/* Logo */}
              <Image src="/finova-logo.svg" alt="Logo" width={185} height={42} className="w-[100px] h-[25px] md:w-[150px] md:h-[30px] object-contain cursor-pointer"/>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8 font-[inter] font-medium text-base">
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Features
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  How it works
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Testimonials
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  FAQs
                </a>
              </div>
            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                <Link href="/auth/login" className="bg-zinc-100 hover:bg-zinc-200 transition-all duration-200 text-black px-4 py-1 rounded-4xl whitespace-nowrap font-medium">Log In</Link>
                <button className="bg-black hover:bg-black/80 transition-all duration-200 text-white px-4 py-1 rounded-4xl whitespace-nowrap font-medium cursor-pointer" onClick={() => setModalOpen(true)}>Get Started</button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Add margin-top to prevent content from going under fixed header */}
      <div className="pt-[90px]">
        {/* Hero Section */}
        <section className="bg-background py-2 h-[550px]">
          <div className="w-full h-full mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-center">
            <Image src="/fimi.svg" alt="Fimi" width={300} height={280} className="w-[190px] h-[180px] md:w-[300px] md:h-[280px] absolute top-5 md:top-10 left-[50%] -translate-x-1/2 object-cover z-0" />
            <Image src="/herobg.svg" alt="Hero Background" fill className="hidden md:block absolute top-0 object-cover z-0" />
            <div className="pt-[50px] md:pt-[230px] text-center z-10 flex flex-col items-center justify-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl font-[grifterbold]">
                Your All-in-One <br /> <span className="text-primary">Finance</span>Companion.
              </h1>
              <p className="md:max-w-2xl w-[320px] md:w-full mx-auto text-sm md:text-lg text-black font-medium font-[inter]">
              A smarter way to manage your money—track, split, and analyze your expenses effortlessly.
              </p>

              <div className="rounded-full bg-black hover:bg-black/80 transition-all duration-200 px-6 py-3 h-[40px] md:h-[50px] font-medium text-[14px] md:text-lg font-[inter] text-white cursor-pointer flex items-center justify-center gap-3">
                <p>Get into Whitelist</p> <FaArrowRight />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl font-[grifterbold]">
              Track your Expenses in a whole new way
              </h2>
            </div>
            
            <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-md bg-indigo-600 flex items-center justify-center">
                  {/* Add icon here */}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Feature 1
                </h3>
                <p className="mt-2 text-center text-gray-500">
                  Description of feature 1 and its benefits.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-md bg-indigo-600 flex items-center justify-center">
                  {/* Add icon here */}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Feature 2
                </h3>
                <p className="mt-2 text-center text-gray-500">
                  Description of feature 2 and its benefits.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-md bg-indigo-600 flex items-center justify-center">
                  {/* Add icon here */}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Feature 3
                </h3>
                <p className="mt-2 text-center text-gray-500">
                  Description of feature 3 and its benefits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Join thousands of satisfied customers today.
              </p>
              <div className="mt-8">
                <button className="rounded-md bg-indigo-600 px-8 py-4 text-lg text-white hover:bg-indigo-700">
                  Sign Up Now
                </button>
              </div>
            </div>
          </div>
        </section> */}

        {/* Footer */}
        <footer className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500">
              <p>© 2025 Finova. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
      <PlatformModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
