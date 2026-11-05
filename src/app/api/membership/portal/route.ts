import { sendMembershipManagementLink } from "@/lib/membership-management";
import { getCurrentClientId } from "@/lib/client-context";
export const runtime = "nodejs";
export async function POST(request: Request) { return sendMembershipManagementLink(request, getCurrentClientId()); }
