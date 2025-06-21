export const fetchPdfFromProem = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const pdfArrayBuffer = await response.arrayBuffer();
  return Buffer.from(pdfArrayBuffer);
};