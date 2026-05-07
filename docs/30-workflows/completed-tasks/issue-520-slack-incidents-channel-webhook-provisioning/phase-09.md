# Phase 9: 品質保証 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

本タスクが導入する変更（runbook 新規 / `observability-monitoring.md` / `deployment-secrets-management.md` / `.env.example` / `smoke-observability.test.ts` redaction 追記 / 必要時の `scripts/redaction-grep.sh` / `scripts/cf.sh secret put` 拡張）が、typecheck / lint / unit test / build / redaction grep / secret name-only 確認のすべての gate に合格することを保証する。本 phase ではコードと仕様書の **静的検証および unit test** までを対象とし、実 channel 作成 / 実 webhook 発行 / 実 secret 投入 / 実 smoke 発火は行わない（Phase 11 G1〜G4 で発火）。

## 入力

- Phase 1〜8 確定 output
- Phase 7 AC マトリクス
- Phase 8 DRY 検査結果
- 実装差分（Phase 5 で確定する変更ファイル群）

## 検証観点（Q-ID）

| Q-ID | 観点 | 検証方法 |
| --- | --- | --- |
| Q-01 | 依存解決 | `mise exec -- pnpm install --force` PASS |
| Q-02 | typecheck | `mise exec -- pnpm typecheck` PASS（monorepo 全体 / または `mise exec -- pnpm --filter @ubm/api typecheck`） |
| Q-03 | lint | `mise exec -- pnpm lint` PASS |
| Q-04 | unit test | `mise exec -- pnpm --filter @ubm/api test` で `smoke-observability.test.ts` の redaction-safe 追記テストが PASS（response / error path に webhook URL fragment 不含、log mock に webhook URL 不出力） |
| Q-05 | build | `mise exec -- pnpm build`（apps/api / apps/web）PASS |
| Q-06 | redaction grep gate | repo 全域に対して webhook URL fragment / token / workspace id を 0 hit で確認。`bash scripts/redaction-grep.sh` または以下 3 pattern の `rg`:<br>・`hooks\.slack\.com/services/[A-Z0-9]`<br>・`B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}`<br>・`xox[bp]-` |
| Q-07 | Cloudflare staging secret name-only | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \| grep SLACK_WEBHOOK_INCIDENT`（Phase 11 G2 後にのみ実 PASS。phase-09 spec 段階では「コマンドが定義済み・wrangler 直接呼び出しを含まない」ことを実装ランブックと照合） |
| Q-08 | Cloudflare production secret name-only | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \| grep SLACK_WEBHOOK_INCIDENT`（同上 / Phase 11 G3 後に実 PASS） |
| Q-09 | GitHub Actions secret name-only | `gh secret list --repo daishiman/UBM-Hyogo \| grep SLACK_WEBHOOK_INCIDENT`（同上 / Phase 11 で実 PASS） |
| Q-10 | 1Password item 存在確認（value 非出力） | `op item get "SLACK_WEBHOOK_INCIDENT" --vault UBM-Hyogo-Production --fields label=url --format json \| jq 'has("value")'` の結果として **value 自体は出力せず**、`true` のみが返ることを確認（Phase 11 G2 後に実 PASS） |
| Q-11 | artifacts.json と index.md の phase 列挙整合 | `jq '.phases[].phase'` と `rg 'phase-[0-9]+' index.md` の一致 |
| Q-12 | ファイル存在 | phase-01〜13.md / outputs/phase-NN/main.md（13 件 + 13 件 + Phase 11 サブ log 2 件 + Phase 12 サブ output 6 件） |
| Q-13 | AC trace 完備 | Phase 7 matrix で AC-1〜AC-8 × evidence × test ID × gate のセル欠損なし |
| Q-14 | DRY（Phase 8）の判定が PASS / FORWARD のみ | `outputs/phase-08/main.md` 確認、FIX-NEEDED 残存なし |
| Q-15 | CI gate 影響なし | `.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` job が本タスク差分で fail しない（aiworkflow-requirements references 編集後に `pnpm indexes:rebuild` 済みの確認）|

## 5 点 PASS セット（evidence path）

PR 添付 / Phase 11 evidence の最低保証セット:

| 項目 | コマンド | evidence path |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.log` |
| lint | `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.log` |
| test | `mise exec -- pnpm --filter @ubm/api test` | `outputs/phase-11/evidence/test.log` |
| build | `mise exec -- pnpm build` | `outputs/phase-11/evidence/build.log` |
| grep-gate | `bash scripts/redaction-grep.sh`（または 3 pattern の `rg`） | `outputs/phase-11/evidence/grep-gate.log` |

> evidence log には webhook URL 実値 / token 値 / workspace id を残さない。grep-gate.log には「0 hit」の結果文字列のみ記録し、誤って hit した行をそのまま貼り付けない（hit した場合は redact 後 phase へ戻す）。

## 検証コマンド

```bash
# Q-01〜Q-05
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test
mise exec -- pnpm build

# Q-06 redaction grep（repo 全域 0 hit）
bash scripts/redaction-grep.sh \
  || rg -n 'hooks\.slack\.com/services/[A-Z0-9]|B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}|xox[bp]-' \
       --glob '!**/node_modules/**' \
       --glob '!**/.git/**'

# Q-07 / Q-08 Cloudflare secret name-only（Phase 11 G2/G3 後に実 PASS）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging   | grep SLACK_WEBHOOK_INCIDENT
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production | grep SLACK_WEBHOOK_INCIDENT

# Q-09 GitHub secret name-only
gh secret list --repo daishiman/UBM-Hyogo | grep SLACK_WEBHOOK_INCIDENT

# Q-10 1Password item 存在確認（value 自体は出力しない）
op item get "SLACK_WEBHOOK_INCIDENT" --vault UBM-Hyogo-Production --fields label=url --format json | jq 'has("value")'

# Q-11 / Q-12
jq '.phases[].phase' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/artifacts.json
ls docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-{01,02,03,04,05,06,07,08,09,10,11,12,13}.md

# Q-15 CI gate（aiworkflow-requirements 編集後）
mise exec -- pnpm indexes:rebuild
```

## 失敗時の戻り先

| Q-ID | 戻り先 | 対応 |
| --- | --- | --- |
| Q-01 | Phase 5 | 依存定義不整合の修復 |
| Q-02 / Q-03 | Phase 5 | 実装誤り修復 |
| Q-04 | Phase 4 / 5 | redaction-safe テスト追加 / 実装修正 |
| Q-05 | Phase 5 | build 失敗箇所の修復 |
| Q-06 | 該当 phase 即時 | 実値混入の即時 redact、git history 残置時は filter-repo 検討（事前に user 確認） |
| Q-07 / Q-08 / Q-09 / Q-10 | Phase 11（実発火前なら Phase 5 / runbook） | 投入手順誤り or naming 不整合 |
| Q-11 / Q-12 | Phase 0（scaffold）/ artifacts.json | ファイル補修 |
| Q-13 | Phase 7 | matrix 更新 |
| Q-14 | Phase 8 | DRY 再判定 |
| Q-15 | aiworkflow-requirements skill 編集 phase | indexes 再生成 |

## CI gate との整合

- `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）: aiworkflow-requirements の `references/observability-monitoring.md` / `deployment-secrets-management.md` を編集した場合、`pnpm indexes:rebuild` を実行して `indexes/` の drift を解消してからコミットする。本タスクの差分で同 gate を fail させない。
- 既存 lefthook の pre-commit / pre-push hook には影響しない（route 実装変更が無いため、coverage gate / test gate も既存範囲で PASS）。
- redaction grep gate は本タスクで追加 / 拡張する場合のみ Phase 5 で構築。CI 側に新規 gate を強制追加する場合は別タスクとし、本サイクルでは既存運用 + ローカル grep gate に閉じる。

## 成果物

- `outputs/phase-09/main.md`（Q-01〜Q-15 判定表 / 5 点 PASS evidence path 一覧 / CI gate 影響評価）

## 完了条件

- [ ] Q-01〜Q-06 / Q-11〜Q-15 が PASS（静的検証範囲）
- [ ] Q-07〜Q-10 は phase-09 段階では「実発火は Phase 11 で行う」旨 documented、コマンド定義 / `wrangler` 直接呼び出し不在のみ確認
- [ ] 5 点 PASS セットの evidence path（typecheck / lint / test / build / grep-gate）が確定
- [ ] CI gate（verify-indexes-up-to-date 等）への影響評価が記録
- [ ] redaction grep 0 hit
- [ ] FIX-NEEDED 残存なし

## 次 Phase への引き渡し

Phase 10 へ: 全 Q-ID 判定 / 5 点 PASS evidence path / DEFER（あれば軽微項目のみ）/ Phase 11 G1 着手準備状況。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
