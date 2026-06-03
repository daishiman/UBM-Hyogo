# Phase 11: 手動 smoke test（CLI 回帰検証）

## NON_VISUAL 宣言

- **visualEvidence: NON_VISUAL**（index.md / artifacts.json と一致）。
- **タスク種別**: CLI / CI tooling（read-only 解析スクリプト + 回帰 spec + CI gate）。UI / 画面・導線の変更を一切含まない。
- **非視覚的理由**: 本タスクの成果物は `scripts/verify-wrangler-binding-drift.mjs`（CLI gate）/ 回帰 spec / GitHub Actions workflow であり、レンダリングされる画面が存在しない。したがって screenshot による視覚回帰は **取得不可（該当なし）**。
- **代替証跡**: (a) CLI exit code（`pnpm verify:wrangler-binding-drift` の 0/1）、(b) vitest 回帰 spec の PASS/FAIL（TC-01〜TC-10）、(c) read-only grep gate（書き込み / ネットワーク / サブプロセス語 0 件）。これらを Phase 11 の検証証跡とする。
- **実地操作（screenshot）不可の明記**: 画面が無いため `outputs/phase-11/screenshots/` は作成しない。NON_VISUAL 補助成果物として `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 件を正本とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（CLI 回帰検証・NON_VISUAL） |
| 作成日 | 2026-06-02 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

実装サイクルで gate スクリプト・回帰 spec・CI workflow を実装した後に行う CLI スモーク（手動回帰検証）の手順と期待結果を確定する。本タスクは NON_VISUAL（CLI tooling）であり、視覚証跡の代わりに CLI exit code と vitest 結果を証跡とする。本 Phase は spec_created のため、スモークの**実行は実装サイクル**で行う前提で手順を正本化する。

## CLI スモーク計画

| # | 手順 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| S-1 | 是正前 gate（現存ドリフト検出） | （棚卸し表に MEMBER_PHOTOS 行が無い状態で）`mise exec -- pnpm verify:wrangler-binding-drift` | exit 1。stderr に `[verify-wrangler-binding-drift]` 接頭辞付きで `INVENTORY_MISSING` / `MEMBER_PHOTOS` を含む decisive メッセージ 1 件 |
| S-2 | 是正後 gate（現行 repo green） | （AC-10 で棚卸し表へ MEMBER_PHOTOS 行追加後）`mise exec -- pnpm verify:wrangler-binding-drift` | exit 0。drift 0 件 |
| S-3 | 回帰 spec | `mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | TC-01〜TC-10 全 PASS（リポジトリルートから実行） |
| S-4 | read-only 確認 | `grep -nE "writeFileSync\|writeFile\|fetch\(\|child_process\|execSync\|spawn" scripts/verify-wrangler-binding-drift.mjs` | ヒット 0 件（AC-7） |
| S-5 | 型 / lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | error 0 |

## 代替証跡方針

- S-1 / S-2 の exit code（1 → 0）が「gate がドリフトを検出し、是正で解消する」ことの一次証跡である。
- S-3 の vitest 結果（TC-01〜TC-10 PASS）が回帰 guard の証跡である。
- S-4 の grep 0 件が read-only（AC-7）の証跡である。
- 上記を `outputs/phase-11/manual-smoke-log.md` に「実装サイクルで実行・記録する」テンプレとして残す。spec_created 時点では expected のみを記載し、実測値は実装サイクルで追記する。

## 実行タスク

1. NON_VISUAL 宣言（CLI tooling / 画面なし / 代替証跡）を本 Phase 冒頭に固定する。完了条件: NON_VISUAL 宣言節が存在し screenshot 不可が明記されている。
2. CLI スモーク手順 S-1〜S-5 を確定する。完了条件: 是正前 exit 1 / 是正後 exit 0 / vitest / read-only grep / 型 lint の 5 手順が期待結果付きで存在する。
3. 代替証跡方針（exit code + vitest + grep）を確定する。完了条件: 視覚証跡の代替として exit code と vitest が一次証跡である旨が記述されている。
4. `outputs/phase-11/main.md` に概要・NON_VISUAL 宣言・スモーク計画・代替証跡方針を記載する。完了条件: main.md が配置済み。
5. `outputs/phase-11/manual-smoke-log.md` に S-1〜S-5 の expected を記載し「実行は実装サイクル」と明記する。完了条件: manual-smoke-log.md が配置済み。
6. `outputs/phase-11/link-checklist.md` に本ワークフロー内ドキュメントリンク整合チェックリストを記載する。完了条件: link-checklist.md が配置済み。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-09.md | QG-3（vitest）/ QG-4（read-only grep）/ QG-5（gate 自走 exit 0/1） |
| 必須 | phase-10.md | GO 判定 / exit code 契約 |
| 必須 | index.md | AC-10（棚卸し表追記で gate green）/ binding 棚卸し |
| 必須 | CLAUDE.md | mise exec 経由実行 / vitest をリポジトリルートから実行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 概要 / NON_VISUAL 宣言 / CLI スモーク計画 / 代替証跡方針 |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | CLI スモーク S-1〜S-5 の expected テンプレ（実行は実装サイクル） |
| ドキュメント | outputs/phase-11/link-checklist.md | ワークフロー内ドキュメントリンク整合チェックリスト |
| メタ | artifacts.json | Phase 11 状態（spec_created） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | QG-3 / QG-4 / QG-5 を CLI スモーク S-1〜S-5 の期待値に取り込む |
| Phase 10 | GO 判定の exit code 契約（0/1）を S-1 / S-2 の合否基準に取り込む |
| Phase 12 | スモーク結果（実装サイクル実測）をドキュメント更新の根拠に渡す |

## 完了条件

- [ ] NON_VISUAL 宣言（CLI tooling / 画面なし / 代替証跡）が冒頭に固定されている
- [ ] CLI スモーク S-1（是正前 exit 1）/ S-2（是正後 exit 0）が期待結果付きで存在する
- [ ] CLI スモーク S-3（vitest TC-01〜TC-10 PASS）が存在する
- [ ] CLI スモーク S-4（read-only grep 0 件）/ S-5（型 lint error 0）が存在する
- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 補助成果物が配置されている
- [ ] screenshot 不可（画面なし）と代替証跡（exit code + vitest）が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created` で記述されている
- 補助成果物 3 件（main.md / manual-smoke-log.md / link-checklist.md）が `outputs/phase-11/` 配下に配置済み
- screenshots ディレクトリは作成しない（NON_VISUAL）
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - CLI スモーク S-1〜S-5 の expected（実装サイクルで実測追記）
  - NON_VISUAL の代替証跡方針（exit code + vitest + read-only grep）
  - MINOR R-1（全 binding inventory 化）を Phase 12 same-cycle improvement で解決へ
- ブロック条件:
  - 実装サイクルで S-2（是正後 exit 0）が満たせない（棚卸し表追記漏れ）
  - S-4（read-only grep）でヒットが出る
