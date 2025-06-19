// src/app/api/interview/complete/route.ts
import { NextRequest, NextResponse } from "next/server";

// Ініціалізація Prisma з глобальним кешем для Next.js
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

interface ProemCallbackBody {
  type: "finishedinterview";
  content: {
    interviewResultId: number;
  };
}

interface SuccessResponse {
  success: true;
  interviewResultId: number;
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    let interviewResultId: number | undefined;

    let body: Partial<ProemCallbackBody> = {};
    if (rawBody) {
      try {
        body = (await request.json()) as ProemCallbackBody;
        console.log("Parsed JSON body:", body);
        interviewResultId = body.content?.interviewResultId;
      } catch (jsonError) {
        console.error("Failed to parse JSON:", rawBody, jsonError);
      }
    }

    if (!interviewResultId) {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get("type");
      const resultId = searchParams.get("interviewResultId");

      console.log("Query parameters - type:", type, "interviewResultId:", resultId);

      if (type === "finishedinterview" && resultId) {
        interviewResultId = parseInt(resultId, 10);
        if (isNaN(interviewResultId)) {
          return NextResponse.json({ error: "Invalid interviewResultId format" }, { status: 400 });
        }
      }
    }

    if (!interviewResultId) {
      return NextResponse.json({ error: "interviewResultId is missing or invalid" }, { status: 400 });
    }

    console.log("Interview completed with ID:", interviewResultId);

    await prisma.callbackLog.create({
      data: {
        interviewResultId,
        type: "finishedinterview",
      },
    });

    return NextResponse.json({ success: true, interviewResultId }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error processing callback:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}