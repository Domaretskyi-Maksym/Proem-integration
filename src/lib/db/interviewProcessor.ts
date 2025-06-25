import { PrismaClient } from "@/lib/prisma/generated";
type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export interface Interview {
  id: number;
  title: string;
}

export interface InterviewResult {
  patient: string | number;
  interviewType: string;
  startedAt: string;
  completedAt: string;
  answers: { questionName: string; answerValue: string | number }[];
  id: string | number;
  interview: Interview;
  status?: string;
  duration?: number;
  sequence?: number;
}

export interface InterviewResultsResponse {
  interviewResults: InterviewResult[];
}

export async function processInterviewTransaction(
  tx: TxClient,
  lastInterview: InterviewResult,
  pdfUrlOnSupabase: string
) {
  const patientRecord = await tx.patient.findUnique({
    where: { id: String(lastInterview.patient) },
    select: { organizationId: true },
  });

  const organizationId = patientRecord?.organizationId;
  if (!organizationId) {
    throw new Error(`Organization ID not found for patient ${lastInterview.patient}`);
  }

  // 1. Upsert Patient
  const patient = await tx.patient.upsert({
    where: { id: String(lastInterview.patient) },
    create: {
      id: String(lastInterview.patient),
      organizationId,
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(),
    },
    update: {
      updatedAt: new Date(),
    },
  });

  // 2. Create new Form
  const form = await tx.form.create({
    data: {
      title: lastInterview.interview.title,
      createdBy: 2222,
      organizationId,
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(lastInterview.completedAt),
    },
  });

  // 3. Create new FormResponse
  const formResponse = await tx.formResponse.create({
    data: {
      formId: form.id,
      patientId: patient.id,
      pdfUrl: pdfUrlOnSupabase,
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(lastInterview.completedAt),
    },
  });

  for (const answer of lastInterview.answers) {

    // 4. Create a field for each question
    const field = await tx.formField.create({
      data: {
        formId: form.id,
        label: answer.questionName,
        type: typeof answer.answerValue === "string" ? "text" : "number",
        sortOrder: 0,
        isRequired: false,
        createdAt: new Date(lastInterview.startedAt),
        updatedAt: new Date(lastInterview.completedAt),
      },
    });

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

  return { success: true };
}