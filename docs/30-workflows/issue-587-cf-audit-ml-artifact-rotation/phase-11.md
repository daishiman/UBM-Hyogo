# Phase 11: 実行 evidence（NON_VISUAL: typecheck / lint / canary dry-run / leakage grep result）

## 目的

実装サイクルで取得する evidence の canonical path を固定し、本サイクルでは NON_VISUAL 縮約 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）に加えて typecheck / lint / focused tests / local fixture canary / rotation evidence / leakage grep / dataset grep を取得する。スクリーンショットは作成しない（false-green 防止）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 1. NON_VISUAL 縮約 3 点

| ファイル | 役割 | 本サイクルでの実体 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | evidence index。各 evidence の path / 取得サイクル / 期待値を一覧 | 本サイクルで予約 path を記述（取得は実装サイクル） |
| `outputs/phase-11/manual-smoke-log.md` | 手動確認ログ（spec walkthrough / link 確認 / NON_VISUAL 宣言） | 本サイクルで実体配置 |
| `outputs/phase-11/link-checklist.md` | 親 #549 / SSOT / workflow 参照リンクの存在確認 | 本サイクルで実体配置 |

## 2. canonical evidence path（実装サイクルで取得）

| # | path | 取得方法 | 期待 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee` | 既存 `@sentry/*` 以外 0 件 |
| 2 | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee` | 既存 `@sentry/*` 以外 0 件 |
| 3 | `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm vitest run scripts/cf-audit-log/rotation/__tests__/` | focused test 16 件 pass |
| 4 | `outputs/phase-11/evidence/canary-dry-run.json` | staging で `gh workflow run cf-audit-log-artifact-canary.yml`（手動） | verdict / metrics 必須 field 揃い |
| 5 | `outputs/phase-11/evidence/leakage-grep.log` | canary 内部 spawn の出力 | clean (0 hits) |
| 6 | `outputs/phase-11/evidence/dataset-grep.log` | `rg -n '\.(csv\|parquet\|jsonl)$' ...` | 0 hits |
| 7 | `outputs/phase-11/evidence/build.log` | `mise exec -- pnpm build`（任意） | 既存 known-failure 以外 0 件 |

本サイクルでは `outputs/phase-11/evidence/` ディレクトリを作成しない（実装サイクルで取得 + commit）。`.gitkeep` のみ `outputs/phase-11/` 直下に置く。

## 3. NON_VISUAL 宣言（manual-smoke-log.md）

`outputs/phase-11/manual-smoke-log.md` に以下を記録する:

```
- visualEvidence: NON_VISUAL
- スクリーンショット: 作成しない（rotation scripts / runbook / SSOT 同期は UI 変更を伴わない）
- 手動確認:
  - 仕様書 13 phase の見出し構成チェック
  - link-checklist.md による親タスクリンク存在確認
  - placeholder token 0 件確認（rg で `<TBD>` / `TODO:fill` / `???` / `XXX` を検索）
  - dirty-code 0 件確認（`.tmp` / `.bak` / `~` を find）
- false-green 防止:
  - スクリーンショット用ダミー画像を生成しない
  - PR body にスクリーンショット項目を作らない
```

## 4. link-checklist.md

```
チェック項目:
  [ ] index.md → phase-{01..13}.md の相互リンク
  [ ] 各 phase 末尾の "Next Phase" リンク
  [ ] index.md → 親 #549 index.md（canonical absolute path）
  [ ] index.md → 上位親 #515 index.md
  [ ] index.md → 起票元 unassigned-task md
  [ ] index.md → SSOT 3 ファイル
  [ ] index.md → 既存 secret-leakage-grep.ts / classifier/ml.ts
  [ ] phase-12 outputs strict 7 file 配置確認
```

## 5. evidence path 予約フォーマット案（FU-04 起票）

```
phase11-evidence-canonical-paths.json:
{
  "evidence": [
    { "id": "typecheck", "path": "outputs/phase-11/evidence/typecheck.log", "expected": "0 new errors" },
    { "id": "lint", "path": "outputs/phase-11/evidence/lint.log", "expected": "0 new errors" },
    { "id": "test", "path": "outputs/phase-11/evidence/test.log", "expected": "16 tests pass" },
    { "id": "canary-dry-run", "path": "outputs/phase-11/evidence/canary-dry-run.json", "expected": "verdict in {pass}" },
    { "id": "leakage-grep", "path": "outputs/phase-11/evidence/leakage-grep.log", "expected": "0 hits" },
    { "id": "dataset-grep", "path": "outputs/phase-11/evidence/dataset-grep.log", "expected": "0 hits" }
  ]
}
```

このフォーマット自体の正本化は #549 で defer 済み（FU-04）。本タスクで再起票しない。

## 6. PASS 単独表記禁止

`outputs/phase-11/` 配下で `PASS` の単独表記を禁止する（false-green 防止）。`OK` / `PENDING_RUNTIME_GATE` / `clean` / `verdict=candidate_pass` のように context 付きで表記する。

## 7. 本サイクル実体配置物

| path | 内容 |
| --- | --- |
| `outputs/phase-11/.gitkeep` | ディレクトリ保持（evidence 取得は実装サイクル） |
| `outputs/phase-11/main.md` | evidence index（path 予約 + 取得サイクル） |
| `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL 宣言 + 手動確認結果 |
| `outputs/phase-11/link-checklist.md` | リンク存在チェックリスト |

> **Note**: 本サイクルでは `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` と local runtime evidence を実体配置する。production artifact promotion evidence は Gate-R0〜R3 + user approval まで pending とする。

## 完了条件

- [ ] NON_VISUAL 縮約 3 点の内容を確定（実体配置は実装サイクル）
- [ ] canonical evidence path 7 種を予約
- [ ] スクリーンショット作成しない方針を明記
- [ ] PASS 単独表記禁止を明記
- [ ] `outputs/phase-11/.gitkeep` を本サイクルで配置

## 参照資料

- `index.md`
- `phase-09.md` ・ `phase-10.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md`

## 統合テスト連携

- Phase 9 のテスト実行結果が `outputs/phase-11/evidence/test.log` に保存される。

## 出力

- `outputs/phase-11/.gitkeep`（本サイクル）
- `outputs/phase-11/main.md`（本サイクルで spec evidence index として配置）
- `outputs/phase-11/manual-smoke-log.md`（本サイクルで NON_VISUAL 宣言として配置）
- `outputs/phase-11/link-checklist.md`（本サイクルで link checklist として配置）

## Next Phase

- [Phase 12](phase-12.md): 実装ガイド・未タスク・skill feedback
