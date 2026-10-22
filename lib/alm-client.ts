import { auth } from "./firebase";

export async function almRequest<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("سجّل دخولك بحساب الأدمن.");
  const token = await user.getIdToken();
  const response = await fetch("/api/alm/admin" + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      Authorization: "Bearer " + token,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "تعذر تنفيذ العملية.");
  return data as T;
}
