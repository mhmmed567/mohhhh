import QRCode from "qrcode";
import { getSiteUrl } from "@/lib/site-url";
import { almRedeemPath } from "@/lib/alm-rewards";
import { almService } from "@/lib/server/alm";
import {
  AlmError,
  almFailure,
  almJson,
  requireAlmEnabled,
} from "@/lib/server/alm-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { token: string } },
) {
  try {
    requireAlmEnabled();
    const { voucher, eligible } = await almService().voucher(params.token);
    const redeemUrl = new URL(
      almRedeemPath(params.token),
      getSiteUrl(),
    ).toString();
    const qr = await QRCode.toDataURL(redeemUrl, {
      width: 640,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#101012", light: "#ffffff" },
    });
    if (new URL(request.url).searchParams.get("download") === "1") {
      return new Response(
        new Uint8Array(Buffer.from(qr.split(",")[1], "base64")),
        {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition":
              'attachment; filename="' + voucher.code + '.png"',
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }
    // The bearer URL exposes only the gift; never expose buyer/recipient data.
    return almJson({
      code: voucher.code,
      rewardTitle: voucher.rewardTitle,
      status: voucher.status,
      eligible,
      qr,
    });
  } catch (error) {
    if (error instanceof AlmError && error.status === 404)
      return almFailure(error);
    return almJson(
      { error: "تعذر عرض الهدية حاليًا. حاول مجددًا أو تواصل مع همّار." },
      503,
    );
  }
}
