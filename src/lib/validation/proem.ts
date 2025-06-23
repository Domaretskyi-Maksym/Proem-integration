import { ProemCallbackBody } from "@/types/proem";

export const validateProemCallback = (
  body: Partial<ProemCallbackBody>
): { interviewResultId: number; bhId: number } | null => {
  const { interviewResultId, bhId } = body;

  if (!interviewResultId || isNaN(Number(interviewResultId))) {
    return null;
  }

  if (bhId === undefined || isNaN(Number(bhId))) {
    return null;
  }

  return {
    interviewResultId: Number(interviewResultId),
    bhId: Number(bhId),
  };
};