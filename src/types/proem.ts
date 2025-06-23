export interface ProemCallbackBody {
  interviewResultId: number;
  bhtId: number;
}

export interface SuccessResponse {
  success: true;
  interviewResultId: number;
  pdfUrl?: string;
}

export interface ErrorResponse {
  error: string;
}