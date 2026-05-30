import { AuthError } from "./auth";

export type UserProfile = {
  userId: number;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: string;
};

const BASE = "/api/users";

async function get<T>(path: string, accessToken: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new AuthError(
      "Cannot reach the server. Please make sure the user service is running.",
      0,
      "NETWORK_ERROR"
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (json && (json.message as string)) ||
      "Unable to load user profile. Please try again.";
    throw new AuthError(message, res.status, json?.code);
  }

  return (json?.data ?? json) as T;
}

export const userApi = {
  getProfile: (userId: number, accessToken: string) =>
    get<UserProfile>(`/${userId}`, accessToken),
};
