# Implementation Guide — issue-981-admin-members-table-list-enrichment

## Part 1: 中学生レベルの説明

会員一覧の表には、すでにサーバーから「職業」「所属区画」「会員種別」「タグ」が届いていました。問題は、表がそれを見せずに空欄のように扱っていたことです。

今回の修正では、届いている情報をそのまま表に表示しました。新しい保存先や新しいAPIは作っていません。すでにある部品を使って、見えるようにしただけです。

## Part 2: 技術者向け

### Code

- `apps/web/src/features/admin/components/_members/MembersTable.tsx`
  - `Chip` / `zoneTone` / `statusTone` を import
  - occupation を氏名下に条件付き描画
  - `ubmZone` と `ubmMembershipType` を「区画 / ステータス」列に条件付き chip 描画
  - `tags` を最大2件 + `+N` で表示し、空配列/undefined は `未タグ` warning chip に fallback

### Tests

- `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`
  - `mkMember` に `Partial<Member>` overrides を追加
  - TC-MT-06〜13: occupation / undefined guard / zone / membership type / tag max2 + `+N` / empty tag / enrichment a11y の assertions を追加
  - TC-MT-14〜20: zone/type 部分欠損、tag 2/3 件境界、occupation falsy、publishState 共存、混在行 a11y の assertions を追加

### Phase 11 Screenshots

- `outputs/phase-11/screenshots/admin-members-table-enriched.png`
  - occupation / zone chip / membership type chip / tag pill + `+N` を確認
- `outputs/phase-11/screenshots/admin-members-table-untagged.png`
  - tags 空/undefined の `未タグ` warning chip を確認
- `outputs/phase-11/screenshot-plan.json`
  - screenshot 名と state の対応を固定

### Boundary

- `apps/api` 変更なし
- `packages/shared` 変更なし
- `MembersTableProps` 変更なし
- list tag pill は read-only のまま
