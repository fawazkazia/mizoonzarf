import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
import { BlobStorageProvider } from "./blob";

export function getStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new BlobStorageProvider();
  }
  return new LocalStorageProvider();
}
