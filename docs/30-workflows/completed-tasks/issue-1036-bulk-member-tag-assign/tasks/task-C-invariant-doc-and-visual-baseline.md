# task-C: 不変条件 #13 第3経路 再定義 + visual baseline 整合

| 項目 | 内容 |
|------|------|
| 領域 | docs（+ コード先頭コメント） |
| 依存 | task-A, task-B |
| AC | AC-3/AC-6 の整合担保（不変条件側） |
| 実装区分 | docs 中心（コードコメント変更を含む） |

## 変更対象ファイル

| パス | 種別 | 内容 |
|------|------|------|
| `apps/api/src/repository/memberTags.ts`（先頭コメント） | 編集 | 不変条件 #13 に「第3経路: bulk admin manual write」を追記 |
| `CLAUDE.md`（不変条件 #13 記述があれば） | 編集（条件付き） | 第3経路の整合（無ければ memberTags.ts のみ） |
| `outputs/phase-11/screenshots/` | 新規 | bulk tag セクションの visual baseline（実行時 user-gated） |

## 不変条件 #13 追記内容（案）

```
// 不変条件 #13（2026-06 第3経路追加 / issue-1036）:
//   - 第1経路: AI / Google Form 由来の tag 提案 → tagQueueResolve workflow の
//     assignTagsToMember（workflow 専用）。
//   - 第2経路: 管理者の単一 member 手動付与/解除 → assignTagToMemberByAdmin /
//     unassignTagFromMemberByAdmin。
//   - 第3経路: 管理者の bulk（複数 member × 複数 tag）手動付与/解除 →
//     bulkApplyMemberTagsByAdmin。実 mutation した member×tag 単位で必ず audit
//     （admin.member.tag_assigned / tag_unassigned・既存 action 名 parity）を記録し、
//     after_json/before_json に batchId を埋めて bulk 相関を残す。
//   - member_tags への直接 write は上記 3 経路に限る。新規 write 経路を生やす場合は
//     不変条件 #13 自体の変更レビューと type-level gate（memberTags.readonly.test-d.ts）
//     allow list 更新を経ること。
```

## DoD

- [ ] memberTags.ts 先頭コメントが第3経路を含む
- [ ] type-level gate allow list と #13 コメントが整合
- [ ] CLAUDE.md に #13 記述がある場合は整合（無ければ N/A 明記）
- [ ] Phase 11 で visual baseline canonical 名取得（実行時 user-gated）
