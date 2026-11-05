import { sendMembershipManagementLink } from "@/lib/membership-management";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  return sendMembershipManagementLink(request, (await params).clientId);
}
