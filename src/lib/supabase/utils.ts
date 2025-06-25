import { supabase } from "./supabase";
import { randomUUID } from "crypto";

export async function uploadPdfToSupabase(buffer: Buffer, interviewResultId: number) {
  const fileName = `interview_${interviewResultId}_${randomUUID()}.pdf`;
  const { error } = await supabase.storage
    .from("interviews")
    .upload(fileName, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error("Failed to upload PDF: " + error.message);

  const { data } = supabase.storage.from("interviews").getPublicUrl(fileName);
  return data.publicUrl;
}