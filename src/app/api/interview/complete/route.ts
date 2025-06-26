import { NextRequest, NextResponse } from "next/server";
import { getProemAuth } from "@/lib/proemAuth";
import {
  buildURLToFetchInterviewResults,
  buildUrlToFetchPDF,
} from "@/lib/proem/utils";
import { fetchPdfFromProem, fetchInterviewResults } from "@/lib/proem/api";
import { validateProemCallback } from "@/lib/validation/proem";
import { processInterviewTransaction } from "@/lib/db/interviewProcessor";
import { prisma } from "@/lib/client";
import {
  SuccessResponse,
  ErrorResponse,
  ProemCallbackBody,
} from "@/types/proem";
import { uploadPdfToSupabase } from "@/lib/supabase/utils";

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = (await request.json()) as Partial<ProemCallbackBody>;
    console.log("Received request body:", body);

    const validated = validateProemCallback(body);
    if (!validated?.interviewResultId) {
      return NextResponse.json(
        { error: "interviewResultId is missing or invalid" },
        { status: 400 }
      );
    }

    // The interviewResultId returned by Proem in the callback is used solely to retrieve the PDF result of the interview. It cannot be used to fetch a specific patient's interview.
    const { interviewResultId, bhtId } = validated;

    // Auth
    const { accessId, accessToken } = await getProemAuth();

    // Build URLs
    const pdfUrl = buildUrlToFetchPDF(interviewResultId, accessId, accessToken);
    
    // Since we are using the Iframe API instead of the Proem API, we cannot retrieve a specific patient's interview. However, we can fetch all interviews for the current day using the patientExternalId (returned as bhtId in the Proem callback), where the latest interview will be at the end of the interviewResults array.
    const resultsUrl = buildURLToFetchInterviewResults(accessId, accessToken, bhtId);

    console.log("Fetching PDF from:", pdfUrl);
    console.log("Fetching interview results from:", resultsUrl);

    // Fetch PDF and interview results
    const [pdfBuffer, interviewResults] = await Promise.all([
      fetchPdfFromProem(pdfUrl),
      fetchInterviewResults(resultsUrl),
    ]);

    console.log("PDF fetched successfully:", `${pdfBuffer.length} bytes`);
    console.log("Interview results fetched");


    const pdfUrlOnSupabase = await uploadPdfToSupabase(pdfBuffer, interviewResultId);

    // Pick last interview
    const interviews = interviewResults.interviewResults;
    const lastInterview = Array.isArray(interviews)
      ? interviews[interviews.length - 1]
      : null;

    if (!lastInterview) {
      console.warn("No valid interview results found, sending PDF only.");
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="interview_${interviewResultId}.pdf"`,
        },
      });
    }

    // Save to DB
    const transactionResult = await prisma.$transaction(
      async (tx) => {
        return await processInterviewTransaction(tx, lastInterview, pdfUrlOnSupabase);
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    console.log("Transaction result:", transactionResult);

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="interview_${interviewResultId}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /interview/complete:", message);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}