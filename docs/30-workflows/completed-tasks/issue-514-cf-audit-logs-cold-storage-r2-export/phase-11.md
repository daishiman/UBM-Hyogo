# Phase 11: 手動テスト / runtime evidence (NON_VISUAL)

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 親タスク | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/index.md` |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 適用テンプレ | NON_VISUAL 縮約テンプレ（[phase-template-phase11.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md) §「docs-only / NON_VISUAL 縮約テンプレ」） |
| 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（spec contract 完了 / runtime evidence は G1-G4 ゲート後に取得） |

## 目的

Issue #514 の cold storage / R2 export 仕様書 contract を Phase 1-10 完了で固定したのち、production R2 への初回 export / restore drill / redaction grep を runtime evidence として取得する。本 phase では **screenshot を生成しない**（NON_VISUAL）。代わりに CLI 出力ログを唯一の evidence とする。

> 本タスクの runtime evidence（R2 binding 登録 / Secret 登録 / 日次 workflow 成立）は **`runtime_evidence_pending`** で close-out する。実 mutation は Phase 13 G1-G4 ゲート（[phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md) §G1-G4）の user 明示承認後にのみ実行する。

## 発火条件 / 機械判定

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/artifacts.json
# => NON_VISUAL を確認したうえで本テンプレを適用
```

## 必須 outputs（NON_VISUAL 縮約 3 点 + runtime evidence pending 一覧）

| # | ファイル | 役割 | 最小フォーマット |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / CLI walkthrough）/ 状態語彙 / 必須 outputs / runtime pending 内訳 |
| 2 | `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / fixture export dry-run の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| 3 | `outputs/phase-11/link-checklist.md` | 仕様書 / SSOT / scripts / workflow 間の参照リンク有効性 | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |
| 4 | `outputs/phase-11/runtime-evidence-pending.md` | production R2 mutation 系 evidence の pending 列挙 + 取得ゲート | 後述「runtime evidence pending 内訳」テーブル |
| 5 | `outputs/phase-11/redaction-grep.log` | export 段階の redaction 二重化 grep の dry-run 実行ログ | fixture JSONL に対する grep 結果（ヒット 0 件であること） |
| 6 | `outputs/phase-11/restore-drill-dryrun.log` | restore-drill の fixture mode 実行ログ（R2 GetObject なしで row count / hash 照合まで通す） | row count / hash 照合結果 |

VISUAL タスク向けの `manual-test-checklist.md` / `manual-test-result.md` / `discovered-issues.md` / `screenshot-plan.json` / `phase11-capture-metadata.json` は **生成しない**（NON_VISUAL のため false green 防止）。

## runtime evidence pending 内訳（`runtime-evidence-pending.md` 必須テーブル）

| # | 操作 | 取得ゲート | 取得先 evidence path | 取得後の状態語彙昇格先 |
| --- | --- | --- | --- | --- |
| RP-1 | production R2 binding `UBM_AUDIT_COLD_STORAGE` 登録（`bash scripts/cf.sh ...` 経由 wrangler 配備 + `apps/api/wrangler.toml` の production env block） | Phase 13 G1（runtime deploy approval） | `outputs/phase-11/r2-binding-applied-production.log`（後追い追加） | `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` |
| RP-2 | export Token `CF_AUDIT_R2_TOKEN_PROD` の 1Password 登録 + GitHub Secrets 配備（key 名のみ確認、値は read 禁止） | Phase 13 G1 | `outputs/phase-11/r2-token-secret-list.log`（key 名のみ） | 同上 |
| RP-3 | D1 migration `0015_add_audit_export_manifest.sql` の production apply | Phase 13 G2（production migration apply approval） | `outputs/phase-11/d1-applied-fresh-production.log` | 同上 |
| RP-4 | 初回日次 export 実行（GitHub Actions `cf-audit-log-cold-storage.yml` の workflow_dispatch trigger） | Phase 13 G3-prod（export execution approval） | `outputs/phase-11/g3-export-first-run.log`（manifest row / R2 object key / row count / hash / r2_etag） | 同上 |
| RP-5 | 初回 restore drill（半期 trigger 模擬: 任意 1 object を一時テーブルへ復元 → row count / hash 照合） | Phase 13 G2 後段 | `outputs/phase-11/restore-drill-first-run.log` | `PASS_RUNTIME_SYNCED` |
| RP-6 | secret hygiene grep（`outputs/phase-11/*.log` 全体に対する `rg -n 'Bearer |password|secret|api[_-]?key'` 等） | Phase 13 G4 直前 | `outputs/phase-11/secret-hygiene-grep.log`（ヒット 0 件） | 同上 |

> 取得後は同 phase の `main.md` に追記し、状態語彙を上記昇格先へ書き換える。**`PASS` 単独表記は禁止**（boundary suffix 必須）。

## 検証コマンド（fixture / dry-run のみ。production mutation は禁止）

| # | コマンド | 期待結果 |
| --- | --- | --- |
| C-1 | `mise exec -- pnpm typecheck` | exit 0 |
| C-2 | `mise exec -- pnpm lint` | exit 0 |
| C-3 | `mise exec -- pnpm --filter @repo/api test:run -- scripts/cf-audit-log/export-to-r2.test.ts` | focused test PASS |
| C-4 | `mise exec -- pnpm --filter @repo/api test:run -- scripts/cf-audit-log/restore-drill.test.ts` | focused test PASS |
| C-5 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | `0015_add_audit_export_manifest.sql` が pending として表示（apply は Phase 13 G2） |
| C-6 | `rg -n 'Bearer \|password\|secret\|api[_-]?key' outputs/phase-11/` | match 0 件 |
| C-7 | fixture JSONL に対する redaction grep dry-run（`scripts/cf-audit-log/export-to-r2.ts --dry-run --fixture <path>`） | redaction policy 違反ヒット 0 件 |
| C-8 | restore-drill fixture mode（`scripts/cf-audit-log/restore-drill.ts --fixture <path>`） | row count / hash 一致 |

## 入力 / 出力 / 副作用

| 区分 | 内容 |
| --- | --- |
| 入力 | Phase 1-10 で確定した spec / 実装差分 / fixture JSONL（repo 内サンプル） |
| 出力 | 上記 6 必須 outputs（NON_VISUAL）+ focused test ログ |
| 副作用 | **production R2 / D1 / Secrets には触れない**（mutation 一切なし）。fixture 配下のみ書き込み許可 |

## DoD（完了条件）

- [ ] `outputs/phase-11/main.md` に状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と判定根拠が記録されている
- [ ] `manual-smoke-log.md` に C-1〜C-8 の実行結果が PASS / FAIL で記録されている
- [ ] `link-checklist.md` に仕様書 → SSOT / scripts / workflow / migration の参照リンクが OK で揃っている
- [ ] `runtime-evidence-pending.md` の RP-1〜RP-6 が表として揃い、各取得ゲート（G1 / G2 / G3-prod / G4）が明示されている
- [ ] `redaction-grep.log` に fixture に対する grep 結果（ヒット 0 件）が記録されている
- [ ] `restore-drill-dryrun.log` に fixture mode の row count / hash 一致が記録されている
- [ ] secret hygiene grep（C-6）がヒット 0 件で PASS
- [ ] `PASS` 単独表記が `outputs/phase-11/` 配下のどのファイルにも存在しない
- [ ] runtime evidence の取得は本 phase の責務外であることが `main.md` 冒頭に宣言されている

## 関連参照

- [phase-template-phase11.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md) §「NON_VISUAL 縮約テンプレ」「`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態語彙」「OIDC / deploy auth migration NON_VISUAL evidence matrix」
- [phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md) §G1-G4
- [index.md](./index.md) — 30 日境界契約 / R2 binding 名 / redaction policy
- [phase-01.md](./phase-01.md) — 要件定義
- [phase-03.md](./phase-03.md) — exporter / restore drill 構成
