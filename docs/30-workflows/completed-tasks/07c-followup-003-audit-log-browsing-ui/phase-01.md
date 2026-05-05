# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

Issue #314 の `/admin/audit` 監査ログ閲覧 UI を、実装着手可能な要件へ固定する。closed issue は reopen せず、既存単票と正本仕様から実行条件を抽出する。

## 実行タスク

1. P50 チェックとして既存 `/admin/audit` route と `GET /admin/audit` の有無を確認する
2. Issue #314 の AC を Phase 7 で検証可能な番号付き AC に変換する
3. `audit_log` append-only、admin gate、PII 表示マスク、JST/UTC 変換の不変条件を固定する
4. Phase 1-3 完了前に Phase 4 へ進まない gate を明記する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/314 | 入力要件 |
| 旧単票 | docs/30-workflows/completed-tasks/task-07c-audit-log-browsing-ui.md | 元タスク仕様 |
| API 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin API / audit |
| DB 正本 | apps/api/migrations/0003_auth_support.sql | `audit_log` 実 DB |
| 実装アンカー | apps/api/src/repository/auditLog.ts | append/list 既存 repository |
| UI 正本 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | admin proxy / UI gate |

## 実行手順

### ステップ 1: P50 チェック

実装者は `rg -n "/admin/audit|audit_log|auditLog" apps/api apps/web` を実行し、既存閲覧 route が無いこと、`auditLog.listRecent/listByActor/listByTarget` が閲覧 API の土台であることを確認する。

### ステップ 2: AC 定義

- AC-1: 非 admin は `/admin/audit` UI と `GET /admin/audit` の双方で拒否される
- AC-2: `action=attendance.add` で該当 action のみ返る
- AC-3: actorEmail / targetType / targetId の単項目 filter が機能する
- AC-4: JST date range が UTC query に変換され、境界 row を落とさない
- AC-5: `before_json` / `after_json` は初期折り畳み、展開時のみ JSON viewer に表示される
- AC-6: email / phone 等の PII が表示時にマスクされる
- AC-7: pagination 後も filter 状態が保持される
- AC-8: limit cap と invalid query が route test で検証される
- AC-9: empty / API error / broken JSON でも UI が崩れない
- AC-10: audit_log の編集・削除 UI が存在しない

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | AC を test matrix に変換 |
| Phase 7 | AC matrix の正本 |
| Phase 11 | UI screenshot / a11y evidence の対象 |

## 多角的チェック観点（AIが判断）

- 真の論点: 監査ログを「記録した」だけでは運用監査に使えないため、read-only GUI と安全表示が必要
- 依存境界: append 実装は 07c 完了済み、本タスクは閲覧 API / UI に限定
- 価値とコスト: CSV / SIEM は運用価値があるが MVP 閲覧 UI より後でよい

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | P50 チェック定義 | completed | 実装時に再実行 |
| 2 | AC-1〜AC-10 定義 | completed | Phase 7 へ引き継ぎ |
| 3 | 不変条件固定 | completed | index.md と重複記載 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義サマリ |
| メタ | artifacts.json | Phase 1 completed |

## 完了条件

- [x] AC が番号付きで定義されている
- [x] P50 チェックが明記されている
- [x] Phase 1-3 gate が明記されている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [x] main.md 配置済み
- [x] artifacts.json の Phase 1 が completed

## 次Phase

次: 2 (設計)。Phase 2 は API / repository / web UI / visual evidence の topology を固定する。
