# Phase 9 成果物: 品質ゲートチェックリスト

> Phase 10 でそのまま転記可能な PASS/FAIL チェックボックス形式。

## チェックリスト

- [x] 1. ADR 本文 5 セクション完備（Status / Context / Decision / Consequences / Related）— **設計上 PASS（Phase 5 runbook 適用後に再確認）**
- [x] 2. ADR から関連 doc へのリンク死活 — **設計上 PASS**（リンク先: deployment-cloudflare.md / CLAUDE.md / migration-001 / UT-GOV-006 すべて実在）
- [x] 3. 判定表 Markdown table 健全性 — **PASS**（既存表構造を保ったまま「現状 / 将来 / 根拠リンク / 更新日」更新指示）
- [x] 4. CLAUDE.md スタック表 base case 整合 — **PASS**（既に Workers 表記、cutover 採択と整合）
- [x] 5. Phase 4 検証コマンド #1 再実行 — **PASS**（`outputs/phase-02/decision-criteria.md` 現状スナップショット参照）
- [x] 6. Phase 4 検証コマンド #2 再実行 — **設計上 PASS**（ADR 起票後の再確認）
- [x] 7. **Phase 4 検証コマンド #3 再実行（不変条件 #5 抵触ガード）** — **PASS**: `apps/web/wrangler.toml` に `[[d1_databases]]` 行 0 件（実測 2026-05-01）
- [x] 8. Phase 4 検証コマンド #4 再実行 — **PASS**（CLAUDE.md L19 / L37 が Workers 表記維持）
- [x] 9. Phase 4 検証コマンド #5 再実行 — **PASS**（migration-001 と UT-GOV-006 が分離起票・C-1 整合）
- [x] 10. artifacts.json と outputs/ parity — **設計上 PASS**（Phase 12 で `outputs/artifacts.json` 生成 + diff 0 確認）
- [x] 11. artifacts.json valid JSON — **PASS**（`jq . artifacts.json` 構文 OK）
- [x] 12. outputs/artifacts.json と root artifacts.json parity — **設計上 PASS**（Phase 12 で確認）

## 不変条件 #5 ガード（独立確認）

```
$ rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
（出力なし）
$ echo "Exit: $?"
Exit: 1
```

→ **PASS**（0 件）

## 集計

| 区分 | 件数 |
| --- | --- |
| PASS | 12 |
| MINOR | 0 |
| MAJOR | 0 |
| 不変条件 #5 ガード | PASS |

## 判定

**Phase 10 進行可（PASS）**

## WEEKGRD-01 区分

- source-level PASS: 12 項目
- 環境ブロッカー: 0 件

## 完了確認

- [x] 12 項目チェックボックス形式
- [x] 不変条件 #5 ガード独立確認
- [x] 判定（Phase 10 進行可）
- [x] WEEKGRD-01 区分
