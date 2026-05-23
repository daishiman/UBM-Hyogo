# SA Service Account JSON Key Rotation SOP

## 1. Purpose

This SOP rotates the Cloudflare Workers Secret `GOOGLE_SERVICE_ACCOUNT_JSON`
without writing the service account JSON value to docs, logs, shell history, or
PR text. The value source remains 1Password; the repo records only `op://`
references and a 16 character fingerprint.

## 2. Scope

Included: new key creation for the existing service account, 1Password reference
update, staging-first secret replacement, production replacement after staging
verification, a 24-48 hour grace period, disable-before-delete handling, and a
completion record. Excluded: creating or deleting the service account itself,
changing app code, automatic GitHub Actions rotation, and implementing the UT-26
Sheets API smoke route.

## 3. Preconditions

- `bash scripts/cf.sh whoami` succeeds through the approved wrapper.
- `GOOGLE_SERVICE_ACCOUNT_JSON` is the only new Cloudflare Secret name.
- The target Sheets spreadsheet is already shared with the service account.
- The operator has the UT-25 rollback runbook available:
  `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`.

## 4. Frequency

Rotate every 90 days. This interval follows this repository's existing secret
rotation baseline and the local task contract's NIST / Google IAM rationale:
short enough to limit blast radius, long enough to avoid high-frequency manual
mutation mistakes. Emergency rotation overrides the 90 day cadence when a key is
suspected to be exposed.

## 5. Rotation Procedure

1. Open a shell with history disabled:

   ```bash
   export HISTFILE=/dev/null
   set +o history
   ```

2. Create a new JSON key for the existing Google service account. Download it to
   a local temporary file outside the repository, with permissions restricted to
   the operator:

   ```bash
   umask 077
   gcloud iam service-accounts keys create /tmp/ubm-sa-rotation.json \
     --iam-account "<service-account>@<project>.iam.gserviceaccount.com"
   ```

   Do not create a new service account. This step only adds a key to the
   service account already used by `GOOGLE_SERVICE_ACCOUNT_JSON`.

3. Store the new JSON in the existing 1Password item and record only its
   `op://Vault/Item/Field` reference in the completion record. Do not write the
   JSON value or any field value into markdown, issues, PRs, or logs.

4. Confirm the 1Password value parses without printing the value:

   ```bash
   op read "op://Vault/Item/Field" | jq -e 'has("private_key")'
   ```

5. Compute and record the new fingerprint:

   ```bash
   op read "op://Vault/Item/Field" | bash scripts/cf-rotate-sa-key.sh fingerprint
   ```

6. Put staging first:

   ```bash
   op read "op://Vault/Item/Field" \
     | bash scripts/cf-rotate-sa-key.sh put-staging \
         --op-ref "op://Vault/Item/Field" \
         --fingerprint "<16-hex-fingerprint>" \
         --env staging
   ```

7. Verify staging name presence, observe the 60 second tail window, then run the
   UT-26 staging smoke and save redacted evidence:

   ```bash
   bash scripts/cf-rotate-sa-key.sh verify --env staging
   bash scripts/cf-rotate-sa-key.sh tail --env staging --seconds 60

   curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
     "https://<staging-api-host>/admin/smoke/sheets" \
     | tee /tmp/ut-26-staging-smoke-redacted.json
   ```

   PASS means HTTP 200 and the UT-26 smoke response reports `ok=true` with no
   Sheets auth error. If this fails, stop before production and use the rollback
   runbook.

8. Put production only after staging `verify`, `tail`, and UT-26 smoke all pass:

   ```bash
   op read "op://Vault/Item/Field" \
     | bash scripts/cf-rotate-sa-key.sh put-production \
         --op-ref "op://Vault/Item/Field" \
         --fingerprint "<16-hex-fingerprint>" \
         --env production
   ```

9. Verify production name presence, observe the 60 second tail window, then run
   the UT-26 production smoke and save redacted evidence:

   ```bash
   # Temporary, user-gated production smoke enablement:
   # set SMOKE_SHEETS_ALLOW_PRODUCTION=true in production variables before this
   # smoke, then remove or set it back to false immediately after the PASS.
   bash scripts/cf-rotate-sa-key.sh verify --env production
   bash scripts/cf-rotate-sa-key.sh tail --env production --seconds 60

   curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
     "https://<production-api-host>/admin/smoke/sheets" \
     | tee /tmp/ut-26-production-smoke-redacted.json
   ```

10. Keep the old key usable for 24-48 hours. If no failures appear, disable the
   old key in Google Cloud IAM and record the disable time.

11. Keep the disabled old key for 7 days. Delete it only after the record shows
   staging and production verification, disable time, and the 7 day wait.

## 6. No-Downtime Checks

`wrangler tail` is observed through `scripts/cf.sh` for 60 seconds per
environment because in-flight Workers requests may still hold old credentials
briefly. UT-26 owns the actual Sheets API smoke implementation; this SOP
requires the operator to execute that smoke, store redacted evidence outside the
tracked task spec, and treat HTTP 200 + `event="sheets_smoke_test"` as the PASS
boundary before moving from staging to production and before disabling the old
key. Production smoke is 404 by default and only becomes available while
`SMOKE_SHEETS_ALLOW_PRODUCTION=true` is explicitly set for this user-gated
rotation verification window.

MINOR-01: the 60 second window is a conservative local default. Revisit it after
two successful rotations or 90 days of operational evidence.

## 7. Rollback

If staging or production verification fails, stop the rotation and follow the
UT-25 rollback runbook. Reinsert the previous 1Password version through
`bash scripts/cf.sh secret put` via stdin only. Do not paste JSON values into a
terminal, issue, PR, or markdown file.

## 8. Secret Hygiene

- Never write JSON values, `private_key`, OAuth tokens, token previews, or value
  hashes into tracked files.
- Use `op://` references and 16 character fingerprints only.
- Keep `HISTFILE=/dev/null` and `set +o history` for the whole operation.
- If using tmux, run `clear-history` in the pane after the operation. If using
  screen, clear scrollback before leaving the session.
- Do not run `wrangler` directly; use `bash scripts/cf.sh` or the rotation
  helper.

## 9. Completion Record

Copy `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` to a dated
file outside this task branch's specification if the operator wants a persistent
rotation ledger. The copied record must contain the old and new fingerprints,
staging and production verification times, disable time, and delete time.

## 10. Downstream Handoff

Send the new fingerprint to
`docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md`
after production verification. The monitoring task tracks expiry and fingerprint
drift; this SOP only creates the operator workflow.

## 11. Troubleshooting

- `verify --env staging` returns exit 5: wait 30 seconds and list again. If the
  name is still absent, stop before production and use the rollback runbook.
- UT-26 returns 401 / 403: suspect malformed JSON or a disabled key. Re-read the
  1Password item with `jq -e 'has("private_key")'` and rollback if needed.
- `put-production` refuses to run: staging verification state is missing. Run
  `verify --env staging` after a real staging put; dry-run intentionally does
  not unlock production.
