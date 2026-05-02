# Phase 11: 手動 smoke evidence（NON_VISUAL — runbook dry-run / staging 模擬実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 11 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（production migration apply runbook の文書整備） |
| 非視覚的理由 | UI / UX 変更を含まず、本タスクは runbook（テキスト手順書）の文書品質保証のみを行う。production D1 への apply は本タスクでは実行しない |
| 代替証跡 | runbook 本体（`outputs/phase-05/main.md`）に対する `rg` / `grep` 構造検証ログ + staging dry-run（`migrations list` の構文検証）+ redaction grep |
| Screenshot | UI/UX 変更なしのため Phase 11 スクリーンショット不要 |

## 実行タスク

1. 本 Phase の入力（Phase 5 runbook 本体・Phase 6 異常系・Phase 7 AC マトリクス・index.md）を確認する。
2. runbook 章立て構造の grep 検証を実施し `outputs/phase-11/structure-verification.md` に記録する。
3. 対象オブジェクト（migration ファイル名・table 名・index 名・追加カラム名・承認語）が runbook 内で網羅されているかの grep 検証を実施し `outputs/phase-11/grep-verification.md` に記録する。
4. staging 環境で `migrations list` の **構文検証**（dry-run 相当 / 実 apply は行わない）を実施し `outputs/phase-11/staging-dry-run.md` に記録する。
5. evidence 全体に対する redaction grep を実施し、Token 値・Account ID 値・production の実 apply 値が混入していないことを確認する。
6. `outputs/phase-11/main.md` でサマリと完了条件の充足を宣言する。

## 目的

Phase 5 で作成した production migration apply runbook が、AC-1〜AC-10 を網羅し、運用者が **誤適用なく** 実行できる文書品質に達していることを、実 production への apply を伴わずに検証する。

本 Phase の evidence は「runbook が文書として正しく組まれているか」「staging 上で `migrations list` の構文が通るか」「production の Token 値・Account ID 値・apply 結果値が成果物に混入していないか」の 3 観点に閉じる。production への実 apply 結果は本タスクでは記録しない（別タスクで運用実行する）。

## 参照資料

- `index.md`
- `artifacts.json`
- Phase 5 成果物（`outputs/phase-05/main.md` — runbook 本体）
- Phase 6 成果物（`outputs/phase-06/main.md` — 異常系）
- Phase 7 成果物（`outputs/phase-07/main.md` — AC マトリクス）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/wrangler.toml`
- `scripts/cf.sh`
- 上流参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`

## 入力

- Phase 5 runbook 本体（5 章: preflight / apply / post-check / evidence / failure handling）
- Phase 6 異常系定義（二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗 / evidence redaction）
- staging environment の `CLOUDFLARE_API_TOKEN`（読み取り系のみ使用）
- 対象 migration ファイル `apps/api/migrations/0008_schema_alias_hardening.sql`

## 実施手順

### A. runbook 章立て構造検証（文書 dry-run）

Phase 5 runbook 本体に preflight / apply / post-check / evidence / failure handling の 5 章が揃っていることを grep で確認する。

```bash
# TC-A01: 5 章の章立てキーワードを抽出（5 件以上 hit すること）
rg "preflight|migrations list|migrations apply|post-check|証跡|失敗" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md

# TC-A02: 「ユーザー承認」「production」境界文の有無
rg "ユーザー承認|production apply|本タスク内では実行しない" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md

# TC-A03: post-check は read / dryRun 系に限定されていること（destructive smoke 不在）
rg -n "DROP|DELETE|TRUNCATE" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md \
  || echo "PASS: no destructive smoke in post-check"
```

### B. 対象オブジェクト網羅検証（grep verification）

`apps/api/migrations/0008_schema_alias_hardening.sql` で導入される全オブジェクトと運用境界語が runbook 本体で言及されていることを確認する。

```bash
# TC-B01: 対象オブジェクト 6 種 + 運用境界語が全て runbook 内に存在すること
rg "0008_schema_alias_hardening|schema_aliases|idx_schema_aliases_revision_stablekey_unique|idx_schema_aliases_revision_question_unique|backfill_cursor|backfill_status|ユーザー承認|production" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md

# TC-B02: 対象 DB 名が固定されていること（ubm-hyogo-db-prod）
rg "ubm-hyogo-db-prod" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md

# TC-B03: cf.sh ラッパ経由のみで wrangler 直叩きが無いこと
rg -n "^\s*wrangler\b" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md \
  || echo "PASS: no direct wrangler invocation"
```

### C. staging dry-run（model verification — 実 apply ではない）

staging 環境で `migrations list` のみを実行し、`scripts/cf.sh` 経由で `--env staging` の構文が通ることを確認する。**`migrations apply` は実行しない**。production への接続は本 Phase で行わない。

```bash
# TC-C01: staging migrations list の構文検証（read 系・apply ではない）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# TC-C02: staging で 0008_schema_alias_hardening が list に含まれるか確認（適用状態は問わない）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | grep -E "0008_(schema_alias_hardening|create_schema_aliases)" || echo "list を runbook の preflight 期待に照らして判定"
```

> **注意**: 本 Phase では production 環境（`--env production`）に対する `migrations list` も実行しない。production 接続は別タスクの運用実行時にのみ実施する。staging dry-run は runbook の構文・文言が現実の wrangler CLI 出力と整合するかの **モデル検証** として位置付ける。

### D. evidence redaction 検証

```bash
# TC-D01: Token 値混入 0 件（40 文字級英数字 / Token / Account ID パターン）
rg -i "cloudflare_api_token=|account_id=[a-f0-9]{20,}" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-11/ \
  || echo "PASS: no token/account-id leakage"

# TC-D02: Bearer Token / OAuth トークン文字列の不在
rg -nE '\b[A-Za-z0-9_-]{40,}\b' \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-11/ \
  | grep -vE '(commit|sha|hash|run-id|migration)' \
  || echo "PASS: no suspicious long token-like strings"

# TC-D03: production の実 apply 結果値（行数・hash・適用時刻）が含まれないこと
rg -i "Applied [0-9]+ migration|production apply result" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-11/ \
  || echo "PASS: no production apply results recorded"
```

## 証跡フォーマット

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言・実施情報（日時 / 実施者 / 対象 runbook ファイル）・A〜D 各検証の判定サマリ・既知制限・関連リンク |
| `outputs/phase-11/structure-verification.md` | TC-A01〜A03 の grep 実コマンドと出力、5 章揃いの判定 |
| `outputs/phase-11/grep-verification.md` | TC-B01〜B03 の grep 実コマンドと出力、対象オブジェクト 6 種 + 運用境界語の網羅判定 |
| `outputs/phase-11/staging-dry-run.md` | TC-C01〜C02 の `bash scripts/cf.sh` 実コマンドと exit code（`migrations apply` を含めないことの宣言を冒頭に明記） |
| `outputs/phase-11/redaction-check.md` | TC-D01〜D03 の grep verification 結果と「Token 値 0 件・Account ID 値 0 件・production apply 結果値 0 件」の宣言 |
| その他 | 作成しない（NON_VISUAL のため screenshot 系ファイルは生成禁止） |

## production 値・Token 値・Account ID 値を残さないルール

- production D1 への接続を伴うコマンドは本 Phase では実行しない（`--env production` の `migrations list` も含めない）
- staging で実行する `migrations list` は read 系のみ。`migrations apply` / `execute --command` は実行禁止
- Token 値（40 文字級英数字）を成果物・コミットメッセージ・PR 本文に転記しない
- Account ID は Variable 化済みのため `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` 表記のみ使用し、実値を記録しない
- ログを貼る際に Token / Account ID が出力に含まれていた場合は `***REDACTED***` でマスクする
- `set -x` / `wrangler --debug` は使用禁止（スタックトレースに認証情報が混入するリスクのため）
- production の実 apply 結果（適用行数・hash・適用時刻）は本 Phase では一切記録しない

## 4 条件評価

| 条件 | 内容 | 判定方法 |
| --- | --- | --- |
| 矛盾なし | runbook 章立て / 対象オブジェクト / 運用境界語が一貫している | A・B 検証で 5 章 + 6 オブジェクト + 境界語の全 hit を確認 |
| 漏れなし | AC-1〜AC-10 が runbook 本体で言及されている | Phase 7 AC マトリクスと grep 結果の cross check |
| 整合性あり | staging dry-run 出力と runbook 文言が一致する | C-01 の出力ヘッダ / カラム名と runbook の期待出力例の一致確認 |
| 依存関係整合 | 上流 UT-07B の migration ファイルと runbook 内 SQL 名が一致する | B-01 で `0008_schema_alias_hardening` が hit していること |

## 完了条件

- [ ] A 検証（章立て 5 章揃い）が PASS で記録されている
- [ ] B 検証（対象オブジェクト 6 種 + 運用境界語の網羅）が PASS で記録されている
- [ ] C 検証（staging `migrations list` の dry-run）が exit=0 で記録されている
- [ ] D 検証（redaction grep）で Token 値 0 件 / Account ID 値 0 件 / production apply 結果値 0 件が宣言されている
- [ ] NON_VISUAL 宣言が `main.md` 冒頭に明記されている
- [ ] production への接続を伴うコマンドが evidence に含まれていない
- [ ] 4 条件評価が全 PASS で記録されている

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/structure-verification.md`
- `outputs/phase-11/grep-verification.md`
- `outputs/phase-11/staging-dry-run.md`
- `outputs/phase-11/redaction-check.md`

## 統合テスト連携

NON_VISUAL / approval-gated runbook のため、Phase 11 では UI screenshot や production integration test を実行しない。`structure-verification.md`、`grep-verification.md`、`staging-dry-run.md`、`redaction-check.md` を代替 evidence とし、実 apply は FU-04 へ委譲する。

## 関連リンク

- `index.md`
- Phase 5 成果物（runbook 本体）
- Phase 6 成果物（異常系・redaction 規約）
- Phase 7 成果物（AC マトリクス）
- `scripts/cf.sh`
- 上流: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`
- 並列依存: `U-FIX-CF-ACCT-01`（Token スコープ最小化）

## 苦戦想定

- staging で `migrations list` を打つだけのつもりが、CLI 補完で誤って `migrations apply` を実行してしまう事故が最大リスク。本 Phase では `apply` 系コマンドを evidence に書かないことをチェックリストで明示する。
- `--env production` を打鍵した時点で production に接続が走るため、本 Phase では production 環境への接続コマンドを **一切記述しない / 実行しない**。
- staging に `0008_schema_alias_hardening` が既適用 / 未適用のどちらでも runbook 検証は成立する（dry-run は構文検証のみで、適用状態に依存しない）。staging の状態を runbook の前提に紛れ込ませない。
- `set -x` / `wrangler --debug` をつい有効化したくなるが、Token がスタックトレースに混入するリスクがあるため Phase 11 では使用禁止。
- production の実 apply 結果（適用行数 / hash / 時刻）を「参考値」として書きたくなるが、本タスクでは production を触らないため evidence に含めない。
