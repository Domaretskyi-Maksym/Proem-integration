import { ProemCallbackBody } from "@/types/proem";

export const validateProemCallback = (
  body: Partial<ProemCallbackBody>
): { interviewResultId: number; bhtId: string } | null => {
  const { interviewResultId, bhtId } = body;

  if (!interviewResultId || isNaN(Number(interviewResultId))) {
    return null;
  }

  return {
    interviewResultId: Number(interviewResultId),
    bhtId: String(bhtId),
  };
};
