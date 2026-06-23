import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { importContactsFromCsv } from "@/lib/contact-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getImportUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/import", request.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

function getErrorResponse(request: Request, message: string) {
  return NextResponse.redirect(getImportUrl(request, { error: message }), 303);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("csv_file");
    const optInMode = String(formData.get("opt_in_mode") ?? "all_no");

    if (!file || typeof file !== "object" || !("text" in file) || !("size" in file)) {
      return getErrorResponse(request, "Choose a CSV file before importing.");
    }

    if (!file.size) {
      return getErrorResponse(request, "Choose a CSV file before importing.");
    }

    const csvText = await file.text();
    const importedCount = await importContactsFromCsv(csvText, optInMode);

    revalidatePath("/admin");
    revalidatePath("/admin/import");

    return NextResponse.redirect(
      getImportUrl(request, { imported: String(importedCount) }),
      303,
    );
  } catch (error) {
    return getErrorResponse(
      request,
      error instanceof Error ? error.message : "Unable to import contacts.",
    );
  }
}
