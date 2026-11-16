'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Sparkles, Film } from 'lucide-react'
import { sound } from '@/lib/sound'

interface VideoItem {
  id: string
  title: string
  category: string
  description: string
  videoUrl: string
  posterUrl: string
}

const FEATURED_VIDEOS: VideoItem[] = [
  {
    id: 'ai-agents',
    title: 'Autonomous Swarms & AI Agents 2026',
    category: 'AI & Tech',
    description: 'Neural agent workflows, automated code review pipelines, and next-generation developer tooling.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&q=80',
  },
  {
    id: 'design',
    title: 'Generative UI & Micro-Interactions Showcase',
    category: 'Design & UX',
    description: 'Community members break down glassmorphism, Web Audio sound feedback, and fluid motion design.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-designer-working-on-a-tablet-41279-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&q=80',
  },
  {
    id: 'hackathon',
    title: 'Campus Hackathon 2026: 48-Hour Sprint',
    category: 'Hackathons',
    description: 'Over 200 builders, AI agents, and late night energy in our flagship annual collegiate build sprint.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-cheering-with-drinks-at-a-party-41398-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&q=80',
  },
]

export default function VideoHero() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentVideo = FEATURED_VIDEOS[activeIdx]

  function togglePlay() {
    sound.playClick()
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  function toggleMute() {
    sound.playClick()
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  function handleSelectVideo(index: number) {
    sound.playSparkle()
    setActiveIdx(index)
    setIsPlaying(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl bg-surface mb-2 group">
      {/* Background Video Layer with Fallback Poster */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          key={currentVideo.videoUrl}
          src={currentVideo.videoUrl}
          poster={currentVideo.posterUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
        />

        {/* Gradient overlays for contrast & aesthetic glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/20 to-black/30" />

        {/* Glowing cyber accent bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent animate-pulse" />

        {/* AI Generator & Controls Pill Overlay */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-purple-300 border border-purple-500/30 backdrop-blur-md shadow-md">
            <Film className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>AI-GENERATED VIDEO SPOTLIGHT</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-md active:scale-95"
              title={isMuted ? 'Unmute Video' : 'Mute Video'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-md active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Information & Category Selector */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="max-w-xl space-y-2 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand/80 backdrop-blur-md text-white border border-white/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Category • {currentVideo.category}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md text-white">
              {currentVideo.title}
            </h2>

            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed drop-shadow-sm font-normal">
              {currentVideo.description}
            </p>
          </div>

          {/* Quick thumbnail selector tabs */}
          <div className="flex items-center gap-1.5 shrink-0 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            {FEATURED_VIDEOS.map((vid, idx) => (
              <button
                key={vid.id}
                onClick={() => handleSelectVideo(idx)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeIdx === idx
                    ? 'bg-brand text-white shadow-lg shadow-brand/40 scale-105'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {vid.category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
