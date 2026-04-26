# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`tag_assignment_queue` の状態モデル（`candidate | confirmed | rejected`）と、`member_tags` 反映 / 状態遷移の不可逆性 / audit log を満たす resolve workflow の責務範囲を確定する。不変条件 #13（tag は queue 経由のみ）の workflow 側の担保を Phase 2 以降へ handoff する。

## 実行タスク

1. queue / member_tags / tag_definitions / audit_log の columns 確認（02b の repo 経由）
2. resolve action の入力 / 出力 / status code を確定
3. 状態遷移の許容遷移と禁止遷移を表で固定
4. AC 10 件の quantitative 化
5. true issue 抽出（reject reason の必須化、idempotent の境界、candidate 自動投入のタイミング）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 「タグ付与は管理者レビューを通す」 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | queue panel と resolve API |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル定義 |
| 必須 | doc/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | endpoint 契約 |
| 必須 | doc/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/phase-02.md | UI 側 |
| 必須 | CLAUDE.md | 不変条件 #5, #13 |

## 実行手順

### ステップ 1: scope 確定
- 入力: `queueId`（path）, body `{ action: 'confirmed' | 'rejected', tagCodes?: string[], reason?: string }`
- 出力: 200 + `{ queueId, status, resolvedAt, memberId, tagCodes? }`
- error: 400 (zod), 401, 403, 404 (queueId), 409 (state conflict), 422 (constraint)

### ステップ 2: 状態遷移表
| from | to | 条件 |
| --- | --- | --- |
| candidate | confirmed | tagCodes が tag_definitions に存在 |
| candidate | rejected | reason が non-empty |
| confirmed | confirmed | idempotent（同一 tagCodes） |
| rejected | rejected | idempotent（同一 reason） |
| confirmed | rejected | 禁止（409） |
| rejected | confirmed | 禁止（409） |
| confirmed → candidate | - | 禁止 |
| rejected → candidate | - | 禁止 |

### ステップ 3: AC quantitative
- AC ごとに「http status / DB の事後状態 / audit_log entry の有無」を測定指標化

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 状態遷移を state machine 図に |
| Phase 4 | AC × 検証手段 |
| Phase 7 | AC マトリクスのトレース元 |
| Phase 10 | gate 判定根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #5 | resolve handler は apps/api 内 workflow、apps/web から D1 にアクセスしない | data access boundary |
| #13 | resolve 経由でしか member_tags に書き込めない（直接 INSERT を別 path から呼ばない） | tag queue の audit |
| 認可境界 | admin user 以外からの呼び出しは 401/403 | admin gate |
| 無料枠 | 1 resolve = 3 D1 writes（queue update + member_tags insert + audit insert） | 100k writes/日 |
| audit | 全 resolve が audit_log に残る | 操作トレース |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | column 確認 | 1 | pending | 02b repo |
| 2 | resolve action 契約 | 1 | pending | input/output/error |
| 3 | 状態遷移表 | 1 | pending | from/to |
| 4 | AC quantitative | 1 | pending | http+DB+audit |
| 5 | true issue | 1 | pending | reason / idempotent / 自動投入 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope + 状態遷移表 + AC + true issue |
| メタ | artifacts.json | Phase 1 を completed |

## 完了条件

- [ ] 状態遷移表が 8 行以上
- [ ] AC 10 件すべてに測定指標
- [ ] true issue 3 件以上
- [ ] 不変条件 #5, #13 に対する workflow 側の担保案

## タスク100%実行確認

- 全実行タスクが completed
- artifacts.json で phase 1 を completed

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ: 状態遷移表を state machine 図化
- ブロック条件: AC 未定義なら次へ進めない

## 真の論点

1. reject の `reason` を 必須にするか optional にするか → 必須（運用上の説明責任）
2. confirmed 状態の queue を再 resolve（同一 tagCodes）する場合、新規 audit を追加するか idempotent にするか → idempotent（追加 audit なし）
3. candidate 自動投入のトリガーを 03b に置くか cron に置くか → 03b の同期内 hook（即時性優先）

## 依存境界

- 上流: 04c endpoint, 06c UI 呼び出し, 03b 同期 hook, 02b/02c repo
- 下流: 08a/b の test
- responsibility: workflow logic は apps/api 内、UI 側は呼び出しのみ

## 価値とコスト

- 価値: 管理者がタグ品質を担保しつつ、運用作業をキューで進められる
- コスト: queue 1 件 = 3 D1 writes × 月 1000 件 = 3000 writes/月（無料枠の 0.1%）

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | tag 品質と監査が両立するか | TBD |
| 実現性 | 04c endpoint + 02b repo で成立するか | TBD |
| 整合性 | 不変条件 #5, #13 を破らないか | TBD |
| 運用性 | reject reason / idempotent が運用に耐えるか | TBD |
