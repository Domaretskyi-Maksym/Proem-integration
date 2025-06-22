import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and fullName are required" }, { status: 400 });
    }

    const newAccount = await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: "12376876dhhdggjgaj",
        email,
        fullName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Account created:", newAccount);

    return NextResponse.json({ success: true, account: newAccount }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}