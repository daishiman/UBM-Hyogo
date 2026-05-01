# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke (VISUAL evidence 取得) |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |
| visualEvidence | VISUAL |

## 目的

Phase 5 runbook を実行し、10 evidence files（6 screenshots + 3 DevTools txt + 1 diff）と Phase 11 補助 metadata 4 ファイルを取得し、`manual-smoke-evidence.md` を更新する。

## 取得対象（10 evidence ファイル + 4 補助 metadata）

| # | ファイル | 環境 | 観測 | 不変条件 |
| --- | --- | --- | --- | --- |
| 1 | screenshot/M-08-profile.png | local | logged-in `/profile` 表示 | #4, #5 |
| 2 | screenshot/M-09-no-form.png | local | form 視覚的不在 | #8 |
| 3 | screenshot/M-09-no-form.devtools.txt | local | DevTools `count: 0` | #8 |
| 4 | screenshot/M-10-edit-query-ignored.png | local | `?edit=true` でも read-only | #11 |
| 5 | screenshot/M-10-edit-query-ignored.devtools.txt | local | DevTools `count: 0` | #11 |
| 6 | screenshot/M-14-staging-profile.png | staging | logged-in 表示 | #4, #5 |
| 7 | screenshot/M-15-edit-cta.png | staging | Google Form 編集導線 | #11 |
| 8 | screenshot/M-16-localstorage-ignored.png | staging | localStorage 改変無視 | #8 |
| 9 | screenshot/M-16-localstorage-ignored.devtools.txt | staging | sanitized localStorage / DOM 観測 | #8 |
| 10 | manual-smoke-evidence-update.diff | parent | 6 行 `pending`→`captured` | (process) |

## 実行手順（runbook 抜粋）

1. **Part A: local 取得**（M-08〜M-10）
   - apps/api / apps/web を起動
   - magic link mock で session 確立
   - DevTools snippet 実行 → screenshot + .devtools.txt 保存
2. **Part B: staging 取得**（M-14〜M-16）
   - staging URL で magic link 実発行 → session 確立
   - 同 snippet 実行 → 保存
3. **Part C: secret hygiene grep**
- `grep -iE '(token|cookie|authorization|bearer|set-cookie)' outputs/phase-11/evidence/screenshot/*.devtools.txt`
   - 0 hit を verify
4. **Part D: manual-smoke-evidence.md 更新**
   - 親 06b workflow の `manual-smoke-evidence.md` で M-08〜M-10、M-14〜M-16 行を `pending` → `captured` に更新
   - `git diff` を `outputs/phase-11/evidence/manual-smoke-evidence-update.diff` に保存

詳細は `outputs/phase-05/runbook.md` を参照。

## observation note（`outputs/phase-11/main.md` に記録）

各 evidence について以下を記録:
- 取得時刻（UTC）
- 環境（local / staging URL）
- 不変条件 #4/#5/#8/#11 の充足判定（PASS / FAIL / N/A）
- 取得時 anomaly があれば記述

## 異常時処理

- DevTools `count` が `> 0`: 不変条件 #8/#11 違反 → 親 06b の bug、本タスクは blocked
- staging deploy 未完了: M-14〜M-16 を skip し artifacts.json を `partial` に、09a 完了後再開
- secret hygiene fail: snippet 修正、再取得、grep 再 verify

## 完了条件

- [ ] 10 evidence ファイル取得済み
- [ ] Phase 11 補助 metadata 4 ファイル取得済み
- [ ] DevTools 3 件すべて期待値観測
- [ ] secret hygiene grep 0 hit
- [ ] `manual-smoke-evidence.md` 6 行更新済み
- [ ] observation note 記録済み

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全 evidence 配置済み
- [ ] secret hygiene PASS
- [ ] artifacts.json の phase 11 を completed（partial 時は明示）

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ: 取得結果サマリ、partial / completed の判定
