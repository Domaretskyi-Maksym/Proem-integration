import fetch from "node-fetch";

interface ProemLoginBody {
  apiKey: string;
  email: string;
  password: string;
  clinicAccount: string;
}

interface ProemAuthResponse {
  accessId: string;
  refreshToken: string;
  accessToken: string;
}

let proemAuth: ProemAuthResponse | null = null;

export const getProemAuth = async (): Promise<ProemAuthResponse> => {
  if (proemAuth) return proemAuth;

  const loginUrl = "https://proemhealth.nview.tech/AppApi/3/login";
  const loginBody: ProemLoginBody = {
    apiKey: process.env.PROEM_API_KEY || "",
    email: process.env.PROEM_EMAIL || "",
    password: process.env.PROEM_PASSWORD || "",
    clinicAccount: process.env.PROEM_CLINIC_ACCOUNT || "",
  };

  console.log("Login attempt with body:", loginBody);

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Login failed response:", errorText);
    throw new Error(`Proem login failed: ${response.statusText} - ${errorText}`);
  }

  proemAuth = await response.json() as ProemAuthResponse;
  console.log("Proem authentication successful:", proemAuth);
  return proemAuth;
};