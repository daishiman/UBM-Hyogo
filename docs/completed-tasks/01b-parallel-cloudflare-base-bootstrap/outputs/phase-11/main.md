# Phase 11 成果物: 手動 smoke test 実行サマリー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | 手動 smoke test |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. 入力確認

Phase 10 GO 判定:
- 全 AC が PASS
- ブロッカー確認リスト全項目 ✅ または Phase 12 行き記録済み
- Phase 11 即時着手可能

## 2. 実行サマリー

docs-only タスクのため、smoke test は実環境を持つ担当者が実行する手順書として定義する。
手順は `outputs/phase-11/manual-cloudflare-checklist.md` に記載済み。

## 3. AC-4 / AC-5 確認状況

| AC | 確認内容 | 確認方法 | 状態 |
| --- | --- | --- | --- |
| AC-4 | Pages build count（500/月）と Workers req/day（100k/day）がダッシュボードで追跡可能 | Cloudflare Dashboard Analytics で確認 | docs-only: 手順書として記録 |
| AC-5 | Pages ロールバックと Workers ロールバックが独立して機能する | Pages Dashboard rollback + `wrangler rollback` ドライラン | docs-only: 手順書として記録 |

## 4. MINOR 確認

| ID | 内容 | 状態 |
| --- | --- | --- |
| M-02 | `ubm-hyogo-web.pages.dev` URL の最終確定 | Phase 12 行き（DNS 設定後） |

## 5. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | smoke test チェックリストにより担当者が目視確認すべき全項目が明確になっている |
| 実現性 | PASS | 全確認項目が Cloudflare 無料枠と既存 CLI で実行可能 |
| 整合性 | PASS | チェックリストが設計（Phase 1-5）と一致している |
| 運用性 | PASS | 失敗時の戻り先（逆引き表）が明記されている |

## 6. downstream handoff

Phase 12 では本 Phase の manual-cloudflare-checklist.md の確認結果を受け取り、MINOR M-01（develop→dev）を対応する。

## 完了条件チェック

- [x] 主成果物（manual-cloudflare-checklist.md）が作成済み
- [x] チェックリスト全項目が記録済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
