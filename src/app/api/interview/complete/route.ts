import { NextRequest, NextResponse } from "next/server";
import { getProemAuth } from "@/lib/proemAuth";
import {
  buildURLToFetchInterviewResults,
  buildUrlToFetchPDF,
} from "@/lib/proem/utils";
import { fetchPdfFromProem, fetchInterviewResults } from "@/lib/proem/api";
import { validateProemCallback } from "@/lib/validation/proem";
import { saveToDatabase } from "@/lib/db/utils";
import { processInterviewTransaction } from "@/lib/db/interviewProcessor";
import { prisma } from "@/lib/client";
import {
  SuccessResponse,
  ErrorResponse,
  ProemCallbackBody,
} from "@/types/proem";

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = (await request.json()) as Partial<ProemCallbackBody>;
    console.log("Received request body:", body);
    const { interviewResultId, bhtId } = validateProemCallback(body) ?? {};

    if (!interviewResultId) {
      return NextResponse.json(
        { error: "interviewResultId is missing or invalid" },
        { status: 400 }
      );
    }

    await saveToDatabase(interviewResultId);

    const { accessId, accessToken } = await getProemAuth();
    const proemPDFApiUrl = buildUrlToFetchPDF(interviewResultId, accessId, accessToken);
    console.log("Fetching PDF from:", proemPDFApiUrl);

    const proemResultsApiUrl = buildURLToFetchInterviewResults(accessId, accessToken, bhtId);
    console.log("Fetching interview results from:", proemResultsApiUrl);

    const pdfBuffer = await fetchPdfFromProem(proemPDFApiUrl);
    console.log("PDF fetched successfully, size:", pdfBuffer.length, "bytes");

    const interviewResults = await fetchInterviewResults(proemResultsApiUrl);
    console.log("Interview results fetched:", interviewResults);


	// @ts-expect-error: Unreachable code error
    const lastInterview = interviewResults.interviewResults?.[interviewResults.interviewResults.length - 1];
    if (!lastInterview) {
      console.log("No interviews found or interviewResults structure invalid.");
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="interview_${interviewResultId}.pdf"`,
        },
      });
    }

  const transactionResult = await prisma.$transaction(async (tx) => {
      return await processInterviewTransaction(tx, lastInterview);
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    console.log("Transaction result:", transactionResult);
    console.log("Last Interview (ID:", lastInterview.id, "):", lastInterview);
    console.log("Answers for Last Interview:");
    console.dir(lastInterview.answers, { depth: null });

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}