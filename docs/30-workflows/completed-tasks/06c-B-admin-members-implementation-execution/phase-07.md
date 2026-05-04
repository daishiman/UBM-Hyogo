[実装区分: 実装仕様書]

# Phase 7: AC マトリクス — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 7 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Issue #430 の Acceptance Criteria 各項目を、Phase 4 検証層 / Phase 5 実装箇所 / Phase 6 失敗ケースと突き合わせ、漏れと重複の有無を表で確認する。

## 実行タスク

1. AC ごとに実装ファイル、focused test、Phase 11 evidence path を対応付ける。
2. `pageSize=50` 固定、unknown tag 0 件、tag 6 件以上 422 を AC matrix の期待値へ反映する。
3. VISUAL_ON_EXECUTION の runtime evidence は本 workflow では pending contract とし、08b / 09a の実測へ handoff する。
4. 未実測の screenshot / staging curl を PASS と扱わない。

## AC マトリクス

| AC ID | AC | 検証層（Phase 4） | 実装箇所（Phase 5） | 失敗ケース（Phase 6） | 検証コマンド |
| --- | --- | --- | --- | --- | --- |
| AC1 | 検索 `q / zone / status(filter) / tag / sort` が動作する | unit + contract | `members.ts` handler / `buildAdminMembersQuery` | F8 / F9 / F10 / F13 / F15 | `pnpm vitest run apps/api/src/routes/admin/members.test.ts` |
| AC2 | ページング（`page=1..N` / `pageSize=50`）が動作する | contract | `members.ts` LIMIT/OFFSET | F11 / F12 | 同上 |
| AC3 | 詳細が member + audit logs を返す | contract | `members.ts` detail handler | F3（404） | 同上 |
| AC4 | delete（reason 必須） + audit_log 1 行追記 | contract + authz | `member-delete.ts` | F4 / F7 / F14 | `pnpm vitest run apps/api/src/routes/admin/member-delete.test.ts` |
| AC5 | restore + audit_log 1 行追記 | contract + authz | `member-delete.ts` | F5 | `pnpm vitest run apps/api/src/routes/admin/member-delete.test.ts` |
| AC6 | role mutation endpoint が存在しない | contract + authz | routing 構造 | F6 | members.test.ts route absence assertion |
| AC7 | admin 以外で 401 / 403 | authz | `require-admin` middleware | F1 / F2 | members.test.ts |
| AC8 | apps/web は cookie forwarding のみ（D1 直参照禁止 #5） | unit + 構造 grep | `apps/web/src/lib/fetch/admin.ts` | grep で D1 import 0 件 | `grep -r "D1Database\|c.env.DB" apps/web/` |
| AC9 | audit_log 必須記録（#13） | contract | status / deleted_members / audit insert を `DB.batch` で原子化 | F7 | member-delete.test.ts |
| AC10 | 検索 query が parameterized（SQL injection 不可） | unit | `buildAdminMembersQuery` placeholder 数検証 | — | shared/api unit test |
| AC11 | density / sort の許可リスト外で 422 | contract | zod enum | F8 / F9 | members.test.ts |
| AC12 | repeated tag が AND 動作（最大 5） | contract | EXISTS 連結 | F13 / F15 | members.test.ts |

## gap 検出

| gap | 内容 | 引き渡し先 |
| --- | --- | --- |
| G1 | E2E（一覧→詳細→delete→restore→list 反映） | 08b admin members E2E |
| G2 | staging visual smoke（screenshot 3 枚） | Phase 11 / 09a admin staging smoke |
| G3 | 検索 index（`members(zone)` / `member_tags(member_id, tag_id)`） | Phase 10 blocker B4 |

## 入出力・副作用

- 入力: Issue #430 AC、Phase 4 / 5 / 6 成果
- 出力: 12 行 AC マトリクス + gap 一覧
- 副作用: なし（仕様書のみ）

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm vitest run apps/api/src/routes/admin
grep -r "D1Database\|c\.env\.DB" apps/web/ || echo "no direct D1 access (expected)"
```

## DoD

- [ ] 全 AC が検証層・実装箇所・失敗ケースに紐付いている
- [ ] 検証コマンドが Phase 9 と一致する
- [ ] gap が後続タスクに引き継がれている

## 参照資料

- Issue #430 本文
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`

## 統合テスト連携

- 上流: Phase 1 AC, Phase 4 verify suite, Phase 5 runbook, Phase 6 failure cases
- 下流: Phase 8 DRY 化

## 多角的チェック観点

- #4 / #5 / #11 / #13 が AC に対応する検証層を持つ
- 検索仕様が 12-search-tags、削除仕様が 07-edit-delete と一致

## サブタスク管理

- [ ] AC × 検証 × 実装 × 失敗の表を完成させる
- [ ] gap を記録する
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- `outputs/phase-07/main.md`

## 完了条件

- [ ] 全 AC が検証層と実装に紐付く
- [ ] 全 failure case が責任 layer を持つ

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと gap を渡す。
