import { NextRequest, NextResponse } from "next/server";
import { getProemAuth } from "@/lib/proemAuth";
import { buildProemApiUrl } from "@/lib/proem/utils";
import { fetchPdfFromProem } from "@/lib/proem/api";
import { validateProemCallback } from "@/lib/validation/proem";
import { saveToDatabase } from "@/lib/db/utils";
import { prisma } from "@/lib/client";
import { SuccessResponse, ErrorResponse, ProemCallbackBody } from "@/types/proem";

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await request.json() as Partial<ProemCallbackBody>;
    const interviewResultId = validateProemCallback(body);

    if (!interviewResultId) {
      return NextResponse.json({ error: "interviewResultId is missing or invalid" }, { status: 400 });
    }

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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch((err: Error) =>
      console.error("Failed to disconnect Prisma:", err)
    );
  }
}