"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // SIGN UP FLOW
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This tells Supabase where to send the user after clicking a link
          // (Even if confirm email is off, this is good practice)
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : '',
        },
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Account created successfully! You can now log in.");
        setIsSignUp(false); // Move to login view
      }
    } else {
      // LOGIN FLOW
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        // Success! Go to the home feed
        window.location.href = "/";
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
          {isSignUp ? "Join the Community" : "Welcome Back"}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:underline text-sm"
          >
            {isSignUp ? "Already have an account? Log In" : "Don't have an account? Create one"}
          </button>
        </div>
      </div>

      <p className="mt-8 text-gray-500 text-xs">
        Micro-Community Platform &copy; 2026
      </p>
    </div>
  );
}