import { NextRequest, NextResponse } from "next/server";
import { getProemAuth } from "@/lib/proemAuth";
import { buildURLToFetchInterviewResults, buildUrlToFetchPDF } from "@/lib/proem/utils";
import { fetchPdfFromProem, fetchInterviewResults } from "@/lib/proem/api";
import { validateProemCallback } from "@/lib/validation/proem";
import { saveToDatabase } from "@/lib/db/utils";
import { prisma } from "@/lib/client";
import { SuccessResponse, ErrorResponse, ProemCallbackBody } from "@/types/proem";

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await request.json() as Partial<ProemCallbackBody>;
    const { interviewResultId, bhId } = validateProemCallback(body) ?? {};

    if (!interviewResultId) {
      return NextResponse.json({ error: "interviewResultId is missing or invalid" }, { status: 400 });
    }

    await saveToDatabase(interviewResultId);

    const { accessId, accessToken } = await getProemAuth();
    const proemPDFApiUrl = buildUrlToFetchPDF(interviewResultId, accessId, accessToken);
	console.log("Fetching PDF from:", proemPDFApiUrl);

	const proemResultsApiUrl = buildURLToFetchInterviewResults(accessId, accessToken, bhId);
	console.log("Fetching interview results from:", proemResultsApiUrl);

    const pdfBuffer = await fetchPdfFromProem(proemPDFApiUrl);
	console.log("PDF fetched successfully, size:", pdfBuffer.length, "bytes");

	const interviewResults = await fetchInterviewResults(proemResultsApiUrl);
    console.log("Interview results fetched:", interviewResults);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="interview_${interviewResultId}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch((err: Error) =>
      console.error("Failed to disconnect Prisma:", err)
    );
  }
}