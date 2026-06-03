# Phase 9: 品質保証 — issue-1036-bulk-member-tag-assign

> 実装区分: 実装仕様書 / VISUAL_ON_EXECUTION / implementation_mode: new
> 前 Phase: [phase-8-refactor.md](phase-8-refactor.md) / 次 Phase: [phase-10-final-review.md](phase-10-final-review.md)
> **本書は Gate-B の evidence として機能する（artifacts.json の Gate-B `evidence_path` が本ファイル）。**

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 目的 | typecheck / lint / 全関連 test / OKLch トークン gate / 既存 regression / type-level gate / 不変条件 を一括判定し DoD の証跡とする |
| 前提 | 「ファイル削除なし」（新規追加 + 編集のみ）。`apps/api` と `apps/web` の両 package を検証 |

---

## 9-1. 実行コマンドと判定基準

### Step 0: 依存インストール（ワークツリー起動後は必ず実行）

```bash
mise exec -- pnpm install
```

期待: エラーなし。

---

### Step 1: 型チェック（apps/api + apps/web）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

| 結果 | 判定 |
|------|------|
| 両 package で `Found 0 errors.` / exit 0 | PASS |
| 任意の型エラー | FAIL → Phase 5 に差し戻して修正 |

---

### Step 2: リント

```bash
mise exec -- pnpm lint
```

| 結果 | 判定 |
|------|------|
| exit 0 | PASS |
| ESLint エラー | FAIL → `pnpm lint --fix` で自動修正 → 残違反を手修正して再実行 |

> `apps/web` の lint は `tsc --noEmit && eslint 'src/**/*.{ts,tsx}'` を含む。`<input>` 直書き禁止
> （不変条件 #9）・`no-restricted-globals` 等の規約違反もここで検出する。

---

### Step 3: type-level write gate（不変条件 #13 機械強制）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test memberTags.readonly.test-d.ts
```

| 結果 | 判定 |
|------|------|
| `bulkApplyMemberTagsByAdmin` が allow list に明示参照され gate PASS | PASS |
| gate FAIL（write keyword 抵触 / allow list 漏れ） | FAIL → test-d.ts と #13 コメントを整合させて再実行 |

> 本 gate が「第3経路（bulk admin write）」を機械的に固定する。`memberTags.readonly.test-d.ts` の
> allow list と `memberTags.ts` 先頭コメント（task-C）が整合していることをここで保証する。

---

### Step 4: bulk 新規 test（apps/api）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test members-tags-bulk.contract.spec.ts memberTags.bulk.repository.spec.ts
```

| 結果 | 判定 |
|------|------|
| contract / repository 全件 PASS（5 status 分岐 + AC-1〜AC-5 の TC 含む） | PASS |
| 1 件でも FAIL | FAIL → 実装 / テストを修正して再実行 |

確認すべき AC マッピング:

| AC | TC で確認する内容 |
|----|-------------------|
| AC-1 | 複数 memberId × 複数 tagId を op=assign / unassign で一括処理 |
| AC-2 | results の status ∈ assigned/unassigned/noop/skipped_deleted/tag_not_found |
| AC-3 | 実 mutation した member×tag 単位で audit_log 行数が一致（既存 action 名 parity） |
| AC-4 | 削除済み / 不在 member は skipped_deleted、他 member は継続 |
| AC-5 | 同一 bulk 再送で既成功分は noop、audit が増えない |

---

### Step 5: bulk UI component test（apps/web）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test BulkActionBar.spec.tsx
```

| 結果 | 判定 |
|------|------|
| tag picker / op 切替 / 実行 disabled 条件 / 結果集計 / 部分失敗リスト の TC 全 PASS（AC-7） | PASS |
| 1 件でも FAIL | FAIL → 実装 / テストを修正 |

---

### Step 6: 既存 regression（AC-6）

```bash
# 単一 endpoint contract（既存 tag write 経路に回帰がないこと）
mise exec -- pnpm --filter @ubm-hyogo/api test members.tags.contract.spec.ts
# 既存 BulkActionBar 3 アクション（publish/hide/soft-delete）に回帰がないこと
mise exec -- pnpm --filter @ubm-hyogo/web test BulkActionBar.spec.tsx
```

| 結果 | 判定 |
|------|------|
| 既存 `members.tags.contract.spec.ts` 全 green + 既存 publish/hide/soft-delete アクション TC 全 green | PASS |
| 既存 spec の 1 件でも FAIL | FAIL → bulk 追加が既存契約を破壊。別 path / 別 helper の分離を確認して修正 |

---

### Step 7: OKLch トークン gate（task-18 / verify-design-tokens）

```bash
# CI gate verify-design-tokens 相当のローカル検証
mise exec -- pnpm verify:design-tokens
```

> 上記 script 名が無い場合は CI workflow `.github/workflows/verify-design-tokens.yml` が呼ぶ
> 検証スクリプトを直接実行する。最低限の手動 gate として以下を確認する:

```bash
# BulkActionBar の新規 UI に HEX 直書き / 任意色クラスが無いこと（0 件が PASS）
grep -nE '#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#|border-\[#' \
  apps/web/src/features/admin/components/_members/BulkActionBar.tsx
```

| 結果 | 判定 |
|------|------|
| HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件（OKLch トークンのみ） | PASS |
| 1 件でもマッチ | FAIL → `apps/web/src/styles/tokens.css` のトークン参照へ置換 |

---

## 9-2. 不変条件 最終チェックリスト

| # | 不変条件 | 確認方法 | 判定 |
|---|----------|----------|------|
| #5 | D1 直接アクセスは apps/api に閉じる | bulk write は `bulkApplyMemberTagsByAdmin`（apps/api repository）。`grep -rn "env.DB\|D1Database" apps/web/src` が bulk 由来で 0 件 | ☐ |
| #9 | admin form input は FormField 経由 | bulk tag picker は `TagPill` / `Button` / `Switch` を利用。`apps/web/src/components/admin/` 配下で `<input>` を直接増やしていない | ☐ |
| #10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | bulk 実行が `useAdminMutation` 経由。`grep -rn "@/lib/useAdminMutation" apps/web/src/features/admin/components/_members/BulkActionBar.tsx` が 0 件 | ☐ |
| #13 | member_tags write は限定経路（第3経路として bulk を追加） | `memberTags.ts` 先頭コメントに第3経路記述あり + `memberTags.readonly.test-d.ts` allow list に `bulkApplyMemberTagsByAdmin` 明示参照（Step 3 PASS） | ☐ |

---

## 9-3. 一括判定フロー

```
Step0 install → Step1 typecheck(api+web) → Step2 lint → Step3 type gate → Step4 bulk test
   → Step5 UI test → Step6 regression → Step7 tokens gate → 9-2 不変条件チェック
        ↓ 各 OK?
       YES → 全 PASS で Gate-B 証跡成立 → Phase 10 へ
        NO → 該当 Phase（5 実装 / 4 テスト）へ差し戻し、修正後に当該 Step から再実行
```

---

## 9-4. 検証コマンド一覧（コピー用）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test memberTags.readonly.test-d.ts
mise exec -- pnpm --filter @ubm-hyogo/api test members-tags-bulk.contract.spec.ts memberTags.bulk.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test BulkActionBar.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/api test members.tags.contract.spec.ts
mise exec -- pnpm verify:design-tokens
```

---

## 9-5. DoD（Gate-B 証跡）

- [ ] `pnpm --filter @ubm-hyogo/api typecheck` / `pnpm --filter @ubm-hyogo/web typecheck`: 両 exit 0
- [ ] `pnpm lint`: exit 0
- [ ] type-level write gate（memberTags.readonly.test-d.ts）green
- [ ] bulk contract / repository test 全 green（AC-1〜AC-5 マッピング確認）
- [ ] BulkActionBar component test 全 green（AC-7）
- [ ] 既存 `members.tags.contract.spec.ts` + 既存 BulkActionBar 3 アクション regression 無し（AC-6）
- [ ] OKLch トークン gate（verify-design-tokens）green / HEX 直書き 0 件
- [ ] 不変条件 #5 / #9 / #10 / #13 チェックリスト 全 ☑
