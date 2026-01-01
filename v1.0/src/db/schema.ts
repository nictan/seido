import { pgTable, check, uuid, text, timestamp, integer, foreignKey, pgPolicy, boolean, unique, index, date, pgEnum, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const applicationStatus = pgEnum("application_status", ['Submitted', 'Approved', 'Rejected'])
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
    dojo: dojoType('dojo').default('HQ'),
    remarks: text('remarks'),
    profilePictureUrl: text('profile_picture_url'),

    isStudent: boolean('is_student').default(true),
    isInstructor: boolean('is_instructor').default(false),
    isAdmin: boolean('is_admin').default(false),

    // Emergency Contact
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactRelationship: text('emergency_contact_relationship'),
    emergencyContactPhone: text('emergency_contact_phone'),
    emergencyContactEmail: text('emergency_contact_email'),

    // Rank/Grade
    currentRankId: uuid('current_rank_id'),
    rankEffectiveDate: date('rank_effective_date'),
    currentGrade: jsonb('current_grade'),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    foreignKey({
        columns: [table.currentRankId],
        foreignColumns: [ranks.id],
        name: "profiles_current_rank_id_fkey"
    }).onDelete("set null"),
]);


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
