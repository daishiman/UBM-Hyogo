# Phase 2 Output: no-new-endpoint-policy（新設禁止方針）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 2 / 13（設計） |
| 関連ファイル | `outputs/phase-02/migration-matrix-design.md`（移植マトリクス本体） |

## 1. 方針サマリー

本 close-out では **以下 2 endpoint と 2 テーブルを新設しない**。

| 区分 | 対象 | 取り扱い |
| --- | --- | --- |
| 禁止（endpoint） | 単一 `POST /admin/sync` | 新設しない（恒久） |
| 禁止（endpoint） | `GET /admin/sync/audit` | 新設しない（恒久） |
| 保留（D1 table） | `sync_audit_logs` | UT21-U02 判定まで新設保留 |
| 保留（D1 table） | `sync_audit_outbox` | UT21-U02 判定まで新設保留 |

## 2. 禁止対象（endpoint）

| # | 対象 | 禁止根拠 |
| --- | --- | --- |
| 1 | 単一 `POST /admin/sync`（job_kind 無分岐の統合 endpoint） | `job_kind` 単一責務原則により 03a `POST /admin/sync/schema` と 03b `POST /admin/sync/responses` の 2 系統に分離済み。単一統合は `job_kind` 分岐を handler 内へ持ち込み、失敗ドメイン（forms.get vs forms.responses.list）/ retry 戦略 / 排他粒度を曖昧化する。さらに姉妹 close-out `task-sync-forms-d1-legacy-umbrella-001` の方針と直接矛盾する |
| 2 | `GET /admin/sync/audit`（公開 audit endpoint） | `sync_jobs` ledger は admin UI 経由で内部参照する設計（02c / 04c）。公開 endpoint は admin 認可境界を冗長化し、API surface を不必要に拡大する。04c の Bearer + admin role 認可で必要十分 |

## 3. 保留対象（D1 table）

| # | 対象 | 保留理由 |
| --- | --- | --- |
| 1 | `sync_audit_logs`（best-effort 監査ログ） | Sheets sync の best-effort モデル前提。Forms sync の retry-from-cursor モデルでは `sync_jobs.metrics_json` で吸収できる可能性が高く、`sync_jobs` の不足分析（UT21-U02）が未実施 |
| 2 | `sync_audit_outbox`（at-least-once 配送 outbox） | Forms→D1 一方向同期では outbox が不要なケースが多い。配送先（外部システム / 通知）が確定しない限り、列スキーマ設計が空想的になる |

## 4. 例外条件（禁止解除の唯一の経路）

両 endpoint の新設は、本 close-out の **完了後** に以下 3 条件をすべて満たす独立タスクが起票された場合に限り検討可能。

1. aiworkflow-requirements skill `references/task-workflow.md` への正本記述追加（current facts として登録）
2. 03a / 03b / 04c の AC 改訂（既存分割 endpoint を deprecation する経路 or 共存ルールの明文化）
3. 不変条件 #1 / #4 / #5 / #7 への抵触チェック PASS

> 上記 3 条件のいずれかが欠ける場合、本 policy により block する。「将来検討」「必要に応じて」等の曖昧表現で解禁することは認めない。

保留テーブルの新設解除は UT21-U02 の判定結果に従う。U02 で「`sync_jobs` で十分」と結論された場合、本 policy は恒久禁止に格上げされる。

## 5. 根拠（参照）

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` の「単一 `/admin/sync` を新設しない」方針との整合（姉妹 close-out）
- CLAUDE.md 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）+ 02c の admin-managed data 境界
- aiworkflow-requirements `references/task-workflow.md:9`（2026-04-30 時点の current facts: 「単一 `POST /admin/sync`、`GET /admin/sync/audit`、`sync_audit_logs`、`sync_audit_outbox` は新設しない」）
- `docs/30-workflows/02-application-implementation/_design/phase-2-design.md` の admin endpoint 一覧（分割形式が正本）

## 6. 確認コマンド（AC-10）

```bash
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows/02-application-implementation \
  .claude/skills/aiworkflow-requirements/references
```

期待:

- `POST /admin/sync\b` のヒットはすべて `POST /admin/sync/schema` / `POST /admin/sync/responses`（分割形式）への参照のみ
- `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` のヒットは `task-workflow.md` 内 close-out 注記（「新設しない」文脈）のみ
- 03a / 03b / 04c / 09a / 09b / 09c の正本仕様内で「新設すべき」とする記述は 0 件

2026-04-30 実行結果は本方針と完全整合（詳細は `outputs/phase-01/main.md §10` および `outputs/phase-02/migration-matrix-design.md §(g)` 参照）。

## 7. 不変条件 touched（再確認）

| # | 不変条件 | 本 policy での扱い |
| --- | --- | --- |
| #1 | schema をコードに固定しすぎない | 単一 endpoint 統合は schema 分岐を handler 内へ固定化する圧力になるため、分割 endpoint を維持して回避 |
| #4 | Form schema 外データは admin-managed として分離 | `sync_jobs` ledger の admin-managed 性質を維持。公開 audit endpoint を作らず admin UI 内に閉じる |
| #5 | D1 直接アクセスは `apps/api` に閉じる | endpoint 新設は `apps/api` 内のルーター変更を伴うため、本 policy で apps 境界の動揺を防ぐ |
| #7 | Forms 再回答を本人更新の正式経路 | Sheets 経由の二重正本化を構造的にロックすることで本人更新経路を Forms 一本に維持 |

## 8. 監視・適用ルール

- 本 policy への違反候補（新規 PR / 仕様 PR で単一 `POST /admin/sync` や `GET /admin/sync/audit` の追加が提案された場合）は、レビュー段階で本ファイル（`no-new-endpoint-policy.md`）と移植マトリクス §(c) を引用してブロックする。
- aiworkflow-requirements skill の `task-workflow.md` 更新時、§5 の current facts 記述が削除されていないことを `pnpm indexes:rebuild` 後の verify-indexes CI で間接的に保護する。
- 本 policy の有効期限は「UT21-U02 判定 + 上記 §4 例外条件 3 件すべて充足」まで。それまでは恒久。
