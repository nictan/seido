import { db } from './api/_db.js';
import { ranks } from './src/db/schema.js';

async function main() {
    const ranksData = [
        { id: 'f255b2d1-2fde-454d-b1ac-10456ffe0385', rankOrder: 1, kyu: 9, dan: null, beltColor: 'White', stripes: 0, displayName: '9th Kyu - White Belt', isDefaultRank: true },
        { id: 'b0da0ad5-7985-439b-9cc1-637d3a09be9a', rankOrder: 2, kyu: 8, dan: null, beltColor: 'Orange', stripes: 3, displayName: '8th Kyu - Orange Belt (3 Stripes)', isDefaultRank: false },
        { id: 'dc5b8ce5-1e27-4f42-9884-7630ff7f2169', rankOrder: 3, kyu: 7, dan: null, beltColor: 'Orange', stripes: 2, displayName: '7th Kyu - Orange Belt (2 Stripes)', isDefaultRank: false },
        { id: 'a7c48fc0-fc62-40d7-8fdb-d971839e3bb8', rankOrder: 4, kyu: 6, dan: null, beltColor: 'Orange', stripes: 1, displayName: '6th Kyu - Orange Belt (1 Stripe)', isDefaultRank: false },
        { id: '14cc95ea-021d-403a-aa0b-f767c3cbc59e', rankOrder: 5, kyu: 5, dan: null, beltColor: 'Orange', stripes: 0, displayName: '5th Kyu - Orange Belt', isDefaultRank: false },
        { id: '7820b6c5-d9da-4816-beff-981f0f5304ce', rankOrder: 6, kyu: 4, dan: null, beltColor: 'Brown', stripes: 3, displayName: '4th Kyu - Brown Belt (3 Stripes)', isDefaultRank: false },
        { id: 'd5dfee07-5163-4374-8301-5d20906b42f9', rankOrder: 7, kyu: 3, dan: null, beltColor: 'Brown', stripes: 2, displayName: '3rd Kyu - Brown Belt (2 Stripes)', isDefaultRank: false },
        { id: 'f329037d-4b32-4e87-b65b-b3561387445e', rankOrder: 8, kyu: 2, dan: null, beltColor: 'Brown', stripes: 1, displayName: '2nd Kyu - Brown Belt (1 Stripe)', isDefaultRank: false },
        { id: 'b8db0bcc-b96d-4aab-a898-db5be1f24d4c', rankOrder: 9, kyu: 1, dan: null, beltColor: 'Brown', stripes: 0, displayName: '1st Kyu - Brown Belt', isDefaultRank: false },
        { id: 'a4137c5e-f08e-47e2-bd38-1312d963c302', rankOrder: 10, kyu: null, dan: 1, beltColor: 'Black', stripes: 3, displayName: '1st Dan - Black Belt (Shodan)', isDefaultRank: false },
        { id: '90d5c8b4-df9e-4e61-ae79-12283dac577e', rankOrder: 11, kyu: null, dan: 2, beltColor: 'Black', stripes: 0, displayName: '2nd Dan - Black Belt (Nidan)', isDefaultRank: false },
        { id: '734f8d20-b35a-403e-9d76-db424ed2e683', rankOrder: 12, kyu: null, dan: 3, beltColor: 'Black', stripes: 0, displayName: '3rd Dan - Black Belt (Sandan)', isDefaultRank: false },
        { id: 'e76d3d75-c766-41b4-9f92-678746ca38bb', rankOrder: 13, kyu: null, dan: 4, beltColor: 'Black', stripes: 0, displayName: '4th Dan - Black Belt (Yondan)', isDefaultRank: false },
        { id: '3f39de71-2013-4e9b-9ab6-e2923f96417b', rankOrder: 14, kyu: null, dan: 5, beltColor: 'Black', stripes: 0, displayName: '5th Dan - Black Belt (Godan)', isDefaultRank: false },
        { id: 'd79f03e2-414a-45df-868f-f59e9d519126', rankOrder: 15, kyu: null, dan: 6, beltColor: 'Black', stripes: 0, displayName: '6th Dan - Black Belt (Rokudan)', isDefaultRank: false },
    ];
    
    await db.insert(ranks).values(ranksData).onConflictDoNothing();
    console.log(`Seeded ${ranksData.length} ranks to production database!`);
    
    // Verify
    const all = await db.select().from(ranks);
    console.log(`Production DB now has ${all.length} ranks. Default rank:`, all.find(r => r.isDefaultRank)?.displayName);
    
    process.exit(0);
}
main();
