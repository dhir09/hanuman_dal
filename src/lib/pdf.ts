import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

// We rasterise the element with html2canvas-pro so Gujarati text renders exactly
// as shown on screen (no PDF-font embedding needed). html2canvas-pro also supports
// modern CSS colour functions like oklch(), which Tailwind v4 emits.

// CSS properties that html2canvas can't resolve from Tailwind v4's @property /
// CSS-variable chains (gradients, custom-property colours, spacing vars, etc.).
// Only visual-paint properties — never layout-affecting ones (width, height,
// display, flex-*, padding, margin, gap) which would collapse the flow layout
// that html2canvas relies on to position elements.
const INLINE_PROPS: (keyof CSSStyleDeclaration)[] = [
  'backgroundColor',
  'backgroundImage',
  'color',
  'borderColor',
  'borderRadius',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'opacity',
  'boxShadow',
  'borderWidth',
  'borderStyle',
  'textAlign',
]

/** Width (CSS px) a receipt is laid out at for capture when the caller has no preference. */
const DEFAULT_CAPTURE_WIDTH = 420

/** Wait for every image inside `el` to finish loading (or fail). */
async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img'))
  if (!imgs.some((i) => !i.complete)) return
  await Promise.all(
    imgs.map((i) =>
      i.complete
        ? Promise.resolve()
        : new Promise<void>((r) => {
            i.addEventListener('load', () => r(), { once: true })
            i.addEventListener('error', () => r(), { once: true })
          }),
    ),
  )
}

/**
 * Replace every `<img src="/…">` inside `root` with an inline base64 data URI.
 *
 * html2canvas re-fetches image URLs itself while it captures, and on a cold cache
 * (the very first share after opening the app) that fetch loses the race — the
 * receipt's logo and signature come out missing, which collapses the header band.
 * Refreshing "fixes" it only because the browser has since cached the files.
 * Baking the bytes straight into the clone removes the network step entirely, so
 * the first capture looks identical to every later one.
 */
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('data:')) return
      try {
        const res = await fetch(src)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error(`Could not read ${src}`))
          reader.readAsDataURL(blob)
        })
        img.setAttribute('src', dataUrl)
      } catch {
        // Leave the original URL in place — a missing image is better than a throw.
      }
    }),
  )
}

type CaptureOptions = {
  scale?: number
  /** Lay the copy out at exactly this width. Omit for nodes that already own a fixed width. */
  layoutWidth?: number
  /** Minimum viewport width for html2canvas' internal clone iframe. */
  windowWidth?: number
}

async function renderCanvas(el: HTMLElement, opts: CaptureOptions = {}): Promise<HTMLCanvasElement> {
  const { scale = 2, layoutWidth, windowWidth } = opts
  await document.fonts.ready
  await waitForImages(el)

  // Capture a detached copy laid out at a fixed width, parked off-screen — never
  // the on-screen node. html2canvas re-runs layout for the whole page inside an
  // iframe sized to the live viewport, but it captures the *region* it measured
  // from the real document. On a phone those two layouts drift apart (narrower
  // viewport, page scrolled, fixed header/bottom-nav), so the captured region
  // lands on the wrong part of a taller clone — which is why the receipt's header
  // band came out blown up across a whole PDF page. A copy that owns its width
  // and sits at a stable document position makes the output identical everywhere.
  const holder = document.createElement('div')
  holder.setAttribute('aria-hidden', 'true')
  // `max-content` keeps nodes that already declare their own width (the report
  // pages) at that width; receipts get an explicit layoutWidth instead.
  holder.style.cssText = `position:absolute;left:-10000px;top:0;width:${
    layoutWidth ? `${layoutWidth}px` : 'max-content'
  };background:#ffffff;pointer-events:none;`
  const copy = el.cloneNode(true) as HTMLElement
  copy.style.margin = '0'
  holder.appendChild(copy)
  document.body.appendChild(holder)

  try {
    // Bake image bytes into the clone first, then wait for those data URIs to
    // decode, so html2canvas never has to fetch anything mid-capture.
    await inlineImages(copy)
    await waitForImages(copy)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    // Snapshot resolved computed styles from the off-screen copy so we can bake
    // them into the clone that html2canvas creates internally.
    const nodes = Array.from(copy.querySelectorAll('*')) as HTMLElement[]
    const computed = nodes.map((n) => window.getComputedStyle(n))
    const copyComputed = window.getComputedStyle(copy)

    return await html2canvas(copy, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: Math.max(windowWidth ?? 0, holder.offsetWidth + 40),
      windowHeight: Math.max(copy.scrollHeight + 40, window.innerHeight),
      onclone(_doc, clonedEl) {
        // Inline resolved styles onto the root element and every descendant so
        // html2canvas doesn't need to resolve Tailwind v4's @property / CSS-var
        // chains (which it can't).
        applyComputed(clonedEl, copyComputed)
        const clonedNodes = Array.from(clonedEl.querySelectorAll('*')) as HTMLElement[]
        for (let i = 0; i < clonedNodes.length; i++) {
          if (computed[i]) applyComputed(clonedNodes[i], computed[i])
        }
      },
    })
  } finally {
    holder.remove()
  }
}

function applyComputed(node: HTMLElement, cs: CSSStyleDeclaration) {
  for (const prop of INLINE_PROPS) {
    const val = cs[prop]
    if (val && typeof val === 'string') {
      ;(node.style as unknown as Record<string, string>)[prop as string] = val
    }
  }
}

/**
 * Place a receipt canvas on a single A4 page, scaled down to fit if it is taller
 * than the page. Receipts are one-page documents — slicing them across pages left
 * a stray sliver on page 2.
 */
function canvasToPdf(canvas: HTMLCanvasElement): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 8

  let w = pageW - margin * 2
  let h = (canvas.height * w) / canvas.width
  if (h > pageH - margin * 2) {
    h = pageH - margin * 2
    w = (canvas.width * h) / canvas.height
  }

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - w) / 2, margin, w, h)
  return pdf
}

function withPdfExt(name: string) {
  return name.endsWith('.pdf') ? name : `${name}.pdf`
}

/** Render a receipt element to a single-page A4 PDF and trigger a download. */
export async function downloadElementPdf(el: HTMLElement, filename: string): Promise<void> {
  const pdf = canvasToPdf(await renderCanvas(el, { layoutWidth: DEFAULT_CAPTURE_WIDTH }))
  pdf.save(withPdfExt(filename))
}

/**
 * Render a list of already-page-sized elements, one per A4 page. Each node is
 * scaled to fit within the page (so content is never clipped). Use this for long,
 * paginated reports (hundreds of rows) — it keeps every canvas small, well under
 * the browser's max-canvas-size limit.
 */
export async function renderPagesToPdf(nodes: HTMLElement[], filename: string): Promise<void> {
  // JPEG + PDF compression keeps big multi-hundred-row reports to a few MB instead
  // of hundreds. Scale 1.5 is plenty sharp for text and ~2x faster than scale 2.
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < nodes.length; i++) {
    const canvas = await renderCanvas(nodes[i], { scale: 2.5, windowWidth: 800 })
    let w = pageW
    let h = (canvas.height * w) / canvas.width
    // If a page came out taller than A4, scale it down to fit (centered) so nothing clips.
    if (h > pageH) {
      h = pageH
      w = (canvas.width * h) / canvas.height
    }
    const x = (pageW - w) / 2
    if (i > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 0, w, h)
  }
  pdf.save(withPdfExt(filename))
}

/** Render an element to a PDF File (for sharing via the Web Share API). */
export async function elementToPdfFile(el: HTMLElement, filename: string): Promise<File> {
  const pdf = canvasToPdf(await renderCanvas(el, { layoutWidth: DEFAULT_CAPTURE_WIDTH }))
  const blob = pdf.output('blob')
  return new File([blob], withPdfExt(filename), { type: 'application/pdf' })
}

/** Render an element to a PNG image File (for sharing / inline WhatsApp preview). */
export async function elementToPngFile(el: HTMLElement, filename: string): Promise<File> {
  const canvas = await renderCanvas(el, { scale: 3, layoutWidth: DEFAULT_CAPTURE_WIDTH })
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create receipt image'))), 'image/png'),
  )
  const name = filename.endsWith('.png') ? filename : `${filename}.png`
  return new File([blob], name, { type: 'image/png' })
}