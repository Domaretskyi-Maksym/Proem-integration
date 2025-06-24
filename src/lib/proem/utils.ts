export const PROEM_API_CONFIG = {
  getPDFresults:
    "https://proemhealth.nview.tech/AppApi/3/downloadInterviewResults",
  getInterviewResults:
    "https://proemhealth.nview.tech/AppApi/3/getInterviewResultAnswers",
};

export const buildUrlToFetchPDF = (
  interviewResultId: number,
  accessId: string,
  accessToken: string
): string => {
  return `${PROEM_API_CONFIG.getPDFresults}?accessId=${accessId}&accessToken=${accessToken}&interviewResultId=${interviewResultId}`;
};

export const buildURLToFetchInterviewResults = (
  accessId: string,
  accessToken: string,
  patientExternalId?: string
): string => {
  const now = new Date();
  const startDateTime = new Date(now);
  startDateTime.setMinutes(now.getMinutes() - 10);
  const endDateTime = new Date(now);
  endDateTime.setMinutes(now.getMinutes() + 10);

  const startDate = startDateTime.toISOString(); // "2025-06-23T13:05:00.000Z"
  const endDate = endDateTime.toISOString(); // "2025-06-23T13:25:00.000Z"

  return `${PROEM_API_CONFIG.getInterviewResults}?accessId=${accessId}&accessToken=${accessToken}&patientExternalId=${patientExternalId}&startDate=${startDate}&endDate=${endDate}`;
};
