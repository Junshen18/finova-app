import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        {/* Logo/Icon */}

        <Image src="/avatar.svg" alt="Finova" width={100} height={100} className="mb-2"/>

        {/* Card */}
        <div className="w-full flex flex-col items-center">
          <h1 className="text-black text-xl font-semibold text-center">Welcome to Finova</h1>
          <p className="text-gray-500 text-center mb-6">Log in or sign up to get started.</p>
          <input
            type="text"
            placeholder="Email or Phone Number"
            className="w-full mb-4 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
          />
          <p className="text-xs text-gray-400 text-center">We'll create an account if you don't have one yet.</p>
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