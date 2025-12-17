import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    image: text("image"),

    // Null for OAuth-only users
    passwordHash: text("password_hash"),

    emailVerified: boolean("email_verified").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_unique").on(t.email),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerUnique: uniqueIndex("accounts_provider_providerAccountId_unique").on(
      t.provider,
      t.providerAccountId
    ),
  })
);

// ✅ Updated enums to match requirement
export const taskStatus = pgEnum("task_status", [
  "todo",
  "in_progress",
  "review",
  "completed",
]);

export const taskPriority = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull().default(""),

  status: taskStatus("status").notNull().default("todo"),
  priority: taskPriority("priority").notNull().default("medium"),

  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),

  assigneeId: uuid("assignee_id")
    .notNull()
    .references(() => users.id),

  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});


export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    taskAssigned: boolean("task_assigned").notNull().default(true),
    taskUpdated: boolean("task_updated").notNull().default(true),
    dueSoon: boolean("due_soon").notNull().default(true),
    system: boolean("system").notNull().default(true),

    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUnique: uniqueIndex("notification_prefs_user_unique").on(t.userId),
  })
);