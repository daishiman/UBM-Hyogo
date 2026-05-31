# Phase 9: 品質保証

> **[実装区分: 実装仕様書]**。Phase 8 完了後、実装全体に対して一括品質ゲートを実行する。各 grep gate・静的解析・ビルドのコマンドと PASS 基準を明記する。1 つでも FAIL があれば修正してから次 Phase に進む。

## QA-001 — R2/D1 直アクセス分離ゲート（AC-7）

**目的**: `apps/web` 側のコードが R2 binding・D1 binding・`member_photos` テーブル名・`MEMBER_PHOTOS` env 変数に直接アクセスしていないことを確認する。`<img src={photoUrl}>` のような URL 文字列の受け渡しのみが許可される。

```bash
grep -rn "photoUrl\|R2\|MEMBER_PHOTOS\|member_photos\|R2Bucket" apps/web/src
```

**PASS 基準**:
- `photoUrl` のヒット: `<img src={photoUrl}>`・`photoUrl?` prop 参照・`AdminMemberDetailView.photoUrl` 型参照のみ。R2/D1 操作コード（`put`・`delete`・`getMemberPhoto` 等）が `apps/web/src` に存在しない。
- `R2`・`MEMBER_PHOTOS`・`R2Bucket`: ヒット 0 件。
- `member_photos`: ヒット 0 件。

**FAIL 時の対処**: `apps/web/src` に R2/D1 直アクセスが混入している場合、該当ファイルを `apps/api` へ移行し `apps/web` からは API fetch 経由に修正する。

---

## QA-002 — OKLch token 遵守ゲート（不変条件 #4）

**目的**: avatar 周りの新規 CSS に HEX 直書き・Tailwind の任意値ブラケット記法（`bg-[#...]`/`text-[#...]`）が使われていないことを確認する。

```bash
grep -rn 'bg-\[#\|text-\[#\|bg-\[color\|fill-\[#\|border-\[#' \
  apps/web/src/components/ui/Avatar.tsx \
  apps/web/src/features/admin/components/_members/MemberAvatar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx
```

**PASS 基準**: ヒット 0 件。

```bash
grep -rn '#[0-9a-fA-F]\{3,6\}' \
  apps/web/src/components/ui/Avatar.tsx \
  apps/web/src/features/admin/components/_members/MemberAvatar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx
```

**PASS 基準**: ヒット 0 件（HEX リテラルが存在しない）。

**FAIL 時の対処**: `apps/web/src/styles/tokens.css` に定義された OKLch token 変数（`var(--color-*)` 等）または Tailwind 設定の semantic class に置き換える。

---

## QA-003 — `*.test.*` ファイル不在ゲート（不変条件 #8）

**目的**: 新規追加・編集されたファイルに `*.test.ts` / `*.test.tsx` が含まれていないことを確認する。

```bash
find apps/api/src/lib/r2 apps/api/src/repository apps/api/src/routes/admin \
     apps/web/src/components/ui apps/web/src/features/admin/components/_members \
     apps/web/tests \
  -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null
```

**PASS 基準**: 出力 0 件（ヒット無し）。

**FAIL 時の対処**: 該当ファイルを `*.spec.ts` / `*.spec.tsx` に改名し、import パス・vitest 設定を確認する。

---

## QA-004 — `AdminMemberDetailViewZ` の `.strict()` 回帰ゲート（不変条件 #3）

**目的**: `packages/shared/src/zod/viewmodel.ts` の `AdminMemberDetailViewZ` が `.strict()` を維持していることを確認する。

```bash
grep -A 5 "AdminMemberDetailViewZ" packages/shared/src/zod/viewmodel.ts \
  | grep "strict()"
```

**PASS 基準**: 出力に `.strict()` が含まれる（1 行以上ヒット）。

```bash
grep -n "photoUrl" packages/shared/src/zod/viewmodel.ts
```

**PASS 基準**: `photoUrl: z.string().url().optional()` が存在し、`z.string()` のみ（url validator 無し）や必須フィールド（`.optional()` 無し）でないことを確認する。

**FAIL 時の対処**: `.strict()` が削除されている場合は追記する。`photoUrl` が必須化されている場合は `.optional()` を付与する。

---

## QA-005 — `useAdminMutation` 経由ゲート（不変条件 #10）

**目的**: MemberDrawer の photo upload/delete が `@/features/admin/hooks/useAdminMutation` 経由であり、`fetch()`・`axios`・`useSWRMutation` 等の直書きが無いことを確認する。

```bash
grep -n "fetch(\|useSWRMutation\|axios\|useMutation" \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx
```

**PASS 基準**: ヒット 0 件（`useAdminMutation` 以外の mutation 呼び出しが存在しない）。

```bash
grep -n "useAdminMutation" \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx
```

**PASS 基準**: 1 件以上ヒット（`useAdminMutation` が実際に使用されている）。

**FAIL 時の対処**: `@/features/admin/hooks/useAdminMutation` に移行する。旧 `@/lib/useAdminMutation` への参照も新規追加禁止（CLAUDE.md 不変条件 #10）。

---

## QA-006 — bucket public list 禁止の設計整合ゲート（AC-5）

**目的**: R2 bucket への GET アクセスが presigned URL のみであり、`wrangler.toml` に `public_access = true` が設定されていないことを確認する。

```bash
grep -n "public_access\|public_read\|public_url" apps/api/wrangler.toml
```

**PASS 基準**: ヒット 0 件（`public_access = true` が存在しない）。

```bash
grep -A 5 "MEMBER_PHOTOS" apps/api/wrangler.toml
```

**PASS 基準**: `binding = "MEMBER_PHOTOS"` と `bucket_name` の記述があり、`public_access` 設定が存在しない。

**FAIL 時の対処**: `public_access = true` が設定されている場合は削除する。bucket の presign 設計（Phase 2 §3）に戻る。

---

## QA-007 — TypeScript 型チェック全 workspace

```bash
mise exec -- pnpm typecheck
```

**PASS 基準**: 全 workspace（`@ubm-hyogo/api`・`@ubm-hyogo/web`・`@ubm-hyogo/shared`）でエラー 0 件。

**FAIL 時の対処**: エラーメッセージを確認し、unused import・null 許容漏れ・型注釈不整合を最小差分で修正する。`.strict()` 由来の型エラーは schema 変更（photoUrl optional 追加）が正しく型に伝播しているか確認する。

---

## QA-008 — Lint 全 workspace

```bash
mise exec -- pnpm lint
```

**PASS 基準**: エラー 0 件（warning は許容するが、photo 関連の新規ファイルでは warning も 0 件を目標）。

**FAIL 時の対処**:
1. まず `pnpm lint --fix` を試みる。
2. 自動修正で解消しない違反のみ手動修正する。
3. `lint-boundaries` の `globalThis.localStorage` substring 検出（MEMORY.md L-USS-003b）に該当する場合は `safe-local-storage` util 経由に修正する。

---

## QA-009 — Build 成功ゲート

```bash
mise exec -- pnpm build
```

**PASS 基準**: `apps/api` および `apps/web`（OpenNext Workers 互換ビルド）がエラーなく完了。

**FAIL 時の対処**: ビルドエラーログを確認し、Cloudflare Workers 互換制約（Node.js API 使用禁止・dynamic import 等）を確認する。`@opennextjs/cloudflare` の Turbopack 非対応制約（CLAUDE.md）に引っかかる場合は webpack モードで実行されているか確認する。

---

## QA-010 — unit test 全 PASS

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:unit
mise exec -- pnpm --filter @ubm-hyogo/web test:unit
```

**PASS 基準**: 新規追加テストを含む全 spec が PASS。

対象テスト（Phase 1 artifact 一覧より）:
- `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts`（presign unit）
- `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts`（route contract）
- `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx`（avatar render）

**FAIL 時の対処**: 失敗テストのエラーを確認し、実装との不整合を修正する。テストの期待値を緩める方向への変更は禁止（実装を修正して PASS させる）。

---

## QA まとめ判定表

実施後に以下のチェックリストを埋める。

| Gate ID | コマンド | PASS/FAIL | 備考 |
|---------|---------|-----------|------|
| QA-001 | `grep -rn "photoUrl\|R2\|MEMBER_PHOTOS\|member_photos\|R2Bucket" apps/web/src` | — | AC-7 |
| QA-002 | HEX/bracket grep | — | OKLch token |
| QA-003 | `find ... -name "*.test.*"` | — | invariant #8 |
| QA-004 | `.strict()` / `photoUrl optional` grep | — | invariant #3 |
| QA-005 | `useAdminMutation` 経由 grep | — | invariant #10 |
| QA-006 | `public_access` grep | — | AC-5 |
| QA-007 | `pnpm typecheck` | — | 全 ws |
| QA-008 | `pnpm lint` | — | 全 ws |
| QA-009 | `pnpm build` | — | api + web |
| QA-010 | `pnpm test:unit` | — | api + web |

---

## 完了条件（Phase 9）

- [ ] QA-001〜QA-010 の全 gate が PASS（または PASS になるまで修正済み）
- [ ] 各 gate の実行結果が上記の判定表に記録されている
- [ ] FAIL 修正により新たなテスト失敗が発生していない（修正の副作用なし）
- [ ] `*.test.{ts,tsx}` ファイルが追加されていない（QA-003 で確認済み）

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装差分が不変条件、型、lint、build、unit tests を満たすことを確認する。

## 実行タスク
- grep gate と workspace test/build gate を実行する。
- FAIL があれば同一サイクルで修正する。

## 参照資料
- `phase-8.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物
- Phase 9 QA 仕様

## 統合テスト連携
Phase 10 の AC 判定は本 Phase の gate 結果を根拠にする。
