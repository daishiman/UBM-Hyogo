# Phase 9: 品質保証

> **[実装区分: 実装仕様書]**。Phase 8 完了後、実装全体に対して一括品質ゲートを実行する。各 grep gate・静的解析・ビルドのコマンドと PASS 基準を明記する。1 つでも FAIL があれば修正してから次 Phase に進む。

## QA-001 — D1/R2 直接アクセス分離ゲート（不変条件 #5）

**目的**: `apps/web` 側のコードが R2 binding・D1 binding・`member_photos` テーブル名・`MEMBER_PHOTOS` env 変数に直接アクセスしていないことを確認する。`<img src={photoUrl}>` のような URL 文字列の受け渡し、および proxy route の fetch 転送のみが許可される。

```bash
grep -rn "MEMBER_PHOTOS\|R2Bucket\|member_photos\|R2\b" apps/web/src
```

**PASS 基準**:
- `MEMBER_PHOTOS`・`R2Bucket`・`member_photos`・`R2`（単語境界）: ヒット 0 件。
- `photoUrl` は `<Avatar src={photoUrl}>`・`photoUrl?` prop・型参照のみ許容。

```bash
grep -rn "getMemberPhoto\|upsertMemberPhoto\|deleteMemberPhoto" apps/web/src apps/web/app
```

**PASS 基準**: ヒット 0 件（`apps/web` に repository 関数の直接呼び出しが存在しない）。

**FAIL 時の対処**: `apps/web` に R2/D1 直アクセスが混入している場合、該当コードを `apps/api` の me route へ移動し、`apps/web` からは proxy 経由に修正する。

---

## QA-002 — OKLch token 遵守ゲート（不変条件 #8 色制約）

**目的**: `PhotoUpload.client.tsx` 等の新規 CSS に HEX 直書き・Tailwind の任意値ブラケット記法（`bg-[#...]`/`text-[#...]`）が使われていないことを確認する。

```bash
grep -rn 'bg-\[#\|text-\[#\|fill-\[#\|border-\[#\|bg-\[color' \
  "apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx" \
  apps/web/app/api/me/photo/route.ts \
  apps/web/src/lib/api/me-photo-client.ts
```

**PASS 基準**: ヒット 0 件。

```bash
grep -rn '#[0-9a-fA-F]\{3,6\}' \
  "apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx" \
  apps/web/app/api/me/photo/route.ts \
  apps/web/src/lib/api/me-photo-client.ts
```

**PASS 基準**: ヒット 0 件（HEX リテラルが存在しない）。

**FAIL 時の対処**: `apps/web/src/styles/tokens.css` に定義された OKLch token 変数（`var(--color-*)` 等）または Tailwind 設定の semantic class に置き換える。

---

## QA-003 — `*.test.*` ファイル不在ゲート（不変条件 #9）

**目的**: 新規追加・編集されたファイルに `*.test.ts` / `*.test.tsx` が含まれていないことを確認する。

```bash
find apps/api/src/routes/me apps/api/src/repository \
     "apps/web/app/(member)/profile" apps/web/app/api/me \
     apps/web/src/lib/api \
  -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null
```

**PASS 基準**: 出力 0 件（ヒット無し）。

**FAIL 時の対処**: 該当ファイルを `*.spec.ts` / `*.spec.tsx` に改名し、import パス・vitest 設定を確認する（lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` が reject するため、CI 前に必ず解消する）。

---

## QA-004 — 新規 primitive 不在ゲート（不変条件 #8 コンポーネント制約）

**目的**: `PhotoUpload.client.tsx` が既存の `Avatar`・`Button`・`Modal` を再利用しており、`apps/web/src/components/ui/` に新規 primitive が追加されていないことを確認する。

```bash
# 本タスクの変更差分に apps/web/src/components/ui/ の新規ファイルが含まれないことを確認
git diff --name-only dev...HEAD | grep "apps/web/src/components/ui/"
```

**PASS 基準**: 出力 0 件（既存 `Avatar.tsx` の編集は許容するが、新規 `.tsx` ファイルの追加はヒットしてはならない）。

```bash
# Avatar が src prop 対応で呼び出されていることを確認
grep -n "Avatar" "apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx"
```

**PASS 基準**: `Avatar` の import と使用がヒット（既存 primitive を使用している）。

**FAIL 時の対処**: `apps/web/src/components/ui/` に新規ファイルが追加されている場合は、`PhotoUpload.client.tsx` 内のインライン実装に吸収するか、既存の primitive を拡張する。

---

## QA-005 — admin mutation hook 経由ゲート（不変条件 #10）

**目的**: `PhotoUpload.client.tsx` が admin mutation hook（`useAdminMutation`）を使っていないことを確認する。本コンポーネントは **member self-service** であり、admin mutation hook の新規参照を増やしてはならない。代わりに `me-photo-client.ts` を直接呼び出す設計。

```bash
grep -n "useAdminMutation\|@/features/admin/hooks\|@/lib/useAdminMutation" \
  "apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx" \
  apps/web/src/lib/api/me-photo-client.ts \
  apps/web/app/api/me/photo/route.ts
```

**PASS 基準**: ヒット 0 件（`PhotoUpload` / me-photo-client は admin mutation hook を使わない）。

**補足確認**: `apps/web/src/features/admin/` 配下のコンポーネントが admin photo mutation に `useAdminMutation` を使っていること（既存 #983 実装の回帰なし）を念のため確認する。

```bash
grep -n "useAdminMutation" apps/web/src/features/admin/components/_members/MemberDrawer.tsx 2>/dev/null
```

**PASS 基準**: 1 件以上ヒット（admin 側は `useAdminMutation` 経由を維持している）。

**FAIL 時の対処**: `PhotoUpload` に `useAdminMutation` が混入している場合は `me-photo-client.ts` の呼び出しに修正する。legacy `@/lib/useAdminMutation` への新規参照は禁止（CLAUDE.md 不変条件 #10）。

---

## QA-006 — invariant #11 遵守ゲート（`/me` route に memberId 不在）

**目的**: `POST /me/photo` / `DELETE /me/photo` の route 定義に `:memberId` パラメータが含まれていないことを確認する（Phase 2 §2.2 / 不変条件 #11）。

```bash
grep -n "memberId\|:member\|param.*member" apps/api/src/routes/me/index.ts
```

**PASS 基準**: `:memberId` を含む route 定義がヒットしない。`c.get("user").memberId` または `user.memberId` の参照はヒットしてよい（path パラメータではなく session 由来）。

**FAIL 時の対処**: `app.post("/me/photo/:memberId", ...)` のような route が存在する場合は `:memberId` を除去し、`c.get("user").memberId` で解決する設計に修正する。

---

## QA-007 — `source` 値域ゲート（"admin" | "self" の型安全性）

**目的**: `MemberPhotoRow.source` と `upsertMemberPhoto` の `source` 引数が `"admin" | "self"` の union 型を維持しており、`string` 型に緩和されていないことを確認する。

```bash
grep -n "source" apps/api/src/repository/memberPhotos.ts
```

**PASS 基準**: `source: "admin" | "self"` が型定義にヒット。`source: string` のみのヒットは FAIL。

```bash
grep -n "source.*admin\|source.*self" apps/api/src/routes/admin/members.ts apps/api/src/routes/me/index.ts
```

**PASS 基準**: admin route に `source: "admin"`、me route に `source: "self"` がそれぞれヒット。

**FAIL 時の対処**: `source: string` に緩和されている場合は `"admin" | "self"` union 型に戻す。TypeScript の strict check で型安全性を維持する。

---

## QA-008 — TypeScript 型チェック全 workspace

```bash
mise exec -- pnpm typecheck
```

**PASS 基準**: 全 workspace（`@ubm-hyogo/api`・`@ubm-hyogo/web`・`@ubm-hyogo/shared`）でエラー 0 件。

**FAIL 時の対処**: エラーメッセージを確認し、unused import・null 許容漏れ・型注釈不整合を最小差分で修正する。`MeProfileResponseZ.photoUrl?` の `.optional()` 由来の型エラーは `MeProfileResponse` 型への反映漏れを確認する。

---

## QA-009 — Lint 全 workspace

```bash
mise exec -- pnpm lint
```

**PASS 基準**: エラー 0 件（warning は許容するが、me/photo 関連の新規ファイルでは warning も 0 件を目標）。

**FAIL 時の対処**:
1. まず `pnpm lint --fix` を試みる。
2. 自動修正で解消しない違反のみ手動修正する。
3. `no-restricted-globals` の `document.getElementById` 等の Direct DOM アクセスは `isBrowser()` ガードまたは `useRef` + `scoped disable` で回避する（L-I1006-001 踏襲）。
4. me route の `c.env` 参照で `any` 型残留がある場合は `MeRouteEnv` 型を明示する。

---

## QA-010 — Build 成功ゲート

```bash
mise exec -- pnpm build
```

**PASS 基準**: `apps/api` および `apps/web`（OpenNext Workers 互換ビルド）がエラーなく完了。

**FAIL 時の対処**: ビルドエラーログを確認し、Cloudflare Workers 互換制約（Node.js API 使用禁止・dynamic import 等）を確認する。`PhotoUpload.client.tsx` で `"use client"` ディレクティブが先頭にあることを確認する。proxy route が Edge Runtime 対応であることを確認する。

---

## QA-011 — unit test 全 PASS

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:unit
mise exec -- pnpm --filter @ubm-hyogo/web test:unit
```

**PASS 基準**: 新規追加テストを含む全 spec が PASS。

対象テスト（Phase 1 §1.5 artifact 一覧より）:
- `apps/api/src/routes/me/__tests__/photo.route.spec.ts`（me photo route contract）
- `apps/api/src/repository/__tests__/memberPhotos.source.spec.ts`（source roundtrip）
- `apps/web/app/api/me/photo/route.spec.ts`（proxy route）
- `apps/web/app/(member)/profile/_components/PhotoUpload.client.component.spec.tsx`（UI 状態機械）

**FAIL 時の対処**: 失敗テストのエラーを確認し、実装との不整合を修正する。テストの期待値を緩める方向への変更は禁止（実装を修正して PASS させる）。

---

## QA まとめ判定表

実施後に以下のチェックリストを埋める。

| Gate ID | コマンド / 観点 | PASS/FAIL | 備考 |
|---------|------|------|------|
| QA-001 | D1/R2 直アクセス + repo 関数混入 grep | — | 不変条件 #5 |
| QA-002 | HEX / bracket color grep | — | OKLch token |
| QA-003 | `find ... -name "*.test.*"` | — | 不変条件 #9 |
| QA-004 | 新規 primitive 不在 git diff | — | 不変条件 #8 |
| QA-005 | `useAdminMutation` 非参照（me side）/ 参照（admin side） grep | — | 不変条件 #10 |
| QA-006 | `/me` route に `:memberId` 不在 grep | — | 不変条件 #11 |
| QA-007 | `source` 値域 union 型 grep | — | "admin" \| "self" |
| QA-008 | `pnpm typecheck` | — | 全 ws |
| QA-009 | `pnpm lint` | — | 全 ws |
| QA-010 | `pnpm build` | — | api + web |
| QA-011 | `pnpm test:unit` | — | api + web |

---

## 完了条件（Phase 9）

- [ ] QA-001〜QA-011 の全 gate が PASS（または PASS になるまで修正済み）
- [ ] 各 gate の実行結果が上記の判定表に記録されている
- [ ] FAIL 修正により新たなテスト失敗が発生していない（修正の副作用なし）
- [ ] `*.test.{ts,tsx}` ファイルが追加されていない（QA-003 で確認済み）
- [ ] `apps/web` に D1/R2 直アクセスが混入していない（QA-001 で確認済み）

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
実装差分が不変条件（#5/#8/#9/#10/#11）、型、lint、build、unit tests をすべて満たすことを確認する。

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
