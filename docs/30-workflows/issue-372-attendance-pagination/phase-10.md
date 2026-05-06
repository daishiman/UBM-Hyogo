# Phase 10: 最終レビューゲート

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-10/phase-10.md` |

## 目的
コミット直前のセルフ最終レビュー。実装区分・スコープ・後方互換・型契約・evidence の整合確認。

## レビューチェックリスト
- [ ] `MemberProfile.attendance: AttendanceRecord[]` の interface 契約が破壊されていない。
- [ ] `findByMemberIds(ids)` の戻り値型・挙動が変更されていない（regression テスト PASS）。
- [ ] `attendanceMeta` が optional であり、未注入時は undefined となる。
- [ ] 新 endpoint 2 つ（`/me/attendance` / `/admin/members/:id/attendance`）の認証 / 認可が既存 endpoint と一致。
- [ ] cursor が opaque であり、不正値で 400 を返す。
- [ ] limit clamp（< 1 はエラー、> 200 は 200）が動作する。
- [ ] Phase 9 quality gate 全 PASS。
- [ ] Phase 11 で実行する evidence 取得手順が明確。
- [ ] CONST_007 スコープ内で完了。先送りタスクなし。

## 参照資料
- `outputs/phase-10/phase-10.md`
- `outputs/phase-9/test.log`
- `outputs/phase-9/build.log`

## 成果物
- `outputs/phase-10/final-review.md`

## 完了条件
- 全項目 ✅。1 つでも未達なら該当 Phase に戻る。

## 実行タスク
- [ ] チェックリストを埋める。
- [ ] 不足は前 Phase に戻して再検証する。

## 統合テスト連携
- Phase 11 / 13 ゲートに進む前段。
