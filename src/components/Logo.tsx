/** The Hanuman Dal logo. Served from /public so it works everywhere, including html2canvas PDF capture. */
export default function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Hanuman Dal"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
