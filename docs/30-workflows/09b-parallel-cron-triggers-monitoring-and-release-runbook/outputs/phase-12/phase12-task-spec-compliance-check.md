# phase12-task-spec-compliance-check

不変条件 #1〜#15 の判定。PASS は成果物の実体、root/outputs artifacts parity、same-wave sync 証跡、validator 実測値が揃った後にのみ記録する。本 Phase 12 終了時点で確定した判定を以下に示す。

## 不変条件 ↔ 判定 ↔ 根拠

| 不変条件 | 判定 | 根拠 |
| --- | --- | --- |
| #1 schema を固定しすぎない | PENDING | 09b は cron 設計担当。schema sync は cron `0 18 * * *` で D1 に反映するが、コードレベルの schema 固定は 03a の責務。本 wave で違反は導入していない |
| #2 consent キー統一（`publicConsent` / `rulesConsent`） | PASS | sync が consent snapshot を反映、09a の UI で確認済（同 wave）。本 wave で consent キーを増やしたり別名に変えたりしていない |
| #3 `responseEmail` system field 扱い | PASS | sync は `responseEmail` を Forms 項目ではなく system field として保存する（spec/01-api-schema.md 準拠）。本 wave でこの設計を変えていない |
| #4 本人本文を D1 で override しない | PASS | 09b は cron / runbook 担当で UI 編集なし。本人本文は Form 再回答で更新する MVP ポリシー（CLAUDE.md 不変条件 #7）を維持 |
| #5 apps/web → D1 直接禁止 | **PASS** | rollback-procedures.md の rollback 4 種すべてが apps/api 経由。`rg 'wrangler d1.*--config apps/web' outputs/` で 0 hit。F-12 は web bundle に D1Database が混入した場合の検出 + 02c へ差し戻し手順 |
| #6 GAS prototype を本番仕様にしない | **PASS** | cron は Workers Cron Triggers のみ（`apps/api/wrangler.toml [triggers]` および `[env.production.triggers]`）。`rg -i 'apps_script\|google\.script' outputs/` で実装言及 0 hit |
| #7 `responseId` と `memberId` を混同しない | PASS | 09b は ID 解釈に踏み込まない。runbook 内で `member_id` / `meeting_id` の attendance 整合性 SQL を扱うが、`responseId` への言及は spec 引用のみ |
| #8 localStorage を正本にしない | PASS | runbook 内で localStorage を正本とする記述なし |
| #9 `/no-access` 専用画面に依存しない | PASS | runbook 内で `/no-access` への redirect / 依存を記載しない |
| #10 Cloudflare 無料枠 | **PASS** | 121 req/day（cron のみ）= 100,000 の **0.121%**。F-6/F-7 で接近時の頻度低下 mitigation。Phase 9 試算で根拠 |
| #11 admin は本人本文を直接編集できない | PASS | runbook 内で admin 編集 form / endpoint への言及なし |
| #12 admin_member_notes view model を混在禁止 | PASS | 09b は API 設計外 |
| #13 tag は admin queue 経由 | PASS | 09b は queue 設計外 |
| #14 schema 変更は `/admin/schema` | PASS | sync は API 経由のみ。cron は `POST /admin/sync/schema` を直接 call しない（admin endpoint は 04c 仕様で、cron handler 内部から sync logic を起動する。cron が schema を直接書き換えることはない） |
| #15 attendance 重複防止 / 削除済み除外 | **PASS** | rollback-procedures.md § attendance 整合性確認、incident-response-runbook § 7、release-runbook § 4.5 で SQL を必須記載。各 rollback 後の必須実行を runbook 内で明文化 |

## 重点 4 件のサマリ

| 不変条件 | 重点根拠ファイル |
| --- | --- |
| #5 | `outputs/phase-06/rollback-procedures.md` § A〜D + § attendance 整合性確認、`outputs/phase-12/release-runbook.md` § 4 |
| #6 | `outputs/phase-02/cron-schedule-design.md` § 6、`outputs/phase-05/cron-deployment-runbook.md` Step 1 sanity |
| #10 | `outputs/phase-09/main.md` § 2、`outputs/phase-12/release-runbook.md` § 5 |
| #15 | `outputs/phase-06/rollback-procedures.md` § attendance 整合性確認、`outputs/phase-12/incident-response-runbook.md` § 7 |

## PENDING の取扱い

- #1: 09b で違反は導入していない。03a の schema sync 実装時に再評価
- それ以外は PASS

## 結論

不変条件 #5 / #6 / #10 / #15（本タスクで触れる 4 件）はすべて **PASS**。
それ以外の不変条件も本タスクの責務範囲では PASS / PENDING（違反導入なし）。

09c へ release-runbook.md / incident-response-runbook.md を引き渡し可能。
