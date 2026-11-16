import { PostSkeleton } from '@/app/components/ui/Skeleton'
import { QuantumBeamLoader, OrbitLoader } from '@/app/components/ui/Loaders'

export default function Loading() {
  return (
    <div className="page space-y-6 animate-fade-in" aria-busy="true" aria-live="polite">
      <div className="rounded-2xl border border-brand/20 bg-surface/50 backdrop-blur-md p-6 flex flex-col items-center justify-center shadow-lg">
        <OrbitLoader size={46} label="Synchronizing micro-communities..." />
        <QuantumBeamLoader />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
