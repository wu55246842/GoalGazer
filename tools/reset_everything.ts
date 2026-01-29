import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import sql from "../apps/web/lib/db";

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_ENDPOINT = process.env.S3_ENDPOINT;

const s3Client = new S3Client({
    region: "auto",
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID || "",
        secretAccessKey: S3_SECRET_ACCESS_KEY || "",
    },
});

async function resetEverything() {
    console.log("🔥 RESETTING EVERYTHING 🔥");

    try {
        // 1. Delete all R2 objects
        console.log(`\n☁️  Clearing R2 Bucket: ${S3_BUCKET_NAME}...`);
        const listCommand = new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME });
        const listResponse = await s3Client.send(listCommand);

        if (listResponse.Contents && listResponse.Contents.length > 0) {
            const deleteParams = {
                Bucket: S3_BUCKET_NAME,
                Delete: {
                    Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
                },
            };
            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            await s3Client.send(deleteCommand);
            console.log(`   ✅ Deleted ${listResponse.Contents.length} objects from R2.`);
        } else {
            console.log("   ℹ️  R2 Bucket is already empty.");
        }

        // 2. Clear Database Tables
        console.log("\n🗄️  Clearing Database Tables: match_content, matches...");

        // Use DELETE instead of TRUNCATE as it usually requires fewer permissions
        await sql`DELETE FROM match_content`;
        await sql`DELETE FROM matches`;

        console.log("   ✅ Database tables cleared.");

        console.log("\n✨ RESET COMPLETE. Ready for fresh data.");

    } catch (error) {
        console.error("❌ Reset failed:", error);
        process.exit(1);
    }
    process.exit(0);
}

resetEverything();
