import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Stripe is not connected yet. This placeholder will verify webhook signatures and activate memberships later.",
      ok: true,
    },
    { status: 501 },
  );
}
