/** Open WhatsApp with a prefilled text message (no attachment). */
export function shareOnWhatsApp(message: string, phone?: string) {
  const text = encodeURIComponent(message)
  let digits = (phone || '').replace(/\D/g, '')
  // Assume India if a 10-digit number was entered without a country code.
  if (digits.length === 10) digits = '91' + digits
  const url = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`
  window.open(url, '_blank')
}

/**
 * Share a file (PDF/image) together with a caption using the native share sheet,
 * so the user can send it through WhatsApp with the attachment included.
 * On phones this opens the OS share sheet (WhatsApp appears as an option).
 * Returns true if the native share ran; false if the device can't share files
 * (typically desktop browsers), so the caller can fall back to text + download.
 */
export async function shareFile(file: File, text: string, title: string): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }
  const data: ShareData = { files: [file], text, title }
  if (nav.share && (!nav.canShare || nav.canShare(data))) {
    try {
      await nav.share(data)
      return true
    } catch (err) {
      // User cancelled the share sheet — treat as handled, don't fall back.
      if (err instanceof DOMException && err.name === 'AbortError') return true
      return false
    }
  }
  return false
}
