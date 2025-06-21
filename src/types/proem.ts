export interface ProemCallbackBody {
  interviewResultId: number;
  bhId?: string;
}

export interface SuccessResponse {
  success: true;
  interviewResultId: number;
  pdfUrl?: string;
}

export interface ErrorResponse {
  error: string;
}