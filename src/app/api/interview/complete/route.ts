// src/app/api/interview/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

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

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  console.log("Received POST request to /api/interview/complete");
  try {
    const body = await request.json() as Partial<ProemCallbackBody>;

    console.log("Parsed JSON body:", body);

    const interviewResultId = body.interviewResultId;

    if (!interviewResultId || isNaN(Number(interviewResultId))) {
      return NextResponse.json(
        { error: "interviewResultId is missing or invalid" },
        { status: 400 }
      );
    }

    console.log("Interview completed with ID:", interviewResultId);

    if (process.env.DATABASE_URL) {
      await prisma.callbackLog.create({
        data: {
          interviewResultId: Number(interviewResultId),
          type: "finishedinterview",
        },
      });
      console.log("Data saved to database");
    } else {
      console.warn("DATABASE_URL is not set, skipping database operation");
    }

    const proemApiUrl = `https://proemhealth.nview.tech/AppApi/3/downloadInterviewResults?accessId=DHeXPAJ1hRg0_NTHkXSZZJAd_bpJq3yA&accessToken=-LGNtwl_tb8IoiLKbcBO4gBelZiv1E1P&interviewResultId=${interviewResultId}`;

    console.log("Fetching PDF from:", proemApiUrl);

    const response = await fetch(proemApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Використовуємо arrayBuffer замість buffer
    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer); // Конвертуємо в Buffer для NextResponse
    console.log("PDF fetched successfully, size:", pdfBuffer.length, "bytes");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="interview_${interviewResultId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error processing callback:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}