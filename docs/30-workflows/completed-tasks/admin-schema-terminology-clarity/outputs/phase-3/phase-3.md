# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 3 / 13（設計レビューゲート） |
| 判定 | PASS（Phase 4 へ進行可） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

Phase 1-2 の要件・設計が、Phase 4 以降の実装を確実に駆動できる粒度になっているかを判定する。4条件（価値性・実現性・整合性・運用性）で評価する。

## 実行タスク

1. 用語リネーム正本テーブル（shared-context.md §2）が全表示箇所をファイル:行で網羅しているか確認する。
2. revisionId 非表示設計がデータ取得ロジックを変更しないことを確認する。
3. API/D1/Form 非接触の不変条件が設計に反映されているか確認する。
4. 用語集を技術名併記の正本として据置とする責務境界に矛盾がないか確認する。
5. 4条件評価を記録する。

## 参照資料

- [phase-1.md](../phase-1/phase-1.md) / [phase-2.md](../phase-2/phase-2.md)
- [shared-context.md](../../shared-context.md)

## 成果物

### 4条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 非エンジニア管理者の認知コストを下げる。誰の(管理者)どのコスト(用語解読・番号の意味調査)を下げるか定義済み |
| 実現性 | PASS | 文字列置換 + helper 1個 + テスト更新。単一 PR・単一サイクルで完了可能（CONST_007 充足） |
| 整合性 | PASS | API/testid/href/型/変数を不変に保ち、責務境界（データ層/表現層/用語集SSOT）が閉じている。CLAUDE.md invariant #5/#2 と矛盾なし |
| 運用性 | PASS | focused vitest + verify:tokens + apps/api diff gate で回帰検証可能。grep gate で英語表記残存 0 を機械確認 |

### レビュー指摘

| 指摘 | 重要度 | 対応 |
|------|--------|------|
| BulkRollbackModal の実文字列が未確認 | MINOR | Phase 5 実装時に grep で確認し §2-7 方針で日本語化する旨を明記済み |
| 一部 spec の実在が未確認（SchemaAlertCard.spec 等） | MINOR | Phase 4 でファイル実在を `ls` 確認し、不在なら新規作成 or 該当 assert を持つ spec を特定する旨を記載済み |

> MINOR 指摘はいずれも Phase 4/5 の実装手順に内包済みで、設計の手戻りを生じない。

## 統合テスト連携

- Phase 4 のテスト設計が AC-1〜AC-11 を 1:1 でカバーすることを確認する条件を本ゲートで固定する。
- 統合 gate（typecheck / lint / focused vitest / verify:tokens / apps/api diff / grep）の集合を Phase 9 品質保証の合格基準として引き継ぐ。

## 完了条件

- [ ] 用語リネーム正本テーブルの網羅性を確認した
- [ ] revisionId 非表示がデータ層不変であることを確認した
- [ ] 4条件すべて PASS と判定した
- [ ] MINOR 指摘が Phase 4/5 手順に内包されていることを確認した
- [ ] Phase 4 への進行を承認した
