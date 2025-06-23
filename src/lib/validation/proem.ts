import { ProemCallbackBody } from "@/types/proem";

export const validateProemCallback = (
  body: Partial<ProemCallbackBody>
): { interviewResultId: number; bhId: string } | null => {
  const { interviewResultId, bhId } = body;

  if (!interviewResultId || isNaN(Number(interviewResultId))) {
    return null;
  }

  return {
    interviewResultId: Number(interviewResultId),
    bhId: String(bhId)
  };
};