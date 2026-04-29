# Phase 11 Main: 実機反映後 manual smoke 結果サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-claude-code-permissions-apply-001 |
| Phase | 11 / 13（手動テスト） |
| 実施日時 (${TS}) | 2026-04-28T20:05:24+09:00 |
| 実機反映 TS（Phase 5 sticky） | `20260428-192736` |
| `claude --version` | `2.1.62 (Claude Code)` |
| 実施ホスト | macOS Darwin 25.3.0 / zsh |
| 主証跡カテゴリ | NON_VISUAL（UI 表示変更ゼロ） |
| screenshot | 取得しない（`outputs/phase-11/screenshots/` 不在） |
| 上流 | Phase 10 Go 判定（PASS、TC-05 BLOCKED 注記付き） |
| 下流 | Phase 12（着手 Go） |

## NON_VISUAL 宣言（再掲）

| 項目 | 値 |
| --- | --- |
| 検証対象 | `permissions.defaultMode` 文字列、`cc` alias 展開、`permissions.allow/deny` の grep 件数 |
| 主証跡 | `outputs/phase-11/manual-smoke-log.md` |
| 補助証跡 | `outputs/phase-11/link-checklist.md` / Phase 5 runbook-execution-log / Phase 6 fail-path-tests |
| Visual / AI UX 評価 | **N/A**（UI 変更ゼロ） |
| placeholder PNG | 不使用 |

## TC 判定一覧（Phase 5/6 で実機検証済 + Phase 11 で再観測）

| TC | 名称 | 判定 | 引用元 / 再観測 |
| --- | --- | --- | --- |
| TC-01 | `cc` 起動直後のモード表示 | **PASS** | Phase 5 Step 5 + Phase 11 再観測（`zsh -i -c 'type cc'`） |
| TC-02 | reload / session 切替後のモード維持 | **PASS** | Phase 5 Step 5（global settings no-op、value sticky） |
| TC-03 | 別プロジェクト起動での階層適用 | **PASS** | Phase 5 Step 3（project nested `defaultMode=bypassPermissions` 確認） |
| TC-04 | whitelist 効果（pnpm 系で prompt なし） | **PASS** | Phase 5 Step 3 + Step 5（§4 allow 7/7 / deny 4/4 包含） |
| TC-05 | bypass 下の `permissions.deny` 実効性 | **BLOCKED** | 前提タスク `task-claude-code-permissions-deny-bypass-verification-001` 未完（FORCED-GO 制約） |
| TC-F-01 | `defaultMode` typo 注入 | **PASS** | Phase 6 fail-path-tests（dry path で typo 値読み出し確認） |
| TC-F-02 | `cc` alias 重複定義注入 | **PASS** | Phase 6 fail-path-tests（注入→2 件→rollback→1 件） |
| TC-R-01 | alias 重複検出 guard | **PASS** | Phase 6 guard `[PASS] alias cc 定義は 1 件です（backup 除外）` |

集計: PASS 7 / BLOCKED 1 (TC-05) / FAIL 0 / NOT EXECUTED 0。

## 3 層評価

| 層 | 結果 | 根拠 |
| --- | --- | --- |
| Semantic | **PASS** | `defaultMode=bypassPermissions` が global / project の両層で一致、`cc` alias が `CC_ALIAS_EXPECTED` と完全一致 |
| Visual | **N/A** | UI 変更ゼロ（host 環境設定のみ） |
| AI UX | **N/A** | 同上 |

## 不変条件チェック

- [x] `outputs/phase-11/screenshots/` 物理非存在（`test ! -e` 確認）
- [x] secrets / token / `.env` 実値の混入 0 件（`grep -rE` で確認）
- [x] `wrangler` 直接実行記述ゼロ
- [x] backup 4 件の存在を `backup-manifest.md` で再確認
- [x] TC ごとに「実行コマンド / 期待 / 実観測 / 判定」を `manual-smoke-log.md` に記録

## Phase 12 着手判定

**Go**。TC-05 BLOCKED は前提タスクスキップに伴う既知事象で Phase 10 Go 判定（FORCED-GO）に織り込み済。Phase 12 は `docs-ready-execution-blocked` 経路ではなく **`completed`（TC-05 BLOCKED 注記）** として進行する。

## ループバック判定

該当なし（FAIL 0 件）。
