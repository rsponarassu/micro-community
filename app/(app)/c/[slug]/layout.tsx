import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Lock } from 'lucide-react'
import CommunityHeaderActions from './CommunityHeaderActions'

interface CommunityLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function CommunityLayout({
  children,
  params,
}: CommunityLayoutProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch community details
  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name, slug, description, category, icon_url, cover_url, is_private, created_by, created_at')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) {
    notFound()
  }

  const community = rawCommunity as {
    id: string
    name: string
    slug: string
    description: string | null
    category: string | null
    icon_url: string | null
    cover_url: string | null
    is_private: boolean
    created_by: string
    created_at: string
  }

  // Fetch member count
  const { count: memberCount } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id)
    .eq('status', 'active')

  // Fetch user membership
  let userMembership: { role: 'owner' | 'moderator' | 'member'; status: 'active' | 'pending' | 'banned' } | null = null
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('role, status')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()

    if (mem) {
      userMembership = mem as { role: 'owner' | 'moderator' | 'member'; status: 'active' | 'pending' | 'banned' }
    }
  }

  const isModOrOwner = userMembership?.status === 'active' && (userMembership.role === 'owner' || userMembership.role === 'moderator')

  return (
    <div className="space-y-6">
      {/* Banner & Header */}
      <div className="card overflow-hidden border border-border bg-surface">
        <div className="h-40 sm:h-52 w-full relative bg-surface-raised overflow-hidden">
          {community.cover_url ? (
            <Image
              src={community.cover_url}
              alt={community.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-brand/20 via-purple-500/20 to-pink-500/10" />
          )}
        </div>

        <div className="p-5 sm:p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-surface bg-surface-raised overflow-hidden flex items-center justify-center font-bold text-2xl text-foreground shadow-md shrink-0">
                {community.icon_url ? (
                  <Image
                    src={community.icon_url}
                    alt={community.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{community.name[0].toUpperCase()}</span>
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {community.name}
                  </h1>
                  {community.is_private && (
                    <span title="Private community">
                      <Lock className="w-4 h-4 text-muted" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-1">
                  <span>/c/{community.slug}</span>
                  {community.category && (
                    <>
                      <span>•</span>
                      <span>{community.category}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {memberCount ?? 0} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            </div>

            <CommunityHeaderActions
              communityId={community.id}
              communityName={community.name}
              membershipStatus={userMembership?.status ?? null}
              isMember={userMembership?.status === 'active'}
            />
          </div>

          {community.description && (
            <p className="text-sm text-foreground/80 max-w-3xl mb-4">
              {community.description}
            </p>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-t border-border pt-3 overflow-x-auto">
            <Link
              href={`/c/${community.slug}`}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-raised transition-colors text-foreground"
            >
              Feed
            </Link>
            <Link
              href={`/c/${community.slug}/events`}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-raised transition-colors text-foreground"
            >
              Events
            </Link>
            <Link
              href={`/c/${community.slug}/members`}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-raised transition-colors text-foreground"
            >
              Members
            </Link>
            <Link
              href={`/c/${community.slug}/about`}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-raised transition-colors text-foreground"
            >
              About
            </Link>
            {isModOrOwner && (
              <Link
                href={`/c/${community.slug}/admin`}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-brand hover:bg-brand/10 transition-colors ml-auto"
              >
                ⚙️ Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main tab content */}
      <div>{children}</div>
    </div>
  )
}
