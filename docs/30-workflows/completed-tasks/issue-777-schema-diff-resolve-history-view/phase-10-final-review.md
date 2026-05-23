# Phase 10: 最終レビュー

## 1. AC 全網羅チェックリスト

| AC | 内容 | 検証手段 | 状態 |
|---|---|---|---|
| AC-1 | `/admin/schema` 配下から履歴閲覧 UI へ到達でき、時系列降順で表示 | `Breadcrumb` 導線 + history page DOM + spec の sort assertion | [ ] |
| AC-2 | 行に `操作日時 / 操作者 email / before stableKey / after stableKey / question text` を表示 | component spec DOM assertion | [ ] |
| AC-3 | filter（email / 期間 / question text 部分一致）が動作 + cursor pagination と併用可能 | component spec の filter case | [ ] |
| AC-4 | cursor pagination が既存 audit encoding と整合し「次の 50 件」で連続閲覧可能 | api.spec.ts の cursor 受け渡し case + 手動テスト | [ ] |
| AC-5 | 履歴 0 件時に `EmptyState` で「該当する履歴がありません」を表示 | component spec の empty case | [ ] |
| AC-6 | shared primitive (Pagination / FormField / Breadcrumb / EmptyState) を再利用し新規 primitive を生やさない | grep + 視覚レビュー | [ ] |
| AC-7 | OKLch token のみ使用、`verify-design-tokens` PASS | Phase 9 §1 HEX grep + CI | [ ] |
| AC-8 | 新 test は `*.spec.tsx` のみ | Phase 9 §1 命名 grep + `verify-test-suffix` | [ ] |
| AC-9 | spec が 4 観点（filter / pagination / 空状態 / fetch error）網羅 | spec describe 構造の目視確認 | [ ] |
| AC-10 | §2.5 / §2.6 判断点が確定し spec に追記済み | 採用: 案 A（`/admin/audit?action=schema_diff.alias_assigned`）/ 案 α（独立 route `/admin/schema/history`） | [ ] |
| AC-11 | 案 B 採用時は `01-api-schema.md` / `11-admin-management.md` を更新 | 本タスクは案 A 採用のため、`11-admin-management.md` の履歴閲覧 UI セクションのみ追記 | [ ] |
| AC-12 | `serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3 を consumed に更新 | 該当ファイルの diff 確認 | [ ] |

## 2. CLAUDE.md「UI prototype alignment / MVP recovery」不変条件チェック

| 不変条件 | 内容 | 適合 |
|---|---|---|
| 1. 既存 API のみ接続 | 案 A 採用により `/admin/audit?action=schema_diff.alias_assigned` で既存 endpoint surface 維持。新 endpoint / D1 schema 変更なし | [ ] |
| 2. OKLch トークン正本化 | 色は `tokens.css` 経由のみ。HEX 直書き / `bg-[#xxx]` 無し（Phase 9 §1 grep で 0 件） | [ ] |
| 3. プロトタイプ正本順位 / 新規 primitive を生やさない | parallel-09 提供の Pagination / FormField / Breadcrumb / EmptyState を再利用 | [ ] |
| 4. D1 直接アクセス禁止 | `apps/web` から D1 binding 直叩きなし。fetch は `apps/web/src/lib/admin/api.ts` 経由のみ | [ ] |

## 3. CLAUDE.md グローバル不変条件チェック

| 項目 | 内容 | 適合 |
|---|---|---|
| #8 test suffix | `.spec.tsx` のみ追加 | [ ] |
| #9 admin form input | `FormField` 経由のみ、直 `<input>` 増加なし | [ ] |
| #10 admin mutation | 本タスクは read-only、`useAdminMutation` 不要 | [ ] |
| `apps/web` env アクセス | `getEnv()` / `getPublicEnv()` 経由のみ、`process.env.*` 直参照なし | [ ] |
| Cloudflare CLI | 本タスクでは未使用（実行する場合は `scripts/cf.sh` 経由） | [ ] |

## 4. デザイントークン整合確認

- [ ] before stableKey / after stableKey の差分強調色は `--color-warning` / `--color-info` 系 token のみ使用
- [ ] 行 hover / focus state は token 経由（`hover:bg-surface-2` 等）
- [ ] filter form のラベル / placeholder / error 表示は `FormField` 既定 token に追従
- [ ] focus ring は OKLch token（`--ring` 系）経由

## 5. 関連タスクとの整合

| タスク | 関係 | 結論 |
|---|---|---|
| serial-05 step-03（親） | 親タスク `implemented`、本タスクは Phase 12 後続候補の消化 | OK（unassigned-task-detection §3 を consumed に更新） |
| followup-002（bulk resolve） | 独立。bulk 識別 flag 表示は本 PR では未対応 | OK |
| followup-004（rollback / undo） | 本タスクが前提。行に `data-audit-id` 保持で起動 anchor 提供 | OK（rollback タスク先行着手可能化） |
| parallel-09（shared primitives） | 完了前提。Pagination / FormField / Breadcrumb / EmptyState 再利用 | OK |

## 6. ブロッカー判定

なし。`outputs/phase-11/screenshots/` 配下の authenticated browser screenshot は user-gated。staging runtime smoke は user 承認後に取得し evidence として保存する。

## 7. 残課題（merge 後）

- `SchemaDiffPanel` と `SchemaDiffHistoryPanel` の共通行 component 抽出（重複 3 箇所以上発生時）
- bulk resolve（followup-002）完了後の bulk badge 表示
- followup-004 rollback action の本 UI からの起動導線
- 履歴 CSV export（さらに後続）
