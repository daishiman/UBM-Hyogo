-- Status: PENDING_USER_APPROVAL
-- Use only after explicit G2/G3-prod rollback decision.
-- This migration creates only cf_audit_log_export_manifest; existing cf_audit_log rows are untouched.

DROP TABLE IF EXISTS cf_audit_log_export_manifest;
