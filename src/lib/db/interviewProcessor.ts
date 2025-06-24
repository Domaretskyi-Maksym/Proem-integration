import { Prisma } from "@prisma/client";

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


export async function processInterviewTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  lastInterview: InterviewResult
) {
  const patientRecord = await tx.patient.findUnique({
    where: { id: lastInterview.patient },
    select: { organizationId: true },
  });

  const organizationId = patientRecord?.organizationId;

  if (!organizationId) {
    throw new Error(`Organization ID not found for patient ${lastInterview.patient}`);
  }

  // 1. Upsert Patient
  const patient = await tx.patient.upsert({
    where: { id: lastInterview.patient },
    create: {
      id: lastInterview.patient,
      organizationId,
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(),
    },
    update: { updatedAt: new Date() },
  });

  // 2. Upsert Form
  const form = await tx.form.upsert({
    where: { id: 1 },
    create: {
      title: `Interview_${lastInterview.interviewType}`,
      createdBy: 2222,
      organizationId,
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(lastInterview.completedAt),
    },
    update: { updatedAt: new Date(lastInterview.completedAt) },
  });

  // 3. Create FormResponse
  const formResponse = await tx.formResponse.create({
    data: {
      formId: form.id,
      patientId: patient.id,
      createdAt: new Date(lastInterview.startedAt),
      updatedAt: new Date(lastInterview.completedAt),
    },
  });

  // 4. Handle answers -> fields + responseFields
  const createdFields = new Map<string, Awaited<ReturnType<typeof tx.formField.create>>>();
  const createdResponses = new Set<string>();

  const responseFieldPromises = lastInterview.answers.map(async (answer) => {
    const label = `Question_${answer.question}`;
    let field = createdFields.get(label);

    if (!field) {
      field = await tx.formField.findFirst({ where: { label } });

      if (!field) {
        field = await tx.formField.create({
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
        console.log(`Created FormField: ${field.id}`);
      } else {
        console.log(`Found existing FormField: ${field.id}`);
      }

      createdFields.set(label, field);
    }

    const responseKey = `${formResponse.id}-${field.id}`;
    if (!createdResponses.has(responseKey)) {
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
      createdResponses.add(responseKey);
      console.log(`Created FormResponseField: response ${formResponse.id}, field ${field.id}`);
    }
  });

  await Promise.all(responseFieldPromises);

  return { success: true };
}