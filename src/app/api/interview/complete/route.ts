// src/app/api/interview/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

interface ProemCallbackBody {
  interviewResultId: number; // Оновлено для прямого поля
  bhId?: string; // Додаткове поле від Proem
}

interface SuccessResponse {
  success: true;
  interviewResultId: number;
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  console.log("Received POST request to /api/interview/complete");
  try {
    // Пряме парсинг тіла як JSON
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

    await prisma.callbackLog.create({
      data: {
        interviewResultId: Number(interviewResultId), // Перетворюємо в число
        type: "finishedinterview",
      },
    });

    return NextResponse.json(
      { success: true, interviewResultId: Number(interviewResultId) },
      { status: 200 }
    );
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