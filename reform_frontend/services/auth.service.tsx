import { API_BASE } from "../constants/api";

type LoginPayload = { email: string; password: string };
type SignupPayload = { fullName: string; email: string; password: string };


async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Something went wrong";
    throw new Error(msg);
  }
  return data;
}

export async function apiLogin(payload: LoginPayload) {
  const res = await fetch(`${API_BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res); // { token, user }
}

export async function apiSignup(payload: SignupPayload) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res); // { token, user }
}
