import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-97ef9c6706fb4d328dd4f5c8ab4f8f1b.r2.dev";

if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET_NAME || !S3_ENDPOINT) {
    // We don't throw immediately to allow component discovery, 
    // but we will fail on upload.
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID || "",
        secretAccessKey: S3_SECRET_ACCESS_KEY || "",
    },
});

/**
 * Upload a buffer to Cloudflare R2
 * @param key The path in the bucket (e.g. "matches/123.png")
 * @param body The file content as a Buffer
 * @param contentType The MIME type (e.g. "image/png")
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET_NAME || !S3_ENDPOINT) {
        throw new Error("❌ R2 Credentials missing in environment.");
    }

    try {
        console.log(`   ⬆️  Uploading ${key} to R2 (${body.length} bytes)...`);
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        });

        await s3Client.send(command);

        const publicUrl = `${R2_PUBLIC_URL}/${key}`;
        console.log(`   ✅ Upload successful: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("❌ R2 Upload failed:", error);
        throw error;
    }
}
