import "dotenv/config";
import { db } from "./index";
import { karateProfiles, rankHistories } from "./schema";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("Starting migration v2...");

    try {
        // 1. Fetch all raw profile data (including old columns)
        const allProfiles = await db.execute(sql`SELECT * FROM profiles`);
        const rows = allProfiles.rows as any[];

        console.log(`Found ${rows.length} profiles to migrate.`);

        for (const row of rows) {
            console.log(`Processing profile: ${row.id} (${row.first_name} ${row.last_name})`);

            // 2. Insert into karate_profiles
            // Note: DB columns are snack_case,Row keys from execute are snake_case
            await db.insert(karateProfiles).values({
                profileId: row.id,
                dojo: row.dojo || 'HQ',
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }).onConflictDoNothing();

            // 3. Insert into rank_histories if rank info exists
            const rankId = row.current_rank_id;
            const effectiveDate = row.rank_effective_date;

            if (rankId) {
                await db.insert(rankHistories).values({
                    profileId: row.id,
                    rankId: rankId,
                    effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
                    isCurrent: true,
                    createdAt: row.created_at
                }).onConflictDoNothing();
            } else {
                // Assign default rank (10th Kyu) if missing
                const defaultRankId = "f255b2d1-2fde-454d-b1ac-10456ffe0385";
                await db.insert(rankHistories).values({
                    profileId: row.id,
                    rankId: defaultRankId,
                    effectiveDate: row.created_at ? row.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
                    isCurrent: true,
                    createdAt: row.created_at
                }).onConflictDoNothing();
            }
        }

        console.log("Migration v2 completed successfully.");
    } catch (error) {
        console.error("Migration v2 failed:", error);
        process.exit(1);
    }
}

migrate();
