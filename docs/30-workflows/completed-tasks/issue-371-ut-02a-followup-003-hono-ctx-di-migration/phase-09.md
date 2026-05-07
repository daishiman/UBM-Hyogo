# Phase 9: 不変条件 / 契約整合性検査

実装区分: 実装仕様書

## 9.1 不変条件チェックリスト

| 不変条件 | 確認方法 | 期待 |
| --- | --- | --- |
| #1 form schema 固定禁止 | 本タスクは form schema に触れない | git diff で `apps/api/src/forms/` / `apps/api/migrations/` 差分 0 |
| #2 consent キー統一（publicConsent / rulesConsent） | `MemberProfile` interface 不変 | builder.ts の type export 差分なし |
| #3 `responseEmail` は system field | 同上 | builder.ts の戻り値構造変更なし |
| #4 admin-managed data 分離 | attendance は admin-managed のため変更なし | `member_attendance` schema 変更なし |
| **#5 D1 直接アクセスは apps/api に閉じる** | 新規 middleware も apps/api 配下 | `rg "createAttendanceProvider" apps/web/src/` → マッチなし |
| #6 GAS prototype を昇格させない | 該当なし | — |
| #7 Google Form 再回答が本人更新の正式経路 | 該当なし | — |
| `MemberProfile.attendance` 型契約不変 | builder type 差分検証 | `git diff main -- apps/api/src/repository/_shared/builder.ts` で `MemberProfile` / `AdminMemberDetailView` の type シェイプ変更がない |
| admin gate 中継 | route 単体で `if (auth)` 禁止 | `rg "if.*auth" apps/api/src/routes/admin/members.ts` で route handler 内認可チェックがない |
| silent fallback 禁止（本タスク追加） | builder.ts `fetchAttendanceFor` で throw | 6.2 アンチパターン検出を再実行 |

## 9.2 grep gate 一覧（Phase 4 T11/T12 + Phase 6 R1/R6 を統合）

```bash
# G1: deps?: { attendanceProvider } が builder から消えている
rg -n "deps\\?\\s*:\\s*\\{\\s*attendanceProvider" apps/api/src/repository/_shared/builder.ts
# 期待: マッチなし

# G2: route から { attendanceProvider: ... } 引数が消えている
rg -n "attendanceProvider:\\s*createAttendanceProvider" apps/api/src/routes/
# 期待: マッチなし

# G3: builder から createAttendanceProvider 直接 import が消えている
rg -n "createAttendanceProvider" apps/api/src/repository/_shared/builder.ts
# 期待: マッチなし

# G4: silent fallback (?? []) が attendance 周辺に存在しない
rg -n "attendance.*\\?\\?\\s*\\[\\]" apps/api/src/repository/_shared/builder.ts
# 期待: マッチなし

# G5: D1 直接アクセスが apps/web に流出していない
rg -n "createAttendanceProvider|D1Database" apps/web/src/
# 期待: マッチなし
```

## 9.3 契約整合性

| 契約 | 検査 | 期待 |
| --- | --- | --- |
| `MemberProfile` interface | `apps/api/src/repository/_shared/builder.ts` の export 型 | フィールド追加・削除・rename なし |
| `AdminMemberDetailView` interface | 同上 | 同上 |
| `AttendanceProvider` interface | `apps/api/src/repository/attendance.ts` | 変更なし（参照のみ） |
| HTTP response shape | `GET /me/profile` / `GET /admin/members/:mid` | 既存テストの snapshot / assertion が PASS |

## 9.4 完了条件

- 9.1 不変条件チェックリスト全 PASS
- 9.2 grep gate G1〜G5 全 PASS（マッチなし）
- 9.3 契約整合性 全 PASS
- 検査結果を `outputs/phase-09/invariants-report.md` に保存（任意だが推奨）
