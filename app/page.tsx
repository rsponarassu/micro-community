"use client";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase"; 
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Form States
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
      } else {
        setUser(session.user);
        fetchInitialData();
      }
    };
    checkUser();
  }, []);

  async function fetchInitialData() {
    const { data: comms } = await supabase.from("communities").select("*");
    setCommunities(comms || []);
    if (comms?.length > 0) setActiveCommunity(comms[0].id);
  }

  // Fetch posts and events whenever the active community changes
  useEffect(() => {
    if (activeCommunity) {
      fetchFeedData();
    }
  }, [activeCommunity]);

  async function fetchFeedData() {
    const { data: p } = await supabase.from("posts").select("*").eq("community_id", activeCommunity).order("created_at", { ascending: false });
    const { data: e } = await supabase.from("events").select("*").eq("community_id", activeCommunity).order("created_at", { ascending: false });
    setPosts(p || []);
    setEvents(e || []);
  }

  async function handlePostSubmit(e) {
    e.preventDefault();
    await supabase.from("posts").insert([
      { content, is_anonymous: isAnonymous, community_id: activeCommunity, user_id: user.id }
    ]);
    setContent("");
    fetchFeedData();
  }

  if (!user) return <div className="p-10 text-black text-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Step 7: Community System Sidebar */}
      <Sidebar 
        communities={communities} 
        activeId={activeCommunity} 
        onSelect={(id) => setActiveCommunity(id)} 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {communities.find(c => c.id === activeCommunity)?.name || "Feed"}
            </h1>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")} className="text-sm text-red-500 underline">Logout</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT: POSTS */}
            <div>
              <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-xl shadow mb-6">
                <textarea className="w-full p-2 border rounded text-black" placeholder="Share anonymously or normally..." value={content} onChange={(e) => setContent(e.target.value)} />
                <div className="flex justify-between mt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Anonymous
                  </label>
                  <button className="bg-blue-600 text-white px-4 py-1 rounded">Post</button>
                </div>
              </form>
              <div className="space-y-4">
                {posts.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <p className="text-black">{p.content}</p>
                    <span className="text-[10px] text-gray-400">{p.is_anonymous ? "👤 Anonymous" : "👤 Member"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: EVENTS */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-700">Events</h2>
              {events.map(e => (
                <div key={e.id} className="bg-white p-4 rounded shadow border border-green-200">
                  <h4 className="font-bold text-blue-600">{e.title}</h4>
                  <p className="text-xs text-gray-500">📍 {e.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}