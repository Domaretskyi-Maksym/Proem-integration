export const PROEM_API_CONFIG = {
  baseUrl: "https://proemhealth.nview.tech/AppApi/3/downloadInterviewResults",
};

export const buildProemApiUrl = (
  interviewResultId: number,
  accessId: string,
  accessToken: string
): string => {
  return `${PROEM_API_CONFIG.baseUrl}?accessId=${accessId}&accessToken=${accessToken}&interviewResultId=${interviewResultId}`;
};