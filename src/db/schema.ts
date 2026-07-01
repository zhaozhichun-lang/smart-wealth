import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  // 字段 + 约束
  id: serial("id").primaryKey(), // SERIAL PRIMARY KEY
  email: varchar("email", { length: 255 }).notNull().unique(), // VARCHAR(255) NOT NULL UNIQUE
  name: varchar("name", { length: 255 }).notNull().default(""), // VARCHAR(255) NOT NULL DEFAULT ''
  password: varchar("password", { length: 255 }).notNull(), // VARCHAR(255) NOT NULL
  monthly_income: numeric("monthly_income", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"), // NUMERIC(10,2)
  initial_balance: numeric("initial_balance", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  final_balance: numeric("final_balance", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  create_at: timestamp("create_at").$defaultFn(() => new Date()), // TIMESTAMP DEFAULT NOW()
  last_reset_at: timestamp("last_reset_at").$defaultFn(() => new Date()), // 游客数据最后重置时间
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(), // SERIAL PRIMARY KEY
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id), // INTEGER NOT NULL REFERENCES users(id)
  type: varchar("type", { length: 20 }).notNull(), // VARCHAR(20) NOT NULL
  category: varchar("category", { length: 50 }).notNull(), // VARCHAR(50) NOT NULL
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // NUMERIC(10,2) NOT NULL
  date: date("date").$defaultFn(() => new Date().toISOString().split("T")[0]), // DATE DEFAULT CURRENT_DATE
  description: varchar("description", { length: 255 }), // VARCHAR(255)
  source: varchar("source", { length: 50 }), // VARCHAR(50)
  create_at: timestamp("create_at").$defaultFn(() => new Date()), // TIMESTAMP DEFAULT NOW()
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull().default(""),
  target_amount: numeric("target_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  current_amount: numeric("current_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  deadline: date("deadline"),
  create_at: timestamp("create_at").$defaultFn(() => new Date()),
});
