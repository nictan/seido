import { db } from './index';
import { profiles } from './schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function update() {
    const userId = 'user-123';
    const newRemark = `Verified Connection at ${new Date().toLocaleTimeString()}`;

    console.log(`Updating remarks for user ${userId} to: "${newRemark}"...`);

    await db.update(profiles)
        .set({ remarks: newRemark })
        .where(eq(profiles.userId, userId));

    console.log('Update complete!');
}

update().catch(console.error);
