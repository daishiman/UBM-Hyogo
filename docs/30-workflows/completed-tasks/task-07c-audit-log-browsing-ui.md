# task-07c-audit-log-browsing-ui

```yaml
issue_number: 314
```

## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | 07c-followup-003-audit-log-browsing-ui            |
| タスク名     | /admin/audit 監査ログ閲覧 UI                      |
| 分類         | 改善（運用）                                      |
| 対象機能     | audit_log の admin 閲覧                           |
| 優先度       | 中                                                |
| 見積もり規模 | 中規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | 07c Phase 12 unassigned-task-detection            |
| 発見日       | 2026-04-30                                        |

---

## 概要

07c で append される `audit_log` テーブルを、管理者が actor / action / target / created_at の 4 軸で検索・閲覧できる `/admin/audit` UI を追加する。append 側は 07c で実装済みのため、本タスクは閲覧側（read-only）に限定する。

## 背景

07c は attendance add/remove の監査ログ「記録」までを実装し、閲覧 UI は scope out として後続タスクに切り出した。運用が始まると「誰がいつ何を変更したか」を admin が即座に追跡できる手段が無いため、incident 対応・問い合わせ対応・運用監査の各シナリオで GUI が必要になる。`before_json` / `after_json` を含むため、PII を含む値の安全な表示（マスキング・展開ガード）も本タスクで定式化する。

## 完了条件

- `/admin/audit` route が admin gate（Auth.js + admin role）必須で動作する
- action enum filter（`attendance.add` / `attendance.remove` 等）が機能する
- actorEmail / targetType / targetId による単項目 filter が機能する
- date range filter（from / to）が JST 入力 → UTC 変換で D1 にクエリ送出される
- `before_json` / `after_json` がデフォルトでは折り畳み表示、展開時のみ JSON viewer で表示
- PII フィールド（email, phone 等）のマスキングルールが適用される
- ページネーション（cursor or offset）と件数制限が実装されている
- typecheck / lint / api contract test / web visual smoke すべて緑

## 詳細仕様

### 想定スコープ

- `apps/web` 配下の `/admin/audit` route（Next.js App Router）
- `apps/api` 配下の `GET /admin/audit` endpoint（filter パラメータ受領）
- action / actorEmail / targetType / targetId / date range の複合 filter
- `before_json` / `after_json` の安全な表示（PII マスク + 折り畳み + 明示展開）
- admin gate（admin 以外は 403）
- ページネーションと表示件数制限

### 想定スコープ外

- audit_log の編集・削除 UI（append-only 不変条件のため）
- CSV / 外部 export（運用要件次第で別タスク化）
- アラート / 通知連携（SIEM 連携は別レイヤー）

### 受入条件（AC）

- AC-1: 非 admin ユーザーが `/admin/audit` にアクセスすると 403 / redirect される
- AC-2: action filter で `attendance.add` を選択すると attendance.add のみが返る
- AC-3: date range で JST `2026-04-01 00:00 〜 2026-04-30 23:59` を指定すると、対応する UTC 範囲で D1 がクエリされ、境界の row が取りこぼされない
- AC-4: `before_json` / `after_json` の email 値がマスク（`a***@example.com`）されて表示される
- AC-5: ページネーションで次ページに遷移しても filter 状態が保持される
- AC-6: api contract test で filter 組合せ（action × date range × actorEmail）が網羅されている

### 依存

- 07c attendance audit API（audit_log への append）
- 08a API contract tests（filter / pagination の契約）
- 08b / 09a visual smoke（admin route の visual / a11y）
- 05a admin gate（Auth.js + admin role 判定）

## 学び / 苦戦箇所

- 07c で audit_log への append を実装したが、`before_json` / `after_json` の安全表示（PII マスキング含む）は append 側では未定義のため、本タスクで表示時マスキングを定式化する必要がある。
- actor / action / target / created_at の 4 軸 filter UX は単純に列挙すると admin 体験が悪化するため、action enum を主軸にし、他 3 軸を二次 filter に位置付ける構成が妥当。
- 特に date range は D1 timezone（UTC 固定）と admin の JST 表示の往復が要検討で、入力は JST、内部は UTC、表示は JST に揃える方針を runbook 化する。
- `before_json` / `after_json` をそのまま JSON 展開すると PII が leak するため、デフォルト折り畳み + 明示展開 + マスキングの 3 層防御で扱う。
- audit_log は append-only のため UI も read-only に限定し、編集・削除アクションを物理的に出現させない設計にする。

## 参照

- 07c Phase 12 unassigned-task-detection.md（本タスクの発見元）
- `apps/api/src/repository/auditLogRepository.ts`（07c 実装）
- `docs/00-getting-started-manual/specs/02-auth.md`（admin gate 仕様）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 timezone = UTC）
- 不変条件: audit_log は append-only
