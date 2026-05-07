-- 0016_cf_audit_log_classification.sql
-- Issue #515: classifier metadata for Cloudflare Audit Logs.
-- Forward-safe rollback is the default: keep columns and set CF_AUDIT_CLASSIFIER=threshold.

ALTER TABLE cf_audit_log
  ADD COLUMN classifier_used TEXT NOT NULL DEFAULT 'threshold';

ALTER TABLE cf_audit_log
  ADD COLUMN classifier_version TEXT NOT NULL DEFAULT 'threshold@1.0.0';

ALTER TABLE cf_audit_log
  ADD COLUMN confidence REAL;

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_classifier
  ON cf_audit_log(classifier_used, classifier_version);

-- Destructive rollback note, user-gated only:
-- DROP INDEX IF EXISTS idx_cf_audit_log_classifier;
-- ALTER TABLE cf_audit_log DROP COLUMN confidence;
-- ALTER TABLE cf_audit_log DROP COLUMN classifier_version;
-- ALTER TABLE cf_audit_log DROP COLUMN classifier_used;

