import { NextRequest, NextResponse } from "next/server";
import { getProemAuth } from "@/lib/proemAuth";
import {
  buildURLToFetchInterviewResults,
  buildUrlToFetchPDF,
} from "@/lib/proem/utils";
import { fetchPdfFromProem, fetchInterviewResults } from "@/lib/proem/api";
import { validateProemCallback } from "@/lib/validation/proem";
import { saveToDatabase } from "@/lib/db/utils";
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
    console.log(body);
    const { interviewResultId, bhtId } = validateProemCallback(body) ?? {};

    if (!interviewResultId) {
      return NextResponse.json(
        { error: "interviewResultId is missing or invalid" },
        { status: 400 }
      );
    }

    await saveToDatabase(interviewResultId);

    const { accessId, accessToken } = await getProemAuth();
    const proemPDFApiUrl = buildUrlToFetchPDF(
      interviewResultId,
      accessId,
      accessToken
    );
    console.log("Fetching PDF from:", proemPDFApiUrl);

    const proemResultsApiUrl = buildURLToFetchInterviewResults(
      accessId,
      accessToken,
      bhtId
    );
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

    // Start Prisma transaction for the last interview
    await prisma.$transaction(async (tx) => {
      // Define a default organizationId (replace with dynamic logic if needed)
      const organizationId = "165746c5-4a59-4106-b39c-afc65d3abde6";

      // Upsert Patient
      const patient = await tx.patient.upsert({
        where: { id: lastInterview.patient },
        create: {
          id: lastInterview.patient,
          organizationId,
          createdAt: new Date(lastInterview.startedAt),
          updatedAt: new Date(),
        },
        update: { updatedAt: new Date() },
      });

      // Upsert Form based on interviewType
      const form = await tx.form.upsert({
        where: { id: 1 }, // Shpould be replaced with correct ID
        create: {
          title: `Interview_${lastInterview.interviewType}`,
          createdBy: 2222, // Replace with actual ID
          organizationId,
          createdAt: new Date(lastInterview.startedAt),
          updatedAt: new Date(lastInterview.completedAt),
        },
        update: { updatedAt: new Date(lastInterview.completedAt) },
      });

      console.log("Form:", form);

      // Create FormResponse
      const formResponse = await tx.formResponse.create({
        data: {
          formId: form.id, // Use form.id instead of hardcoded 1
          patientId: patient.id,
          createdAt: new Date(lastInterview.startedAt),
          updatedAt: new Date(lastInterview.completedAt),
        },
      });

      // Create FormResponseField for each answer with dynamic FormField creation
      if (lastInterview.answers && Array.isArray(lastInterview.answers)) {
        for (const answer of lastInterview.answers) {
          let field = await tx.formField.findFirst({
            where: { label: `Question_${answer.question}` },
          });
          if (!field) {
            // Create FormField if it doesn't exist
            field = await tx.formField.create({
              data: {
                formId: form.id,
                label: `Question_${answer.question}`,
                type: typeof answer.answerValue === "string" ? "text" : "number",
                sortOrder: 0,
                isRequired: false,
                createdAt: new Date(lastInterview.startedAt),
                updatedAt: new Date(lastInterview.completedAt),
              },
            });
            console.log(`Created FormField for question ${answer.question}`);
          } else {
            console.log(`Found existing FormField for question ${answer.question}`);
          }

          // Create FormResponseField
          await tx.formResponseField.create({
            data: {
              responseId: formResponse.id,
              fieldId: field.id,
              valueString: typeof answer.answerValue === "string" ? answer.answerValue : null,
              valueNumber: typeof answer.answerValue === "number" ? answer.answerValue : null,
              createdAt: new Date(lastInterview.startedAt),
              updatedAt: new Date(lastInterview.completedAt),
            },
          });
        }
      }
    });

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
  } finally {
    await prisma
      .$disconnect()
      .catch((err: Error) =>
        console.error("Failed to disconnect Prisma:", err)
      );
  }
}
