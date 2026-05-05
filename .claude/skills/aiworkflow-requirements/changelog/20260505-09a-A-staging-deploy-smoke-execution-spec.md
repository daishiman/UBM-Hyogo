# 2026-05-05 09a-A Staging Deploy Smoke Execution Spec

## Summary

`docs/30-workflows/09a-A-staging-deploy-smoke-execution/` を `spec_contract_completed / implementation-spec / VISUAL_ON_EXECUTION / runtime evidence pending_user_approval` として正本同期。staging Pages/Workers deploy smoke、Google Forms schema/responses sync、staging D1 migration apply、`/public/members` curl smoke、admin UI gate、wrangler tail redacted log、D1 schema parity 検証（staging vs production）の Phase 1-13 仕様書を新規策定。

Phase 1-10 + 12 の spec contract を完了し、Phase 11 runtime evidence は G1-G4 multi-stage approval gate（runtime deploy / Forms sync / D1 apply / commit-push-PR）を user 承認後にのみ取得する。spec close-out 判定は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`、Phase 13 commit / push / PR は user-gated。

旧 `docs/30-workflows/02-application-implementation/09a-A-staging-deploy-smoke-execution/` path drift を補正し、`legacy-ordinal-family-register.md` Task Root Path Drift Register に登録。09c production deploy execution へ blocker を保持し、09a-A Phase 11 PASS まで 09c は着手不可。

Close-out 判定: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。Phase 13 commit / push / PR は user-gated。

## Updated Canonical References

- `SKILL.md` §changelog: 先頭行へ `v2026.05.05-09a-a-staging-smoke-execution-root-sync` を追加。
- `indexes/quick-reference.md` §09a-A Staging Deploy Smoke Execution: 目的別最初ファイル / G1-G4 approval gates / Phase 11 evidence root を新規セクション化。
- `indexes/resource-map.md` §current canonical set: 09a-A 行を追加（workflow root / Phase 12 implementation-guide / specs/00-overview.md / specs/08-free-database.md / Forms responder URL / staging wrangler.toml）。
- `indexes/topic-map.md` §artifact-inventory: 09a-A artifact inventory の section 目次を追加。
- `indexes/keywords.json`: 09a-A staging deploy smoke / Forms sync / D1 schema parity / G1-G4 approval gate / wrangler tail / `PRAGMA table_info` 等 12 件のキーワードを追加。
- `references/task-workflow-active.md`: 09a-A row を追加（spec_contract_completed / Phase 12 strict 7 files / Phase 11 runtime pending / Phase 13 pending_user_approval / Blocks 09c）。
- `references/legacy-ordinal-family-register.md` §Task Root Path Drift Register: 09a-A の path drift 行を追加（旧 `02-application-implementation/` → 新 canonical root）。
- `references/workflow-task-09a-A-staging-deploy-smoke-execution-artifact-inventory.md`: 新規作成 + Same-Wave Sync テーブルを `topic-map / keywords / SKILL.md / legacy register / lessons-learned / changelog / LOGS` まで拡充。
- `lessons-learned/2026-05-05-09a-A-staging-deploy-smoke-execution-spec.md`: 新規追加。教訓 L-09AA-001〜005（spec contract complete と runtime PASS の分離 / G1-G4 approval gate / D1 schema parity / parent directory restoration / 09c blocker propagation）。
- `templates/staging-deploy-smoke-evidence-template.md`: 新規追加。staging deploy smoke / visual smoke / Forms sync / wrangler tail / D1 schema parity の evidence 取得手順テンプレ。

## Spec Sync（正本 2 ファイルへ link）

- `docs/00-getting-started-manual/specs/00-overview.md`: 3 層構成（公開 / マイページ / 管理）と staging/production 環境境界を 09a-A Phase 11 evidence 取得時に再確認する正本。
- `docs/00-getting-started-manual/specs/08-free-database.md`: D1 free tier 構成 / migration 適用順序 / staging vs production schema parity 比較の正本。

## Approval Gates（Phase 11 / Phase 13）

- **G1 staging runtime deploy gate**: Pages/Workers `pnpm deploy:staging` 系の実行承認（staging 環境のみ、`bash scripts/cf.sh deploy --config apps/{web,api}/wrangler.toml --env staging` 経由）。
- **G2 Forms sync gate**: Google Forms schema/responses sync 実行承認（admin-managed data の 1 回限り反映）。
- **G3 D1 apply gate**: staging D1 への `migrations apply` 実行承認（pending → applied 確定 + parity 検証）。
- **G4 commit/push/PR gate**: Phase 13 git mutation 承認（remote push / PR open / squash merge プロモーション）。

## Evidence Boundary

- Current evidence: spec contract 13 phase 仕様書 / artifacts.json root + outputs parity / Phase 12 strict 7 files / artifact inventory / lessons / changelog / LOGS。
- Pending evidence (`outputs/phase-11/evidence/` reserved): staging Pages/Workers deploy log、`staging-deploy-<service>-<timestamp>.log`、`/public/members` curl smoke、admin UI 403 視認、Playwright screenshot（公開 / ログイン / profile / admin）、wrangler tail redacted log、Forms schema/responses sync log、D1 schema parity diff（staging vs production）、`PRAGMA table_info` snapshot、`d1_migrations` applied / pending 数値。

## Skill Feedback Surfaced

- `task-specification-creator`: Phase 11 evidence boundary を「current evidence」「pending evidence」「approval gate に紐づく artifact」の 3 軸で書き分ける Phase 12 雛形を提案。multi-stage approval gate（G1-G4）の標準化を提案候補として promote。
- `aiworkflow-requirements`: spec_contract_completed / runtime_evidence_pending_user_approval の workflow_state 二段階を artifacts.json schema として正規化する提案。

## artifacts.json parity

- root `docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json`: 正本。
- `outputs/artifacts.json`: root と同期済み。
- `metadata.workflow_state = spec_contract_completed`、`visualEvidence = VISUAL_ON_EXECUTION`、Phase 1-10 / 12 = `completed`、Phase 11 = `pending_user_approval`、Phase 13 = `pending_user_approval`。

## docs/30-workflows/LOGS.md

- Wave 行を追加（2026-05-05 / spec_contract_completed / 09a-A staging deploy smoke execution spec synced / Blocks 09c）。
