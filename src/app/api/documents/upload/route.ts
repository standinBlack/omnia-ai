import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Placeholder for document upload. In full implementation use multipart and pdf-parse / mammoth.
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  // Stub extraction
  const text = "Extracted text placeholder. Paste text if the document is scanned or protected.";

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      originalName: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      storageKey: `docs/${user.id}/${Date.now()}-${file.name}`,
      extractedText: text,
    },
  });

  return NextResponse.json({ ok: true, documentId: doc.id, extractedText: text });
}
