import Image from 'next/image'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
}

export default function Avatar({ src, name, size = 36 }: AvatarProps) {
  const initials = getInitials(name)
  const fontSize = Math.max(10, Math.floor(size * 0.38))

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    )
  }

  // Generate a consistent color from the name
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 60% 55%)`,
        color: 'white',
        fontSize,
      }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}
