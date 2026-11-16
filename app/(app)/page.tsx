import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Compass,
  Hash,
  Plus,
  Sparkles,
  Zap,
  ShieldCheck,
  Volume2,
  Users,
  Flame,
  Radio
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { loadPostMeta } from '@/lib/feed'
import { isNextInternalError } from '@/lib/utils'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import ScrollReveal from '@/app/components/ui/ScrollReveal'
import VideoHero from '@/app/components/ui/VideoHero'
import { LoaderShowcase } from '@/app/components/ui/Loaders'

export const metadata: Metadata = {
  title: 'Micro Community | Anonymity-First Small Group Hub',
  description: 'Threaded discussions, AI video showcase, synthesized audio FX, and events.',
}

interface MembershipRow {
  community_id: string
  role: 'owner' | 'moderator' | 'member'
}

interface CommunityRow {
  id: string
  name: string
  slug: string
  icon_url: string | null
  description?: string
  member_count?: number
}

const DEMO_COMMUNITIES: CommunityRow[] = [
  {
    id: 'demo-c1',
    name: 'Autonomous AI & Agents',
    slug: 'ai-agents',
    icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80',
    description: 'Building multi-agent systems, local LLMs, and autonomous dev workflows.',
    member_count: 142,
  },
  {
    id: 'demo-c2',
    name: 'UI/UX & Creative Tech',
    slug: 'creative-tech',
    icon_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&q=80',
    description: 'Micro-interactions, glassmorphic design, and Web Audio synthesizers.',
    member_count: 98,
  },
  {
    id: 'demo-c3',
    name: 'Campus Hackathon 2026',
    slug: 'hackathon',
    icon_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&q=80',
    description: '48-hour build sprints, team formation, and prize showcases.',
    member_count: 215,
  },
  {
    id: 'demo-c4',
    name: 'Midnight Lofi & Chill',
    slug: 'midnight-lofi',
    icon_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80',
    description: 'Synthesizer jams, coding soundtracks, and casual late night banter.',
    member_count: 76,
  },
]

const DEMO_POSTS: PostPublicData[] = [
  {
    id: 'demo-p1',
    community_id: 'demo-c1',
    community_name: 'Autonomous AI & Agents',
    community_slug: 'ai-agents',
    content: 'Just deployed the new audio-reactive sound engine and AI video hero! The micro-interactions feel remarkably fast and responsive. Zero bandwidth audio synthesis via Web Audio API works seamlessly offline and across all devices. 🚀✨',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    is_anonymous: false,
    is_pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    author_id: 'demo-author-1',
    author_username: 'arjun_builds',
    author_display_name: 'Arjun Dev',
    author_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    reactions: [
      { type: 'like', count: 18, reacted: false },
      { type: 'love', count: 12, reacted: false },
      { type: 'wow', count: 7, reacted: false },
    ],
    commentCount: 9,
  },
  {
    id: 'demo-p2',
    community_id: 'demo-c2',
    community_name: 'UI/UX & Creative Tech',
    community_slug: 'creative-tech',
    content: 'Anonymous confession: Having cryptographically sealed anonymity where the backend database strips our identity completely before sending to client makes club discussions 100x more honest. No politics, pure ideas.',
    image_url: null,
    is_anonymous: true,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    author_id: null,
    author_username: null,
    author_display_name: null,
    author_avatar_url: null,
    reactions: [
      { type: 'love', count: 24, reacted: false },
      { type: 'laugh', count: 5, reacted: false },
    ],
    commentCount: 14,
  },
  {
    id: 'demo-p3',
    community_id: 'demo-c3',
    community_name: 'Campus Hackathon 2026',
    community_slug: 'hackathon',
    content: 'The 48-Hour Hackathon registration is live! Over 50 teams have submitted project drafts. Check out the featured AI video in the banner above for highlights from last year’s showcase! 🍕💻',
    image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
    is_anonymous: false,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    author_id: 'demo-author-2',
    author_username: 'priya_design',
    author_display_name: 'Priya Sharma',
    author_avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    reactions: [
      { type: 'like', count: 31, reacted: false },
      { type: 'love', count: 15, reacted: false },
    ],
    commentCount: 6,
  },
]

interface UserProfile {
  username: string | null
  display_name: string | null
}

export default async function HomePage() {
  let user: { id: string; email?: string } | null = null
  let profile: UserProfile | null = null
  let memberships: MembershipRow[] = []
  let communities: CommunityRow[] = []
  let posts: PostPublicData[] = []
  let reactions: Record<string, any[]> = {}
  let commentCounts: Record<string, number> = {}

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    user = authData?.user ?? null

    if (user) {
      const { data: rawProfile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single()
      profile = rawProfile as UserProfile | null

      const { data: rawMemberships } = await supabase
        .from('community_members')
        .select('community_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(30)
      memberships = (rawMemberships ?? []) as MembershipRow[]
    }

    const communityIds = memberships.map((m) => m.community_id)

    // If user has memberships, fetch their communities; otherwise fetch public communities
    if (communityIds.length > 0) {
      const { data } = await supabase
        .from('communities')
        .select('id, name, slug, icon_url')
        .in('id', communityIds)
      communities = (data ?? []) as CommunityRow[]
    } else {
      const { data } = await supabase
        .from('communities')
        .select('id, name, slug, icon_url, description')
        .order('created_at', { ascending: false })
        .limit(8)
      if (data && data.length > 0) {
        communities = data as CommunityRow[]
      }
    }

    // Fetch posts: either from joined communities or trending public posts
    const targetIds = communityIds.length > 0 ? communityIds : communities.map((c) => c.id)

    if (targetIds.length > 0) {
      const { data } = await supabase
        .from('posts_public')
        .select(
          'id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url'
        )
        .in('community_id', targetIds)
        .order('created_at', { ascending: false })
        .limit(25)
      if (data && data.length > 0) {
        posts = data as PostPublicData[]
      }
    }

    if (posts.length > 0 && user) {
      const meta = await loadPostMeta(
        supabase,
        posts.map((p) => p.id),
        user.id
      )
      reactions = meta.reactions
      commentCounts = meta.commentCounts
    }
  } catch (err) {
    if (isNextInternalError(err)) throw err
    console.error('[HomePage Resilient Data Fetch]', err)
  }

  // Graceful fallback to demo data if the database has zero rows yet
  const displayCommunities = communities.length > 0 ? communities : DEMO_COMMUNITIES
  const displayPosts = posts.length > 0 ? posts : DEMO_POSTS

  const communityMap = displayCommunities.reduce<Record<string, CommunityRow>>(
    (acc, c) => ({ ...acc, [c.id]: c }),
    {}
  )

  const greeting = getGreeting()
  const displayName = profile?.display_name || profile?.username || (user ? 'Creator' : 'Friend')
  const firstName = displayName.split(' ')[0]

  return (
    <div className="page space-y-7 pb-16">
      {/* 1. Header Greeting & Quick Stats */}
      <ScrollReveal animation="fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-subtle text-brand border border-brand/20 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              <span>LIVE MICRO-COMMUNITIES</span>
            </div>
            <h1 className="page-title text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="page-subtitle text-sm text-muted mt-0.5">
              {user
                ? `You have access to ${displayCommunities.length} communities in your personal circle.`
                : 'Explore anonymity-first discussions, AI video showcases, and student events.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="btn btn-secondary btn-sm shadow-sm"
            >
              <Compass size={14} className="text-brand" />
              <span>Explore All</span>
            </Link>
            <Link
              href={user ? '/c/new' : '/login'}
              className="btn btn-primary btn-sm shadow-sm glow-brand"
            >
              <Plus size={14} />
              <span>{user ? 'New Space' : 'Join Community'}</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Short AI Generated Video & Visual Showcase Component */}
      <ScrollReveal animation="fade-up" delay={40}>
        <VideoHero />
      </ScrollReveal>

      {/* 3. Aesthetic Interactive Feature Stats Banner */}
      <ScrollReveal animation="fade-up" delay={80}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-4 flex items-center gap-3 shadow-xs hover:border-brand/40 transition-colors">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Radio size={18} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Sound FX</p>
              <p className="text-sm font-bold text-foreground">Web Audio API</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-4 flex items-center gap-3 shadow-xs hover:border-brand/40 transition-colors">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Privacy</p>
              <p className="text-sm font-bold text-foreground">Zero Author Leak</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-4 flex items-center gap-3 shadow-xs hover:border-brand/40 transition-colors">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">AI Spotlight</p>
              <p className="text-sm font-bold text-foreground">HD Video Loops</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-4 flex items-center gap-3 shadow-xs hover:border-brand/40 transition-colors">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap size={18} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Speed</p>
              <p className="text-sm font-bold text-foreground">Next 16 Turbopack</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 4. Active Micro-Communities Horizontal Pill Scroll */}
      <ScrollReveal animation="fade-up" delay={100}>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Flame size={13} className="text-brand" />
              Featured Circles
            </span>
            <Link href="/discover" className="text-xs font-semibold text-brand hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {displayCommunities.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="chip shrink-0 py-1.5 px-3 rounded-xl border border-border bg-surface hover:border-brand/50 hover:bg-surface-raised transition-all shadow-xs"
              >
                {c.icon_url ? (
                  <Image
                    src={c.icon_url}
                    alt=""
                    width={18}
                    height={18}
                    className="h-4.5 w-4.5 rounded-md object-cover"
                  />
                ) : (
                  <Hash size={13} className="text-brand" />
                )}
                <span className="font-medium text-xs text-foreground">{c.name}</span>
              </Link>
            ))}
            <Link
              href={user ? '/c/new' : '/login'}
              className="chip shrink-0 py-1.5 px-3 rounded-xl border border-dashed border-brand/40 text-brand hover:bg-brand-subtle transition-all"
            >
              <Plus size={13} />
              <span className="text-xs font-medium">New Circle</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* 5. Interactive Loader Suite & Animation Playground */}
      <ScrollReveal animation="fade-up" delay={120}>
        <LoaderShowcase />
      </ScrollReveal>

      {/* 6. Discussion Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Trending Discussions</span>
            <span className="text-xs font-normal text-muted">({displayPosts.length})</span>
          </h2>
          <span className="text-xs text-muted">Real-time synced</span>
        </div>

        <div className="space-y-3.5">
          {displayPosts.map((post, idx) => {
            const community = communityMap[post.community_id]
            return (
              <ScrollReveal
                key={post.id}
                animation="fade-up"
                delay={Math.min(idx * 40, 200)}
                duration={400}
              >
                <PostCard
                  post={{
                    ...post,
                    community_slug: post.community_slug || community?.slug,
                    community_name: post.community_name || community?.name,
                    reactions: reactions[post.id] ?? post.reactions ?? [],
                    commentCount: commentCounts[post.id] ?? post.commentCount ?? 0,
                    canModerate: user ? false : false,
                  }}
                  currentUserId={user?.id}
                />
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
