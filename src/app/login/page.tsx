"use client";
import Image from "next/image";
import { login, signup } from "./actions";
import { useState } from "react";

export default function LoginPage() {
  const [inputValue, setInputValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);


  // Simple email validation regex
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.com$/.test(email);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    setEmailValid(validateEmail(value));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setPasswordValue(value);
    setPasswordValid(value.length > 0);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        {/* Logo/Icon */}
        <Image src="/avatar.svg" alt="Finova" width={100} height={100} className="mb-2"/>
        {/* Card */}
        <div className="w-full flex flex-col items-center">
          <h1 className="text-black text-xl font-semibold text-center">Welcome to Finova</h1>
          <p className="text-gray-500 text-center mb-6">Log in or sign up to get started.</p>
          <form action={signup}>
          <input
            id="email"
            name="email"
            type="text"
            placeholder="Email or Phone Number"
            className="w-full mb-4 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
            value={inputValue}
            onChange={handleInputChange}
          />
          <input
            id="password" 
            name="password"
            type="password"
            placeholder="Password"
            className="w-full mb-4 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
            value={passwordValue}
            onChange={handlePasswordChange}
          />
          {emailValid ? (
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition cursor-pointer" type="submit">Continue</button>
          ) : (
            <p className="text-xs text-gray-400 text-center">We'll create an account if you don't have one yet.</p>
          )}
          </form>
        </div>
        {/* Footer Links */}
        <div className="absolute bottom-10 flex gap-2 mt-8 text-xs text-gray-400">
          <a href="#" className="hover:underline">Developers</a>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
        </div>
      </div>
    </div>
  );
} 