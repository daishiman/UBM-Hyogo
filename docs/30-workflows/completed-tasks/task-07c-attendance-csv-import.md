# meeting attendance CSV 一括 import - タスク指示書

## メタ情報

```yaml
issue_number: 312
```

## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | 07c-followup-001-attendance-csv-import            |
| タスク名     | meeting attendance CSV 一括 import                |
| 分類         | 改善                                              |
| 対象機能     | meeting attendance bulk operation                 |
| 優先度       | 低                                                |
| 見積もり規模 | 中規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | 07c Phase 12 unassigned-task-detection            |
| 発見日       | 2026-04-30                                        |

---

## 概要

meeting attendance を CSV から一括 import する管理機能を設計・実装する。
07c で実装した単一 member 単位の add/remove API を補完し、イベント終了後の
一括出席登録ワークフローを admin UI から完結できるようにする。

---

## 背景

07c は MVP 範囲として attendance の単一 add/remove API のみを提供した。
実運用では 30〜60 名規模の例会後に一括登録するケースが多く、現状の単一 API では
admin の手作業負荷が高い。CSV 一括 import を別タスクとして切り出し、
dry-run / 行別エラー / audit_log 統合を本タスクで設計する。

---

## 完了条件

### 機能要件

- [ ] CSV schema validation（必須カラム: meeting_id, member_id or email）が実装されている
- [ ] dry-run preview API（実 commit せず行別の judgement を返す）が提供されている
- [ ] 行別エラー分類: `duplicate` / `deleted_member` / `unknown_member` / `ok` を返す
- [ ] import 成功分は 07c の `audit_log` スキーマに準拠して記録される
- [ ] admin UI から CSV upload → preview → confirm の 3 ステップで操作できる

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] bulk import の integration test（dry-run / commit / 部分失敗）が緑

### 依存

- 07c Attendance Audit API（単一 add/remove・`audit_log` スキーマ）がマージ済み
- audit log browsing UI（admin で import 履歴を確認するため）

---

## 詳細仕様

### 想定スコープ

#### 含むもの

- CSV schema validation（zod ベース・行単位 issue 集約）
- dry-run preview endpoint（`POST /admin/attendance/import?dryRun=true`）
- duplicate / deleted member / unknown member / ok の行別エラー分類
- import 成功分の `audit_log` 記録（actor は session 由来）
- admin UI の upload → preview → confirm フロー

#### 含まないもの

- CSV export（別タスク）
- 出席状態以外（懇親会出欠等）の bulk 操作
- 過去 meeting への遡及 import の整合性検証

### 推奨アプローチ

1. CSV schema を zod で定義し、行単位の issue を蓄積する parser を切り出す
2. dry-run / commit を同一 service 関数で `commit: boolean` 引数により分岐
3. duplicate 判定は D1 UNIQUE 制約 + 事前 SELECT の併用（race 時は 409 → 行別エラーに変換）
4. deleted member 候補は member table の soft-delete flag を JOIN して除外
5. audit_log の actor は session から取り出し service 層に明示的に渡す

---

## 参照

- `docs/30-workflows/07c-meeting-attendance-audit-api/` - 07c 設計と単一 add/remove 実装
- `docs/30-workflows/07c-meeting-attendance-audit-api/outputs/phase-12/` - Phase 12 unassigned-task 検出ログ
- `docs/00-getting-started-manual/specs/00-overview.md` - admin workflow 全体像

---

## 学び / 苦戦箇所

- 07c 単体では UNIQUE 制約の 409 を単純に上位に投げる設計で済んだが、bulk 化すると行単位での
  リトライ判定 / エラー集約が必須になる。早期に「どこまでをトランザクション境界とするか」を決める。
- deleted member 候補の除外は member table との JOIN コストが効くため、import サイズが
  数百行を超える場合は事前に member id set を一括 SELECT してメモリ上で突合する方が安い。
- `audit_log` の actor 情報は session から service 層へ受け渡す必要があり、Hono context を
  service に直接渡さず明示的な引数として注入する形に揃えると bulk / single 両方で再利用できる。
- 07c は単一 add/remove のみだった。bulk 化は重複/未削除/未登録の混合エラーを行単位で返す UX が
  論点になるため、実装着手前に dry-run の出力スキーマを固めることを最優先とする。
