import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const decoded = decodeURIComponent(key);
  const full = path.join(process.env.LOCAL_STORAGE_DIR || "./uploads", decoded);

  try {
    const buf = await fs.readFile(full);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${path.basename(decoded)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
