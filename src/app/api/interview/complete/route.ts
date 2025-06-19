// src/app/api/interview/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    // Отримуємо сирі дані запиту
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    let interviewResultId: number | undefined;

    // Спроба парсити JSON з тіла
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

    // Перевірка query parameters, якщо JSON відсутній
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

    // Перевірка валідності
    if (!interviewResultId) {
      return NextResponse.json({ error: "interviewResultId is missing or invalid" }, { status: 400 });
    }

    // Логування для дебагу
    console.log("Interview completed with ID:", interviewResultId);

    // Зберігаємо callback у базі даних (опціонально)
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