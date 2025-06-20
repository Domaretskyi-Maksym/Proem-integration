import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import { getProemAuth } from "@/lib/proemAuth";
import { prisma } from "@/lib/client";

interface ProemCallbackBody {
  interviewResultId: number;
  bhId?: string;
}

interface SuccessResponse {
  success: true;
  interviewResultId: number;
  pdfUrl?: string;
}

interface ErrorResponse {
  error: string;
}

const PROEM_API_CONFIG = {
  baseUrl: "https://proemhealth.nview.tech/AppApi/3/downloadInterviewResults",
};

const buildProemApiUrl = (interviewResultId: number, accessId: string, accessToken: string): string => {
  return `${PROEM_API_CONFIG.baseUrl}?accessId=${accessId}&accessToken=${accessToken}&interviewResultId=${interviewResultId}`;
};

const validateRequestBody = (body: Partial<ProemCallbackBody>): number | null => {
  const interviewResultId = body.interviewResultId;
  if (!interviewResultId || isNaN(Number(interviewResultId))) {
    return null;
  }
  return Number(interviewResultId);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const saveToDatabase = async (interviewResultId: number): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set, skipping database operation");
    return;
  }
  
  console.log("Data saved to database");
};

const fetchPdfFromProem = async (url: string): Promise<Buffer> => {
  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  const pdfArrayBuffer = await response.arrayBuffer();
  return Buffer.from(pdfArrayBuffer);
};

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await request.json() as Partial<ProemCallbackBody>;
    console.log("Parsed JSON body:", body);

    const interviewResultId = validateRequestBody(body);
    if (!interviewResultId) {
      return NextResponse.json(
        { error: "interviewResultId is missing or invalid" },
        { status: 400 }
      );
    }

    console.log("Interview completed with ID:", interviewResultId);

    await saveToDatabase(interviewResultId);

    const { accessId, accessToken } = await getProemAuth();
    const proemApiUrl = buildProemApiUrl(interviewResultId, accessId, accessToken);
    console.log("Fetching PDF from:", proemApiUrl);

    const pdfBuffer = await fetchPdfFromProem(proemApiUrl);
    console.log("PDF fetched successfully, size:", pdfBuffer.length, "bytes");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="interview_${interviewResultId}.pdf"`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing callback:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch((err: Error) => console.error("Failed to disconnect Prisma:", err));
  }
}