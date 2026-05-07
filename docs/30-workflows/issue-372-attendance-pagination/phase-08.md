# Phase 8: リファクタリング

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-8/phase-8.md` |

## 目的
Phase 5 で導入したコードの重複・命名・抽象化を整える。挙動変更なし。

## リファクタリング候補
- cursor encode/decode の重複: `apps/api` と `apps/web` で base64url 取り扱いが重複する場合は `packages/shared/src/utils/cursor.ts` に切り出し。
- `findByMemberId` と `findByMemberIds` の SQL 組み立てロジックが重複する場合、共通の `attendanceQueryBuilder` を `_shared/` に分離（過剰抽象化を避け、3 件以上重複してから抽象化）。
- route 層の query parsing（limit / cursor）を hono validator + Zod の共通 helper にまとめる。
- `apps/web` の load-more hook を profile / admin で共通化（`useLoadMoreAttendance(endpoint)`）。

## 参照資料
- `outputs/phase-8/phase-8.md`

## 成果物
- リファクタリング差分（コード）
- `outputs/phase-8/refactor-summary.md`

## 完了条件
- 全テスト PASS（regression なし）。
- typecheck / lint PASS。
- リファクタリング項目ごとに採否（採用 / 過剰抽象化のため見送り）が記録されている。

## 実行タスク
- [ ] 上記候補を検討し、必要なものだけ抽出して実施する。
- [ ] 全テストの再実行で regression がないことを確認する。

## 統合テスト連携
- Phase 9 quality gate に進む前段。
