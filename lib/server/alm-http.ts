import "server-only";
import { NextResponse } from "next/server";
import { almEnabled, serverAuth } from "./firebase-admin";

export class AlmError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function almJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export function requireAlmEnabled() {
  if (!almEnabled())
    throw new AlmError(
      503,
      "خدمة هدايا ALM لم تُفعّل بعد. أكمل ربط الخدمة من إعدادات الاستضافة.",
    );
}

export async function requireAlmAdmin(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ") || authorization.length > 10000) {
    throw new AlmError(401, "سجّل دخولك بحساب الأدمن.");
  }
  let token;
  try {
    token = await serverAuth().verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new AlmError(
      401,
      "انتهت الجلسة أو تعذر التحقق منها. سجّل الدخول مجددًا.",
    );
  }
  if (token.role !== "admin")
    throw new AlmError(403, "هذه العملية متاحة للأدمن فقط.");
  return token;
}

export async function almBody(
  request: Request,
): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") || 0) > 8192)
    throw new AlmError(413, "حجم الطلب أكبر من المسموح.");
  const text = await request.text();
  if (text.length > 8192) throw new AlmError(413, "حجم الطلب أكبر من المسموح.");
  try {
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== "object")
      throw new Error();
    return body;
  } catch {
    throw new AlmError(400, "بيانات الطلب غير صحيحة.");
  }
}

export function almFailure(error: unknown) {
  if (error instanceof AlmError)
    return almJson({ error: error.message }, error.status);
  // Do not return service account details, tokens, or raw Firestore errors.
  return almJson(
    {
      error:
        "تعذر الاتصال بخدمة هدايا ALM. تحقق من ربط الخدمة ثم أعد المحاولة.",
    },
    503,
  );
}
