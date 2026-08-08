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

async function renderCanvas(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  await document.fonts.ready

  // Wait for every image inside the element to finish loading.
  const imgs = Array.from(el.querySelectorAll('img'))
  if (imgs.some((i) => !i.complete)) {
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

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  // Snapshot resolved computed styles from the live DOM so we can bake them
  // into the clone that html2canvas creates internally.
  const origNodes = Array.from(el.querySelectorAll('*')) as HTMLElement[]
  const computed = origNodes.map((n) => window.getComputedStyle(n))
  const elComputed = window.getComputedStyle(el)

  return html2canvas(el, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    onclone(_doc, clonedEl) {
      // Inline resolved styles onto the root element and every descendant so
      // html2canvas doesn't need to resolve Tailwind v4's @property / CSS-var
      // chains (which it can't).
      applyComputed(clonedEl, elComputed)
      const clonedNodes = Array.from(clonedEl.querySelectorAll('*')) as HTMLElement[]
      for (let i = 0; i < clonedNodes.length; i++) {
        if (computed[i]) applyComputed(clonedNodes[i], computed[i])
      }
    },
  })
}

function applyComputed(node: HTMLElement, cs: CSSStyleDeclaration) {
  for (const prop of INLINE_PROPS) {
    const val = cs[prop]
    if (val && typeof val === 'string') {
      ;(node.style as Record<string, string>)[prop as string] = val
    }
  }
}

function canvasToPdf(canvas: HTMLCanvasElement): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  let heightLeft = imgH
  let position = 0
  const imgData = canvas.toDataURL('image/png')

  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
  heightLeft -= pageH

  while (heightLeft > 0) {
    position -= pageH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
    heightLeft -= pageH
  }
  return pdf
}

function withPdfExt(name: string) {
  return name.endsWith('.pdf') ? name : `${name}.pdf`
}

/** Render an element to a multi-page A4 PDF and trigger a download. */
export async function downloadElementPdf(el: HTMLElement, filename: string): Promise<void> {
  const pdf = canvasToPdf(await renderCanvas(el))
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
    const canvas = await renderCanvas(nodes[i], 2.5)
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
  const pdf = canvasToPdf(await renderCanvas(el))
  const blob = pdf.output('blob')
  return new File([blob], withPdfExt(filename), { type: 'application/pdf' })
}

/** Render an element to a PNG image File (for sharing / inline WhatsApp preview). */
export async function elementToPngFile(el: HTMLElement, filename: string): Promise<File> {
  const canvas = await renderCanvas(el, 3)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create receipt image'))), 'image/png'),
  )
  const name = filename.endsWith('.png') ? filename : `${filename}.png`
  return new File([blob], name, { type: 'image/png' })
}