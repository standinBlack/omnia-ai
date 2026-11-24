import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

export interface StorageAdapter {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

class LocalStorage implements StorageAdapter {
  private dir: string;

  constructor() {
    this.dir = process.env.LOCAL_STORAGE_DIR || "./uploads";
  }

  async put(key: string, body: Buffer) {
    const full = path.join(this.dir, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }

  async getSignedUrl(key: string) {
    // In dev, serve via API route
    return `/api/files/${encodeURIComponent(key)}`;
  }

  async exists(key: string) {
    try {
      await fs.access(path.join(this.dir, key));
      return true;
    } catch {
      return false;
    }
  }
}

class S3Storage implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET!;
    this.client = new S3Client({
      region: "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async put(key: string, body: Buffer, contentType = "application/octet-stream") {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async getSignedUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async exists(key: string) {
    try {
      await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}

export function getStorage(): StorageAdapter {
  const keys = [
    "S3_ENDPOINT",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
  ];
  const configured = keys.filter((key) => process.env[key]);
  const missing = keys.filter((key) => !process.env[key]);

  if (configured.length > 0 && missing.length > 0) {
    throw new Error(`Incomplete object storage configuration; missing: ${missing.join(", ")}`);
  }
  if (process.env.NODE_ENV === "production" && missing.length > 0) {
    throw new Error(`Object storage is required in production; missing: ${missing.join(", ")}`);
  }
  if (missing.length === 0) {
    return new S3Storage();
  }
  return new LocalStorage();
}
