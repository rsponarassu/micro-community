import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Avatar from '@/app/components/ui/Avatar'
import { ShieldCheck, Calendar, Globe, Lock } from 'lucide-react'

interface AboutPageProps {
  params: Promise<{ slug: string }>
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name, slug, description, category, is_private, created_by, created_at')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) notFound()

  const community = rawCommunity as {
    id: string
    name: string
    slug: string
    description: string | null
    category: string | null
    is_private: boolean
    created_by: string
    created_at: string
  }

  // Fetch creator profile
  const { data: rawCreator } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('id', community.created_by)
    .single()

  const creator = rawCreator as {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  } | null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left 2 cols: Main details & Guidelines */}
      <div className="md:col-span-2 space-y-6">
        <div className="card p-6 border border-border bg-surface space-y-4">
          <h2 className="text-lg font-bold text-foreground">About {community.name}</h2>
          <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
            {community.description || 'No description provided for this community.'}
          </p>
        </div>

        {/* Community Guidelines */}
        <div className="card p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand" />
            <h2 className="text-base font-bold text-foreground">Community Rules & Safety</h2>
          </div>
          <ul className="space-y-3 text-sm text-foreground/85">
            <li className="flex items-start gap-2.5">
              <span className="font-bold text-brand">1.</span>
              <span><strong>Be constructive & respectful.</strong> No harassment, hate speech, or personal attacks against members.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-bold text-brand">2.</span>
              <span><strong>Responsible anonymity.</strong> Anonymous posts are protected by public views, but severe abuse can be escalated to moderators.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-bold text-brand">3.</span>
              <span><strong>Stay on topic.</strong> Keep discussions and event proposals relevant to {community.name}.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right col: Metadata & Founder info */}
      <div className="space-y-6">
        <div className="card p-5 border border-border bg-surface space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-xs">
            Community Info
          </h3>

          <div className="space-y-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foreground/70" />
              <span>Created on {formatDate(community.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              {community.is_private ? (
                <>
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Private Community (Approval required)</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-brand" />
                  <span>Public Community (Open membership)</span>
                </>
              )}
            </div>
            {community.category && (
              <div className="flex items-center gap-2">
                <span className="w-4 text-center font-bold">🏷️</span>
                <span>Category: {community.category}</span>
              </div>
            )}
          </div>

          {creator && (
            <div className="pt-4 border-t border-border">
              <span className="text-xs text-muted block mb-2">Created by</span>
              <div className="flex items-center gap-3">
                <Avatar
                  src={creator.avatar_url}
                  name={creator.display_name || creator.username}
                  size={36}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">
                    {creator.display_name || creator.username}
                  </div>
                  <div className="text-xs text-muted truncate">@{creator.username}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
