import { PostSkeleton } from '@/app/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 animate-fade-in">
      {[...Array(3)].map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
