-- 0023_member_photos_source.sql
-- issue-1031: member self-upload を区別する source 列を additive 追加。
-- 既存行（admin upload）は DEFAULT 'admin' で backfill される（非破壊）。
-- invariant #4: member_photos は admin-managed data。Google Form schema 表には触れない。
-- 値域は 'admin' | 'self'（CHECK 制約は付けず application 層 zod / 型で担保）。
ALTER TABLE member_photos ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';
