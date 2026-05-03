[実装区分: 実装仕様書]

# Phase 10: 最終レビュー — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 10 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜9 を通読し、Phase 11（実装着手 + 手動 smoke）に進める状態か最終確認する。

## 実行タスク

1. index / artifacts / Phase 1〜13 の状態整合を確認する。
2. secret / token / public route import 混入を grep で確認する。
3. AC ↔ evidence path の一致を確認する。
4. Phase 11 runtime evidence blocked 境界を PASS と誤記していないか確認する。

## 参照資料

- docs/30-workflows/ut-05a-auth-ui-logout-button-001/index.md
- docs/30-workflows/ut-05a-auth-ui-logout-button-001/artifacts.json
- docs/30-workflows/ut-05a-auth-ui-logout-button-001/phase-07.md

## 統合テスト連携

- Phase 9 の typecheck / unit test / validator 結果を最終レビューの入力にする。

## レビュー観点

- workflow_state が `spec_created` のまま据え置かれている
- secret / session token / 個人情報が一切記載されていない
- Auth.js endpoint / middleware への変更が含まれていない
- `(public)` ルートに sign-out が漏れる設計になっていない
- `signOut()` の `redirectTo` が `/login` で統一されている
- 仮置きパス / 仮置きコマンドが残っていない
- Phase 7 AC マトリクスと Phase 11 evidence path が一致

## 実行手順

- index.md / artifacts.json と各 phase の整合を確認
- grep で `wrangler ` 直接呼出が無いことを確認
- grep で session token らしき文字列が無いことを確認
- 既存 `apps/web/middleware.ts` と `apps/web/src/lib/auth.ts` の挙動を再確認

## サブタスク管理

- [ ] 全 phase 通読
- [ ] grep で危険パターン（token / wrangler 直叩き）が無いことを確認
- [ ] outputs/phase-10/main.md に最終レビュー結果を記録
- [ ] outputs/phase-10/grep-checks.md（自動 grep 検査結果）

## 成果物

- outputs/phase-10/main.md
- outputs/phase-10/grep-checks.md

## 完了条件

- 不整合 / 仮置き / secret 露出がゼロ
- AC ↔ evidence path の整合 PASS
- Phase 11 着手準備完了

## タスク100%実行確認

- [ ] 全 phase が相互に矛盾しない
- [ ] PII / secret 露出が無い

## 次 Phase への引き渡し

Phase 11 へ、最終レビュー済の runbook を渡す。
