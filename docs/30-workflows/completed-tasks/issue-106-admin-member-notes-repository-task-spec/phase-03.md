# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 判定対象 | Phase 1-2 設計 |

## 目的

Phase 1-2 の設計をレビューし、Phase 4 以降に進めるかを GO / NO-GO で判定する。

## 実行タスク

1. Issue 元指示と現行正本の差分を確認する。
2. `adminNotes.ts` と `buildAdminMemberDetailView()` の依存方向を確認する。
3. simpler alternative を検討する。
4. Phase 4 開始条件と Phase 13 blocked 条件を確定する。

## 参照資料

- `docs/30-workflows/completed-tasks/UT-02A-ADMIN-MEMBER-NOTES-REPOSITORY.md`
- `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/`
- `apps/api/src/repository/adminNotes.ts`
- `apps/api/src/repository/_shared/builder.ts`

## 実行手順

1. `adminNotes` を builder 内から直接取得する案を却下する。不変条件 #12 のため、builder は引数受け取りを維持する。
2. `adminMemberNotes.ts` を新設する案は、現行 `adminNotes.ts` と重複する場合は却下する。
3. `adminNotes.ts` を public/member route から import する案を却下する。
4. 04c route 側 adapter で audit DTO へ変換する案を採用候補とする。
5. 現行 route が `audit_log` を builder audit に渡している場合、`admin_member_notes` を同じ `audit` field に混ぜる案は NO-GO とする。

## 統合テスト連携

Phase 3 ではテストは実行しない。Phase 4 の test matrix にレビュー指摘を反映する。

## 多角的チェック観点（AIが判断）

| 観点 | 判定 |
| --- | --- |
| 単一責務 | repository は DB row 取得、builder は view 組み立て |
| 情報漏洩 | admin note は public/member view に出さない |
| 重複回避 | 既存 `adminNotes.ts` があれば新設しない |
| 下流互換 | 04c route が adapter で利用可能 |
| audit 分離 | audit_log と admin_member_notes の用途を混同しない |

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P3-1 | alternative review | 採用/却下理由が明記 |
| P3-2 | gate 判定 | GO/NO-GO 条件が明記 |
| P3-3 | Phase 4 連携 | test matrix 入力が確定 |

## 成果物

- gate-decision.md 相当の判定
- alternative review
- Phase 4 開始条件

## 完了条件

- [ ] GO 条件: Phase 1-2 の未確定事項がない。
- [ ] NO-GO 条件: DB 列不明、既存実装重複、非混入検証不能、audit_log と admin_member_notes の混同のいずれか。
- [ ] Phase 13 はユーザー承認なしで commit / PR しないと明記されている。

## タスク100%実行確認【必須】

- [ ] simpler alternative を検討済み。
- [ ] Phase 4 へ進む前提が明確。

## 次Phase

Phase 4: テスト戦略。
