import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider, UploadResult } from "./provider";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export class LocalStorageProvider implements StorageProvider {
  async upload(file: File): Promise<UploadResult> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Unsupported file type. Please upload a JPG, PNG, WEBP, GIF or SVG image.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("File is too large. Maximum size is 8MB.");
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.type.split("/")[1].replace("svg+xml", "svg");
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return { url: `/uploads/${filename}` };
  }
}

export function getStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}
