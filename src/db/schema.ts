import { pgTable, check, uuid, text, timestamp, integer, foreignKey, pgPolicy, boolean, unique, index, date, pgEnum } from "drizzle-orm/pg-core"
import { sql, relations } from "drizzle-orm"

export const applicationStatus = pgEnum("application_status", ['Submitted', 'Approved', 'Rejected', 'Withdrawn', 'Void'])
export const dojoType = pgEnum("dojo_type", ['TP', 'SIT', 'HQ'])
export const examType = pgEnum("exam_type", ['referee', 'coach'])
export const genderType = pgEnum("gender_type", ['Male', 'Female', 'Other'])
export const gradingStatus = pgEnum("grading_status", ['Pending', 'Pass', 'Fail'])
export const karateDiscipline = pgEnum("karate_discipline", ['kumite', 'kata'])
export const ruleCategory = pgEnum("rule_category", ['kumite', 'kata', 'para_karate', 'ranking', 'protocol', 'disciplinary'])

export const profiles = pgTable('profiles', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: text('user_id').notNull(), // External auth ID or internal user ID
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull().unique(),
    mobile: text('mobile'),
    dateOfBirth: date('date_of_birth'),
    gender: genderType('gender').default('Other'),
    remarks: text('remarks'),
    profilePictureUrl: text('profile_picture_url'),
    isAdmin: boolean('is_admin').default(false),
    isInstructor: boolean('is_instructor').default(false),
    isStudent: boolean('is_student').default(true),

    // Emergency Contact
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactRelationship: text('emergency_contact_relationship'),
    emergencyContactPhone: text('emergency_contact_phone'),
    emergencyContactEmail: text('emergency_contact_email'),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const karateProfiles = pgTable('karate_profiles', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    profileId: uuid('profile_id').notNull().unique(),
    dojo: dojoType('dojo').default('HQ').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    foreignKey({
        columns: [table.profileId],
        foreignColumns: [profiles.id],
        name: "karate_profiles_profile_id_fkey"
    }).onDelete("cascade"),
]);

export const rankHistories = pgTable('rank_histories', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    profileId: uuid('profile_id').notNull(),
    rankId: uuid('rank_id').notNull(),
    effectiveDate: date('effective_date').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    foreignKey({
        columns: [table.profileId],
        foreignColumns: [profiles.id],
        name: "rank_histories_profile_id_fkey"
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.rankId],
        foreignColumns: [ranks.id],
        name: "rank_histories_rank_id_fkey"
    }).onDelete("cascade"),
    index("idx_rank_histories_profile_id").on(table.profileId),
]);

export const gradingApplications = pgTable('grading_applications', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    gradingPeriodId: uuid('grading_period_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    currentRankId: uuid('current_rank_id').notNull(),
    proposedRankId: uuid('proposed_rank_id').notNull(),
    status: applicationStatus('status').default('Submitted').notNull(),
    gradingStatus: gradingStatus('grading_status').default('Pending').notNull(),
    gradingNotes: text('grading_notes'),
    instructorNotes: text('instructor_notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    foreignKey({
        columns: [table.gradingPeriodId],
        foreignColumns: [gradingPeriods.id],
        name: "grading_applications_period_id_fkey"
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.profileId],
        foreignColumns: [profiles.id],
        name: "grading_applications_profile_id_fkey"
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.currentRankId],
        foreignColumns: [ranks.id],
        name: "grading_applications_current_rank_id_fkey"
    }),
    foreignKey({
        columns: [table.proposedRankId],
        foreignColumns: [ranks.id],
        name: "grading_applications_proposed_rank_id_fkey"
    }),
]);

export const profilesRelations = relations(profiles, ({ one, many }) => ({
    karateProfile: one(karateProfiles, {
        fields: [profiles.id],
        references: [karateProfiles.profileId],
    }),
    rankHistories: many(rankHistories),
    gradingApplications: many(gradingApplications),
}));

export const karateProfilesRelations = relations(karateProfiles, ({ one }) => ({
    profile: one(profiles, {
        fields: [karateProfiles.profileId],
        references: [profiles.id],
    }),
}));

export const rankHistoriesRelations = relations(rankHistories, ({ one }) => ({
    profile: one(profiles, {
        fields: [rankHistories.profileId],
        references: [profiles.id],
    }),
    rank: one(ranks, {
        fields: [rankHistories.rankId],
        references: [ranks.id],
    }),
}));

export const gradingApplicationsRelations = relations(gradingApplications, ({ one }) => ({
    profile: one(profiles, {
        fields: [gradingApplications.profileId],
        references: [profiles.id],
    }),
    gradingPeriod: one(gradingPeriods, {
        fields: [gradingApplications.gradingPeriodId],
        references: [gradingPeriods.id],
    }),
    currentRank: one(ranks, {
        fields: [gradingApplications.currentRankId],
        references: [ranks.id],
        relationName: "currentRank"
    }),
    proposedRank: one(ranks, {
        fields: [gradingApplications.proposedRankId],
        references: [ranks.id],
        relationName: "proposedRank"
    }),
}));

export const gradingPeriods = pgTable("grading_periods", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    gradingDate: timestamp("grading_date", { withTimezone: true, mode: 'string' }).notNull(),
    location: text(),
    status: text().default('Upcoming').notNull(),
    maxApplications: integer("max_applications").default(20),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (_table) => [
    check("grading_periods_status_check", sql`status = ANY (ARRAY['Upcoming'::text, 'In Progress'::text, 'Completed'::text, 'Cancelled'::text])`),
]);

export const gradingPeriodsRelations = relations(gradingPeriods, ({ many }) => ({
    applications: many(gradingApplications),
    allowedRanks: many(gradingPeriodRanks),
}));

export const gradingConfigurations = pgTable("grading_configurations", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    rankId: uuid("rank_id").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    foreignKey({
        columns: [table.rankId],
        foreignColumns: [ranks.id],
        name: "grading_configurations_rank_id_fkey"
    }).onDelete("cascade"),
    pgPolicy("Everyone can view grading configurations", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const ranks = pgTable("ranks", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    rankOrder: integer("rank_order").notNull(),
    kyu: integer(),
    dan: integer(),
    beltColor: text("belt_color").notNull(),
    stripes: integer().default(0),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    isDefaultRank: boolean("is_default_rank").default(false),
}, (table) => [
    unique("ranks_rank_order_key").on(table.rankOrder),
    pgPolicy("Everyone can view ranks", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
    check("valid_rank_type", sql`((kyu IS NOT NULL) AND (dan IS NULL)) OR ((kyu IS NULL) AND (dan IS NOT NULL))`),
]);

export const refereeQuestionBanks = pgTable("referee_question_banks", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    examType: examType("exam_type").notNull(),
    discipline: karateDiscipline().notNull(),
    version: text(),
    description: text(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (_table) => [
    pgPolicy("Anyone can view active question banks", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
]);

export const refereeQuestions = pgTable("referee_questions", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    questionBankId: uuid("question_bank_id").notNull(),
    questionNumber: integer("question_number").notNull(),
    questionText: text("question_text").notNull(),
    correctAnswer: boolean("correct_answer").notNull(),
    explanation: text(),
    ruleReference: text("rule_reference"),
    category: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    index("idx_referee_questions_bank_id").using("btree", table.questionBankId.asc().nullsLast().op("uuid_ops")),
    foreignKey({
        columns: [table.questionBankId],
        foreignColumns: [refereeQuestionBanks.id],
        name: "referee_questions_question_bank_id_fkey"
    }).onDelete("cascade"),
    unique("referee_questions_question_bank_id_question_number_key").on(table.questionBankId, table.questionNumber),
    pgPolicy("Anyone can view questions", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const refereeRuleDocuments = pgTable("referee_rule_documents", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    category: ruleCategory().notNull(),
    description: text(),
    fileUrl: text("file_url"),
    version: text(),
    effectiveDate: date("effective_date"),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (_table) => [
    pgPolicy("Anyone can view rule documents", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const gradingPeriodRanks = pgTable("grading_period_ranks", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    gradingPeriodId: uuid("grading_period_id").notNull(),
    rankId: uuid("rank_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    foreignKey({
        columns: [table.gradingPeriodId],
        foreignColumns: [gradingPeriods.id],
        name: "grading_period_ranks_period_id_fkey"
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.rankId],
        foreignColumns: [ranks.id],
        name: "grading_period_ranks_rank_id_fkey"
    }).onDelete("cascade"),
    unique("grading_period_ranks_period_rank_key").on(table.gradingPeriodId, table.rankId),
]);

export const gradingPeriodRanksRelations = relations(gradingPeriodRanks, ({ one }) => ({
    gradingPeriod: one(gradingPeriods, {
        fields: [gradingPeriodRanks.gradingPeriodId],
        references: [gradingPeriods.id],
    }),
    rank: one(ranks, {
        fields: [gradingPeriodRanks.rankId],
        references: [ranks.id],
    }),
}));
