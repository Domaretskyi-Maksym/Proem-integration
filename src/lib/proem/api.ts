export const fetchPdfFromProem = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const pdfArrayBuffer = await response.arrayBuffer();
  return Buffer.from(pdfArrayBuffer);
};

export const fetchInterviewResults = async (url: string): Promise<unknown> => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch interview results: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching interview results:", error);
    throw error;
  }
};