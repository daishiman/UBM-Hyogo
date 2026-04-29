# task-ut-06-fu-h-health-db-token-rotation-001

> Source: UT-06-FU-H D1 health endpoint Phase 12 unassigned-task-detection.md（REQUIRED formalize 候補）
> Status: unassigned / formalize 待ち / 2026-04-29 起票
> Type: governance / operations / secrets rotation SOP
> Visual: NON_VISUAL（gh / 1Password / Cloudflare Secrets 操作のみ）

## 背景

UT-06-FU-H で `GET /health/db` 用の `HEALTH_DB_TOKEN` を Cloudflare Secrets に投入する設計を確立した（`references/environment-variables.md` / `operator-runbook.md`）。
Cloudflare Secrets は rotation を CI / cron で強制できず、人間オペレーター主導の SOP を別タスクで運用しないと「90 日 rotation」「漏洩疑い時即時 rotation」のいずれも形骸化する。

## 目的

`HEALTH_DB_TOKEN` の rotation SOP を formalize し、以下を不変条件として固定する。

- 1Password 正本: `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN`
- rotation 周期: 90 日（カレンダー reminder 必須）
- 緊急 rotation: 漏洩疑い時に即時実施し、staging → production の順で投入する
- 値はログ / `.env` / ドキュメント / スクリーンショットに残さない（CLAUDE.md 「禁止事項」と同じ規律）
- rotation 後の smoke: `bash scripts/cf.sh ...` 経由で `GET /health/db` が 200 を返すことを staging / production で確認

## スコープ

- 含む:
  - rotation runbook 作成（`docs/30-workflows/<formalized-task>/outputs/phase-12/health-db-token-rotation-runbook.md`）
  - 1Password Vault エントリ整備（field 名 / 32 byte 以上の random 値 / rotation reminder）
  - Cloudflare Secrets 投入手順（staging / production 別 / `bash scripts/cf.sh` 経由）
  - rotation 後の smoke 手順 + WAF allowlist 維持確認
  - rotation 失敗時 rollback 手順（旧値の一時併存禁止 = 単一 token 運用）
- 含まない:
  - WAF allowlist の自動化（別タスク UT-22 系で扱う）
  - rate limit 閾値の確定（UT-08 monitoring 内で吸収）

## 受入条件

- AC-1: 1Password `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN` が正本として登録され、staging / production の Cloudflare Secrets が 1Password 値と一致している
- AC-2: rotation runbook が `bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env <env>` を canonical コマンドとして固定している（`wrangler` 直接実行は禁止）
- AC-3: rotation 完了後 5 分以内に staging / production で `GET /health/db` 200 を確認する手順が runbook に含まれる
- AC-4: 90 日 rotation reminder が運用カレンダーに登録されている（手段は Google Calendar / 1Password reminder のいずれでも可）
- AC-5: 漏洩疑い時 SOP が runbook に記載され、即時 rotation → smoke → 監査ログ追記の 3 ステップが書かれている
- AC-6: runbook に「token 値をログ / ドキュメントに転記しない」「`wrangler login` でローカル OAuth トークンを保持しない」を明文化（CLAUDE.md 「禁止事項」と整合）

## 上流前提

- UT-06-FU-H Phase 12 close-out 完了（本タスク起票の前提）
- UT-22（Cloudflare WAF allowlist apply）は前提にしない（rotation は WAF 設定独立で実施可能）

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/environment-variables.md` §Cloudflare Workers / Google Forms 同期
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-06-fu-h-2026-04.md` L-HDBH-004
- `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md`
- `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/unassigned-task-detection.md`
- `CLAUDE.md` シークレット管理 / Cloudflare 系 CLI 実行ルール / 禁止事項

## 備考

- formalize 時は本ファイルを `docs/30-workflows/task-ut-06-fu-h-health-db-token-rotation-001/` ディレクトリへ昇格させ、Phase 1-13 仕様書を `task-specification-creator` skill で生成する
- destructive ops（実 secret 投入 / rotation 実行）は Phase 13 ユーザー承認後の別オペレーションとする（`L-GOV-003` の二重ゲート方針を継承）
