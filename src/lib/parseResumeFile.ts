import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - vite ?url import
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Set worker once
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdf(file);
  if (name.endsWith('.docx')) return extractDocx(file);
  if (name.endsWith('.txt') || name.endsWith('.md')) return file.text();
  throw new Error('暂只支持 PDF / DOCX / TXT 格式');
}

async function extractPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // deno-lint-ignore no-explicit-any
    const text = (content.items as any[]).map((it) => it.str || '').join(' ');
    pages.push(text);
  }
  return pages.join('\n\n').trim();
}

async function extractDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return (value || '').trim();
}
