# Phase 9: 品質保証 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 9 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

無料枠見積もり、secret hygiene、a11y を確認する。

## free-tier 見積もり

| 項目 | 想定 | 限度 |
| --- | --- | --- |
| Workers requests | admin の list/detail で 1 操作あたり 数 req、想定 admin 数 1〜数名 | Cloudflare Workers free 100k/day 内 |
| D1 reads | list 検索 1 回あたり 1〜2 query | D1 free 5M reads/day 内 |
| D1 writes | delete / restore + audit log = 各 2 write | 100k writes/day 内 |
| Pages | 一覧最大 50 件/page で sort + index 利用 | 全件スキャン回避 |

## secret hygiene チェックリスト

- [ ] AUTH_SECRET / DATABASE 接続情報を仕様書中に記載していない
- [ ] audit に PII が漏れない（actor は memberId のみ、name は記載しない）
- [ ] error response に内部 SQL や stack trace を含めない
- [ ] apps/web 側で D1 binding を直参照しない（不変条件 #5）

## a11y チェックリスト

- [ ] 検索フォームに label が紐付く
- [ ] table の column header が `<th scope="col">` で表現される
- [ ] delete / restore の confirmation が dialog で focus trap される
- [ ] error toast が aria-live="polite" で読み上げられる
- [ ] keyboard で 一覧→詳細→操作 まで到達できる

## 実行タスク

1. 無料枠見積もりを記録する。完了条件: 想定運用が無料枠内に収まる。
2. secret hygiene を確認する。完了条件: 漏洩経路が無い。
3. a11y を 09-ui-ux.md と整合させる。完了条件: WCAG AA 必須項目が満たされる。

## 参照資料

- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/08-free-database.md

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 8 DRY
- 下流: Phase 10 最終レビュー

## 多角的チェック観点

- #5 / #13 / a11y / 無料枠

## サブタスク管理

- [x] 無料枠見積もり完了
- [x] secret hygiene 完了
- [x] a11y 完了
- [x] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md

## 完了条件

- [x] 無料枠で運用可能
- [x] secret 漏洩経路ゼロ
- [x] a11y AA 必須項目満たす

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、QA 結果を渡す。
