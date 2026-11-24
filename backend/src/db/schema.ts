import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, unique, index } from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(),
  appleId: text('apple_id').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  
  // Email verification columns
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationOtp: text('email_verification_otp'),
  emailVerificationExpiry: timestamp('email_verification_expiry', { withTimezone: true }),
  
  // Password reset columns
  passwordResetOtp: text('password_reset_otp'),
  passwordResetExpiry: timestamp('password_reset_expiry', { withTimezone: true }),
  
  // User role
  role: text('role').$type<'user' | 'admin'>().default('user').notNull(),
  
  // OAuth Providers
  authProvider: text('auth_provider'),
  authProviderId: text('auth_provider_id'),
  
  // Push Notification FCM token
  fcmToken: text('fcm_token'),

  // Stripe Billing Columns
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status'),
  subscriptionTier: text('subscription_tier').$type<'free' | 'pro' | 'premium'>().default('free').notNull(),
  subscriptionPeriodEnd: timestamp('subscription_period_end', { withTimezone: true }),
  generationsUsedThisPeriod: integer('generations_used_this_period').default(0).notNull(),
  adCreditsToday: integer('ad_credits_today').default(0).notNull(),
  adCreditsLastReset: timestamp('ad_credits_last_reset', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Face Profiles Table (User-uploaded faces, cap at 5)
export const faceProfiles = pgTable('face_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(), // User custom identifier, e.g., "Myself", "Partner"
  r2Keys: jsonb('r2_keys').$type<string[]>().notNull(), // Array of S3 Keys: ["users/{userId}/faces/{id}_0.jpg", ...]
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('face_profiles_user_id_idx').on(table.userId),
}));

// 3. Template Categories Table (New: supports organizing templates)
export const templateCategories = pgTable('template_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),        // e.g., "Mirror Selfie"
  slug: text('slug').notNull().unique(),        // e.g., "mirror-selfie"
  description: text('description'),
  iconEmoji: text('icon_emoji'),                // e.g., "📸"
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Templates Table (Pre-configured Prompts for Generation)
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .references(() => templateCategories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(), // Static mockup preview URL
  description: text('description'),
  outputType: text('output_type').$type<'image' | 'video'>().default('image').notNull(),
  aspectRatio: text('aspect_ratio').default('1:1').notNull(), // "1:1", "9:16", etc.
  faceSlots: jsonb('face_slots').$type<string[]>().notNull(), // e.g. ["Person A"]
  promptTemplate: text('prompt_template').notNull(),
  negativePrompt: text('negative_prompt'),
  isPremium: boolean('is_premium').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdIdx: index('templates_category_id_idx').on(table.categoryId),
}));

// 5. Generation Tasks Table (Asynchronous AI task processing)
export const generationTasks = pgTable('generation_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  templateId: uuid('template_id')
    .references(() => templates.id, { onDelete: 'set null' }),
  status: text('status')
    .$type<'pending' | 'processing' | 'completed' | 'failed'>()
    .default('pending')
    .notNull(),
  faceMappings: jsonb('face_mappings').$type<Record<string, string>>().notNull(), // e.g., { "Person A": "face-profile-uuid" }
  customPrompt: text('custom_prompt'), // Saved user custom outfit instructions
  outputUrl: text('output_url'), // Saved public CDN image URL on success
  error: text('error'), // Saved error details on failure
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('generation_tasks_user_id_idx').on(table.userId),
  templateIdIdx: index('generation_tasks_template_id_idx').on(table.templateId),
}));

// 6. User Favorites Table (New: users can favorite templates)
export const userFavorites = pgTable('user_favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  templateId: uuid('template_id')
    .references(() => templates.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserTemplate: unique().on(table.userId, table.templateId),
  userIdIdx: index('user_favorites_user_id_idx').on(table.userId),
  templateIdIdx: index('user_favorites_template_id_idx').on(table.templateId),
}));

// ==========================================
// DRIZZLE RELATIONS (For clean, unified queries)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  faceProfiles: many(faceProfiles),
  generationTasks: many(generationTasks),
  favorites: many(userFavorites),
}));

export const faceProfilesRelations = relations(faceProfiles, ({ one }) => ({
  user: one(users, {
    fields: [faceProfiles.userId],
    references: [users.id],
  }),
}));

export const templateCategoriesRelations = relations(templateCategories, ({ many }) => ({
  templates: many(templates),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  category: one(templateCategories, {
    fields: [templates.categoryId],
    references: [templateCategories.id],
  }),
  generationTasks: many(generationTasks),
  favorites: many(userFavorites),
}));

export const generationTasksRelations = relations(generationTasks, ({ one }) => ({
  user: one(users, {
    fields: [generationTasks.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [generationTasks.templateId],
    references: [templates.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [userFavorites.templateId],
    references: [templates.id],
  }),
}));
