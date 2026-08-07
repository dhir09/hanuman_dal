// Phonetic English -> Gujarati transliteration using Google Input Tools
// (the same engine behind Google's Gujarati typing). Requires internet;
// on failure/offline it returns '' so the caller keeps the manual value.

const cache = new Map<string, string>()

export async function transliterateToGujarati(text: string, signal?: AbortSignal): Promise<string> {
  const q = text.trim()
  if (!q) return ''
  // Nothing to transliterate if there are no Latin letters.
  if (!/[a-zA-Z]/.test(q)) return ''

  const cached = cache.get(q.toLowerCase())
  if (cached !== undefined) return cached

  try {
    const url =
      'https://inputtools.google.com/request?itc=gu-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&text=' +
      encodeURIComponent(q)
    const res = await fetch(url, { signal })
    const data = await res.json()
    if (data?.[0] === 'SUCCESS') {
      const out = data[1]?.[0]?.[1]?.[0] as string | undefined
      if (out) {
        cache.set(q.toLowerCase(), out)
        return out
      }
    }
  } catch {
    // offline, blocked, or aborted — caller keeps whatever is there
  }
  return ''
}
