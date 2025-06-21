import { NextResponse } from 'next/server';
import { prisma } from '@/lib/client';

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        organization: true,
        patient: true,
        providerAssignments: true,
        formAssignments: true,
        formResponses: true,
      },
    });
    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}