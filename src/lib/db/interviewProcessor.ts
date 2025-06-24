export interface InterviewResult {
  patient: string | number;
  interviewType: string;
  startedAt: string;
  completedAt: string;
  answers: { question: number; answerValue: string | number }[];
  id: string | number;
  status?: string;
  duration?: number;
  sequence?: number;
}

export interface InterviewResultsResponse {
  interviewResults: InterviewResult[];
}

export async function processInterviewTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any, // Replace with Prisma.TransactionClient in real TS setup
  lastInterview: InterviewResult
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

  // 2. Create new Form (not upsert!)
  const form = await tx.form.create({
    data: {
      title: `Interview_${lastInterview.interviewType}_${Date.now()}`,
      createdBy: 2222, // Replace with actual user if needed
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
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(lastInterview.completedAt),
    },
  });

  // 4. Create new FormFields + FormResponseFields for each answer
  for (const answer of lastInterview.answers) {
    const label = `Question_${answer.question}`;

    const field = await tx.formField.create({
      data: {
        formId: form.id,
        label,
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