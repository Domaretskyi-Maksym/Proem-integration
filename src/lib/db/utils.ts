import { prisma } from "@/lib/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveToDatabase = async (interviewResultId: number): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set, skipping database operation");
    return;
  }

  // TODO: Add actual DB logic here
  console.log("Data saved to database (placeholder)");
};

export async function getOrganizationIdByPatientId(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { organizationId: true },
  });
  if (!patient) {
    throw new Error(`Patient with id ${patientId} not found`);
  }
  return patient.organizationId;
}