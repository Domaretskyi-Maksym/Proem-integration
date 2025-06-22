import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const accounts = await prisma.account.findMany();
    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}