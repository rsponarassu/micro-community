import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Users, Lock } from 'lucide-react'
import CommunityHeaderActions from './CommunityHeaderActions'
import CommunityTabs from './CommunityTabs'

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
    <div className="page page-wide space-y-5">
      {/* Banner & Header */}
      <div className="card overflow-hidden">
        <div className="relative h-32 w-full overflow-hidden bg-surface-raised sm:h-44">
          {community.cover_url ? (
            <Image
              src={community.cover_url}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-r from-brand/25 via-accent/20 to-brand/10" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
        </div>

        <div className="relative p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="-mt-9 mb-3 flex flex-col justify-between gap-3 sm:-mt-10 sm:flex-row sm:items-end">
            <div className="flex items-end gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border-4 border-surface bg-surface-raised text-2xl font-bold text-foreground shadow-md sm:h-20 sm:w-20">
                {community.icon_url ? (
                  <Image
                    src={community.icon_url}
                    alt={`${community.name} logo`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{community.name[0].toUpperCase()}</span>
                )}
              </div>

              <div className="mb-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
                    {community.name}
                  </h1>
                  {community.is_private && (
                    <Lock className="h-4 w-4 shrink-0 text-muted" aria-label="Private community" />
                  )}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                  {community.category && (
                    <>
                      <span>{community.category}</span>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
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
            <p className="prose-content mb-3 max-w-3xl text-sm text-text-secondary">
              {community.description}
            </p>
          )}

          <CommunityTabs slug={community.slug} canAdmin={isModOrOwner} />
        </div>
      </div>

      {/* Main tab content */}
      <div>{children}</div>
    </div>
  )
}
