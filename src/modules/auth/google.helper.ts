import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleProfileResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const buildGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const exchangeGoogleCode = async (code: string) => {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: env.google.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) throw new AppError("Failed to exchange Google authorization code", 400);
  const tokenData = (await res.json()) as GoogleTokenResponse;

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) throw new AppError("Failed to fetch Google profile", 400);
  const profile = (await profileRes.json()) as GoogleProfileResponse;

  return {
    googleId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture,
  };
};
