declare module 'pdfjs-dist/build/pdf.mjs' {
  import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'

  export const GlobalWorkerOptions: {
    workerSrc: string
  }

  export function getDocument(src: string | { url: string }): {
    promise: Promise<PDFDocumentProxy>
  }
}
