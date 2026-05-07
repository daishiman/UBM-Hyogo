# Phase 3: 設計レビューゲート

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-3/phase-3.md` |

## 目的
Phase 2 設計成果物のレビューゲート。実装着手前の最終整合チェック。

## レビュー観点
- 苦戦箇所整合: `findByMemberIds` 後方互換維持 / `attendanceMeta` の optional 追加方針が Issue 元の苦戦箇所の指摘と一致しているか。
- 型契約破壊なし: `MemberProfile.attendance: AttendanceRecord[]` を変更していないこと。`attendanceMeta` は optional で既存 client を壊さないこと。
- cursor 設計の安定性: `held_on DESC, session_id DESC` のソートで cursor が一意確定すること。同 held_on 内で write が増えても順序破綻しないこと。
- limit 上限/下限 と 400 エラー仕様: limit < 1 / limit > 200 / 不正 cursor の扱いが明確か。
- shared パッケージ依存: `apps/web` が `packages/shared` の型を取り込めること（既存の build 構成と整合）。

## 参照資料
- `outputs/phase-2/api-design.md`
- `outputs/phase-2/cursor-format.md`
- `outputs/phase-2/ui-load-more-design.md`

## 成果物
- `outputs/phase-3/review-checklist.md`
- `outputs/phase-3/approval-record.md`

## 完了条件
- レビュー観点全項目に PASS が記録され、approval-record にユーザー（または solo dev 自身）の承認が記録される。

## 実行タスク
- [ ] レビュー観点をチェックリスト化し、`outputs/phase-3/review-checklist.md` に PASS/FAIL を記録する。
- [ ] FAIL 項目があれば Phase 2 に差し戻す。

## 統合テスト連携
- ゲートのみ。テスト実装なし。
