import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import type { StorageProvider, UploadResult } from "./provider";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export class BlobStorageProvider implements StorageProvider {
  async upload(file: File): Promise<UploadResult> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Unsupported file type. Please upload a JPG, PNG, WEBP, GIF or SVG image.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("File is too large. Maximum size is 8MB.");
    }

    const ext = file.type.split("/")[1].replace("svg+xml", "svg");
    const filename = `${randomUUID()}.${ext}`;
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return { url: blob.url };
  }
}
