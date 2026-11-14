import { PostSkeleton } from '@/app/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="page space-y-4 animate-fade-in" aria-busy="true" aria-live="polite">
      {[...Array(3)].map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
