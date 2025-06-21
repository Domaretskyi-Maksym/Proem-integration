import { ProemCallbackBody } from "@/types/proem";

export const validateProemCallback = (
  body: Partial<ProemCallbackBody>
): number | null => {
  const interviewResultId = body.interviewResultId;
  if (!interviewResultId || isNaN(Number(interviewResultId))) {
    return null;
  }
  return Number(interviewResultId);
};