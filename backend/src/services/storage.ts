import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

class StorageService {
  private s3Client: S3Client | null = null;
  private isLocalFallback = false;
  private bucketName: string;
  private publicDomain: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'social-temp-bucket';
    this.publicDomain = process.env.R2_PUBLIC_DOMAIN || 'http://localhost:3005/public';

    // If active keys are placeholders, fall back to local disk mock
    if (
      !accountId ||
      accountId.includes('placeholder') ||
      !accessKeyId ||
      accessKeyId.includes('placeholder') ||
      !secretAccessKey ||
      secretAccessKey.includes('placeholder')
    ) {
      console.warn('⚠️ Cloudflare R2 credentials missing or placeholders. Falling back to LOCAL file storage for development!');
      this.isLocalFallback = true;
    } else {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * 1. Get pre-signed PUT URL for secure direct upload from mobile
   */
  async getPresignedPutUrl(key: string, contentType = 'image/jpeg'): Promise<string> {
    if (this.isLocalFallback) {
      // Local fallback: return a local endpoint pointing to Hono upload proxy
      return `${this.publicDomain}/local-upload-proxy?key=${encodeURIComponent(key)}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    // Valid for 10 minutes
    return await getSignedUrl(this.s3Client!, command, { expiresIn: 600 });
  }

  /**
   * 2. Get pre-signed GET URL for secure access to private assets (faces)
   */
  async getPresignedGetUrl(key: string): Promise<string> {
    if (this.isLocalFallback) {
      // Local fallback: return local absolute file URL
      return `${this.publicDomain}/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // Valid for 1 hour
    return await getSignedUrl(this.s3Client!, command, { expiresIn: 3600 });
  }

  /**
   * Batch url resolution for face profiles
   */
  async getPresignedGetUrls(keys: string[]): Promise<string[]> {
    if (this.isLocalFallback) {
      return keys.map((key) => `${this.publicDomain}/${key}`);
    }
    return Promise.all(keys.map((key) => this.getPresignedGetUrl(key)));
  }

  /**
   * 3. Upload a file buffer directly to R2 (used for generated images)
   */
  async uploadFile(key: string, buffer: Buffer, contentType = 'image/jpeg'): Promise<string> {
    if (this.isLocalFallback) {
      const localPath = path.join(process.cwd(), 'public', key);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, buffer);
      return `${this.publicDomain}/${key}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client!.send(command);
      return `${this.publicDomain}/${key}`;
    } catch (err: any) {
      console.warn(`[Storage] Cloudflare R2 upload failed (${err.message || err}). Falling back to local file storage for key: ${key}`);
      const localPath = path.join(process.cwd(), 'public', key);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, buffer);
      return `${this.publicDomain}/${key}`;
    }
  }

  /**
   * 4. Delete a file from R2 or local storage (New: for auto-expiry)
   */
  async deleteFile(key: string): Promise<void> {
    if (this.isLocalFallback) {
      const localPath = path.join(process.cwd(), 'public', key);
      try {
        await fs.unlink(localPath);
        console.log(`[Storage] Deleted local file: ${localPath}`);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.error(`[Storage] Failed to delete local file at ${localPath}:`, err);
        }
      }
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client!.send(command);
      console.log(`[Storage] Deleted R2 object: ${key}`);
    } catch (err) {
      console.error(`[Storage] Failed to delete R2 object ${key}:`, err);
    }
  }

  /**
   * Helper for the local proxy endpoint to upload physical files in dev
   */
  async saveLocalFile(key: string, buffer: Buffer): Promise<void> {
    if (!this.isLocalFallback) return;
    const localPath = path.join(process.cwd(), 'public', key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
  }
}

export const storageService = new StorageService();
export default storageService;
