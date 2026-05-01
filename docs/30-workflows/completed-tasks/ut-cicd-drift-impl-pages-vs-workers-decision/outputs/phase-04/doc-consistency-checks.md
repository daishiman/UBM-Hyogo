# Phase 4 成果物: ADR レビューチェックリスト（7 項目）

Phase 5 runbook 適用後の ADR 本文に対し以下 7 項目を走査する。FAIL 1 件でも残れば Phase 5 内で修正完結（Phase 6 へ降ろさない）。

## チェックリスト

| # | チェック項目 | 期待 | 検証手段（grep スニペット） |
| --- | --- | --- | --- |
| 1 | Status セクション存在 | `Accepted` 明記（Draft 残留なし） | `rg -n "^## Status" "$ADR_PATH" && rg -n "Accepted" "$ADR_PATH"` |
| 2 | Context が drift 4 ファイル参照 | wrangler.toml / web-cd.yml / deployment-cloudflare.md / CLAUDE.md の 4 ファイル全言及 | `rg -n "wrangler\.toml\|web-cd\.yml\|deployment-cloudflare\.md\|CLAUDE\.md" "$ADR_PATH"` |
| 3 | Decision に TBD 不在 | base case が実値（cutover 採択文言） | `! rg -n "TBD\|Phase 3 で確定" "$ADR_PATH"` |
| 4 | Consequences に不変条件 #5 維持 | 「`[[d1_databases]]` を apps/web に追加しない」が **必須** として明記 | `rg -n "\[\[d1_databases\]\].*apps/web.*追加しない\|d1_databases.*禁止" "$ADR_PATH"` |
| 5 | Related に関連タスク 2 件記載 | task-impl-opennext-workers-migration-001 / UT-GOV-006 | `rg -n "task-impl-opennext-workers-migration-001\|UT-GOV-006" "$ADR_PATH"` |
| 6 | `Refs #287` 形式の参照 | `Refs #287` 表記 / `Closes #287` 不在 | `rg -n "Refs #287" "$ADR_PATH" && ! rg -n "Closes #287" "$ADR_PATH"` |
| 7 | `@opennextjs/cloudflare` バージョン互換結果記載 | 現行版 `1.19.4` の記載 + 互換性所見 | `rg -n "@opennextjs/cloudflare\|1\.19\.4" "$ADR_PATH"` |

## 走査タイミング

| Phase | タイミング |
| --- | --- |
| Phase 5 | ADR 本文起票直後（自己レビュー） |
| Phase 9 | 品質保証時の再走査 |
| Phase 11 | 手動検証の代替証跡として再走査 |

## FAIL 時の処理

- 1〜2 件: Phase 5 内で修正
- 3 件以上: Phase 5 全面戻し
- 項目 4（不変条件 #5）/ 項目 6（Refs vs Closes）の FAIL は **MAJOR**（必ず修正完了まで先へ進めない）

## 完了確認

- [x] 7 項目すべて grep スニペット付き
- [x] FAIL 時の重大度区分（軽微 / MAJOR）明示
- [x] Phase 5 / 9 / 11 で再走査
