export const PROEM_API_CONFIG = {
  getPDFresults: "https://proemhealth.nview.tech/AppApi/3/downloadInterviewResults",
  getInterviewResults: "https://proemhealth.nview.tech/AppApi/3/getInterviewResultAnswers",
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
  now.setMinutes(now.getMinutes() - 10);
  const startDate = now.toISOString();
  const endDate = now.toISOString().split('T')[0];

  return `${PROEM_API_CONFIG.getInterviewResults}?accessId=${accessId}&accessToken=${accessToken}&patientExternalId=${patientExternalId}&startDate=${startDate}&endDate=${endDate}`;
};