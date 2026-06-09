# Phase 9: 品質保証

> **[実装区分: 実装仕様書]**。Phase 8 完了後、実装全体に対して一括品質ゲートを実行する。web 文脈の QA（typecheck / lint / verify-design-tokens / targeted vitest / 不変条件 grep gate）の各コマンドと PASS 基準を明記する。1 つでも FAIL があれば差し戻し先 Phase へ戻して修正してから次 Phase に進む。

---

## QA-001 — D1 直接アクセス分離ゲート（不変条件 #2 / #5）

**目的**: `apps/web` 側のコードが D1 binding・テーブル名・SQL に直接アクセスしていないことを確認する。公開メンバー詳細のデータは `fetchPublicOrNotFound`（`GET /public/members/:memberId`）経由のみ。adapter は受け取った JSON を整形するだけ。

```bash
grep -rn "D1Database\|\.prepare(\|DB\.\|response_fields\|member_responses\|env\.DB" apps/web/src/lib/adapters apps/web/src/components/public
```

**PASS 基準**: ヒット 0 件（adapter / public component に D1 直アクセスが存在しない）。

**FAIL 時の対処**: D1 直アクセスが混入している場合、該当ロジックを `apps/api` 側へ戻し、`apps/web` は API レスポンスの整形のみに修正する。→ 差し戻し先: **Phase 5（実装）**。

---

## QA-002 — API endpoint 追加 0 ゲート（不変条件 #1）

**目的**: 公開メンバー詳細のために新しい API endpoint・レスポンス契約変更が発生していないことを確認する。利用は既存 `GET /public/members/:memberId` のみ。

```bash
git diff --name-only dev...HEAD | grep -E "apps/api/src/routes/|apps/api/migrations/" || echo "API/migration 変更なし"
```

**PASS 基準**: `apps/api/src/routes/` / `apps/api/migrations/` に変更ファイルが含まれない（出力が「API/migration 変更なし」）。Lane B の変更は `apps/api/src/testing/test-accounts/` 配下に限定されること。

```bash
git diff --name-only dev...HEAD | grep "apps/api/" | grep -v "apps/api/src/testing/test-accounts/" || echo "apps/api 変更は test-accounts に限定"
```

**PASS 基準**: 出力が「apps/api 変更は test-accounts に限定」（seed 以外の apps/api 変更が無い）。

**FAIL 時の対処**: route / migration 変更が混入している場合は撤回し、UI 側 adapter で対応する（API 既存 surface のみ利用）。→ 差し戻し先: **Phase 2（設計）**。

---

## QA-003 — verify-design-tokens（OKLch トークン遵守 / HEX 直書き 0）（不変条件 #3 / AC-10）

**目的**: 新規/変更 component・条件付き編集した globals.css に HEX 直書き・Tailwind 任意値ブラケット記法（`bg-[#...]` / `text-[#...]`）が無く、OKLch トークン正本（`tokens.css` の `var(--color-*)` / proto クラス）のみを使っていることを確認する。

### grep 一次確認（変更ファイル限定）

```bash
grep -rnE 'bg-\[#|text-\[#|fill-\[#|border-\[#|#[0-9a-fA-F]{3,6}\b' \
  apps/web/src/components/public/ProfileHero.tsx \
  apps/web/src/components/public/BusinessOverviewSection.tsx \
  apps/web/src/components/public/PersonalSection.tsx \
  apps/web/src/components/public/MessageCard.tsx \
  apps/web/src/components/public/MemberDetail.tsx \
  apps/web/src/components/public/MemberDetailSections.tsx \
  apps/web/src/components/public/MemberLinks.tsx
```

**PASS 基準**: ヒット 0 件（HEX リテラル・任意値カラーブラケットが存在しない）。

### CI gate 同等の実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens
```

**PASS 基準**: `apps/web/src/__tests__/tokens.runtime.spec.ts` が PASS（HEX 直書き 0・OKLch トークンのみ）。

**FAIL 時の対処**: HEX / ブラケットを `tokens.css` の OKLch トークン変数または proto 既存クラスに置換する。原則 CSS は追加しない。追加が必要なら globals.css 末尾に OKLch トークン参照で追加し既存ブロックを破壊しない。→ 差し戻し先: **Phase 5（実装）**。

---

## QA-004 — stableKey リテラル直書き 0 ゲート（不変条件 #6 / lint-stablekey-literal）

**目的**: adapter の振り分け定数・seed の profile キー・component の `data-stable-key` 参照が、`@ubm-hyogo/shared` の `STABLE_KEY` 定数経由であり、stableKey 文字列をリテラル直書きしていないことを確認する。

```bash
mise exec -- pnpm run lint:stablekey:strict
```

**PASS 基準**: `node scripts/lint-stablekey-literal.mjs --strict` がエラー 0 件で終了。

**補足 grep（変更ファイルの目視確認）**:

```bash
grep -n "STABLE_KEY\." apps/web/src/lib/adapters/member-detail.ts
```

**PASS 基準**: 振り分けキー集合（BUSINESS_KEYS / PERSONAL_KEYS / SUMMARY_KEYS / HERO_EXTRA_KEYS / MESSAGE_KEY）が `STABLE_KEY.<name>` 経由で構成されている（1 件以上ヒット）。

**FAIL 時の対処**: リテラル `"businessOverview"` 等の直書きを `STABLE_KEY.businessOverview` に置換する。Lane B の seed の profile キーも同様に STABLE_KEY 経由を検討（test-accounts は許可リストの確認）。→ 差し戻し先: **Phase 5（実装）**。

---

## QA-005 — visibility 二重防御ゲート（不変条件 #5 / AC-8）

**目的**: adapter が `visibility !== "public"` を除外しており、member/admin visibility 項目（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent / responseEmail）が公開ページに出ない二重防御を維持していることを確認する。

```bash
grep -n 'visibility' apps/web/src/lib/adapters/member-detail.ts
```

**PASS 基準**: `field.visibility !== "public"` の除外分岐がヒット（API 側 filter との二重防御を維持）。

```bash
grep -rn 'birthDate\|ubmJoinDate\|challenges\|responseEmail' apps/web/src/components/public
```

**PASS 基準**: 公開 component に member/admin 専用 stableKey の直接参照が無い（ヒット 0 件、または型/コメントのみ）。

**FAIL 時の対処**: adapter の visibility filter を復元する。non-public field が描画経路に乗っている場合は adapter で除外する。→ 差し戻し先: **Phase 5（実装）**。

---

## QA-006 — 新規 primitive 不在ゲート（不変条件 #4）

**目的**: 新規 component が `apps/web/src/components/ui/` に新規 primitive を追加しておらず、proto 既出の primitive と既存 globals.css クラスのみで構成されていることを確認する。

```bash
git diff --name-only dev...HEAD | grep "apps/web/src/components/ui/" || echo "ui primitive の新規追加なし"
```

**PASS 基準**: 出力が「ui primitive の新規追加なし」（`apps/web/src/components/ui/` への新規 `.tsx` 追加が無い。既存 `Avatar` 等の編集は許容）。

```bash
grep -n "Avatar" apps/web/src/components/public/ProfileHero.tsx
```

**PASS 基準**: `Avatar` の import / 使用がヒット（`size="xl"` で既存 primitive を再利用）。

**FAIL 時の対処**: `components/ui/` に新規ファイルがある場合は、proto 既存 primitive + globals.css クラスの組み合わせに吸収する。→ 差し戻し先: **Phase 8（リファクタリング）**。

---

## QA-007 — MemberDetailSections live import ゲート（FB-UI-02-1: 削除でなく転用の PASS 基準）

**目的**: `MemberDetailSections.tsx` を**削除せず** other フォールバック専用 renderer に**転用**した場合に、実際に `MemberDetail` から live import されて使われていることを確認する（dead stub 化していないこと）。

```bash
grep -rn "MemberDetailSections" apps/web/src/components/public/MemberDetail.tsx
```

**PASS 基準**: `MemberDetail.tsx` に `import { MemberDetailSections }` と `<MemberDetailSections sections={other} />`（`other.length > 0` 条件下）の使用が両方ヒット（live import + 実使用）。

```bash
grep -rln "MemberDetailSections" apps/web/src apps/web/app
```

**PASS 基準**: import 元（`MemberDetail.tsx`）と spec を含む参照が存在し、孤立した未使用ファイルになっていない。

**FAIL 時の対処**: 転用後に `MemberDetail` から呼ばれていない（dead）場合は、other フォールバック描画経路を `MemberDetail` に正しく配線する。完全に不要なら削除を検討するが、本タスクの設計（AC-7 の受け皿）では転用が正。→ 差し戻し先: **Phase 5（実装）/ Phase 8（リファクタリング）**。

---

## QA-008 — seed 全項目ゲート（AC-9）

**目的**: `TEST-MEM-01` の seed が visibility=public 全項目の response_fields 行を生成し、後方互換（profile 未指定 member は従来 3 項目）が維持されていることを確認する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
```

**PASS 基準**: TEST-MEM-01 が全 stableKey 行を生成すること・後方互換 member の 3 項目維持・SQL エスケープを検証する spec が全件 PASS。

**FAIL 時の対処**: `answersFor` / `responseFieldRows` の profile マージ・可変生成を修正する。`field_count` 不整合があれば spec 実測値に整合させる。→ 差し戻し先: **Phase 5（実装）**。

---

## QA-009 — TypeScript 型チェック全 workspace

```bash
mise exec -- pnpm typecheck
```

**PASS 基準**: 全 workspace（`@ubm-hyogo/api` / `@ubm-hyogo/web` / `@ubm-hyogo/shared`）でエラー 0 件。

**FAIL 時の対処**: unused import・null 許容漏れ・型注釈不整合を最小差分で修正。新 `MemberDetailProps`（hero/business/personal/message/links/other）の型と page.tsx / component props の整合を確認する。→ 差し戻し先: **Phase 8（リファクタリング）**。

---

## QA-010 — Lint 全 workspace（boundaries / deps / stablekey / inline-style 含む）

```bash
mise exec -- pnpm lint
```

**PASS 基準**: エラー 0 件。`pnpm lint` は `lint-boundaries` → `lint:deps` → `lint-stablekey-literal` → `lint-stable-key-update --strict` → `verify:no-inline-style` → `pnpm -r lint`（各 workspace eslint）を順に実行する。公開 component の新規ファイルでは warning も 0 件を目標とする。

**FAIL 時の対処**:
1. まず `mise exec -- pnpm lint --fix`（または `pnpm -r lint --fix`）を試みる。
2. 自動修正で解消しない違反のみ手動修正。
3. `no-inline-style` 違反は className（proto クラス）に置換。
4. stablekey リテラル違反は QA-004 の対処。
→ 差し戻し先: **Phase 8（リファクタリング）**。

---

## QA-011 — targeted vitest 全 green（adapter + component + seed）

```bash
# Lane A
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/adapters/__tests__/member-detail.spec.ts \
  src/components/public/__tests__
# Lane B
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
```

**PASS 基準**: 新規追加テストを含む全 spec が PASS。

対象テスト（Phase 1 §5 inventory より）:
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（セクション再構成 / other-fallback / visibility filter）
- `apps/web/src/components/public/__tests__/*.spec.tsx`（各新規 component の表示・空項目分岐）
- `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（全 stableKey 行 / 後方互換）

**FAIL 時の対処**: 失敗テストのエラーを確認し、実装との不整合を修正。テストの期待値を緩める方向の変更は禁止（実装を修正して PASS させる）。→ 差し戻し先: **Phase 5/6**。

---

## QA-012 — Build 成功ゲート（OpenNext Workers 互換）

```bash
mise exec -- pnpm build
```

**PASS 基準**: `apps/api` と `apps/web`（OpenNext Workers 互換ビルド = `next build --webpack`）がエラーなく完了。

**FAIL 時の対処**: Cloudflare Workers 互換制約を確認。Server Component（public member detail page）は `"use client"` 不要（純表示）。新規 component に不要な client directive が無いことを確認する。→ 差し戻し先: **Phase 5（実装）**。

---

## QA まとめ判定表

実施後に以下のチェックリストを埋める（PASS/FAIL 記録様式）。

| Gate ID | コマンド / 観点 | PASS/FAIL | 差し戻し先 | 備考 |
|---------|------|------|------|------|
| QA-001 | D1 直アクセス grep（adapter/component） | — | Phase 5 | 不変条件 #2/#5 |
| QA-002 | API endpoint / migration 変更 0 | — | Phase 2 | 不変条件 #1 |
| QA-003 | verify-design-tokens + HEX grep | — | Phase 5 | AC-10 / OKLch |
| QA-004 | lint:stablekey:strict | — | Phase 5 | 不変条件 #6 |
| QA-005 | visibility 二重防御 grep | — | Phase 5 | AC-8 |
| QA-006 | 新規 primitive 不在 git diff | — | Phase 8 | 不変条件 #4 |
| QA-007 | MemberDetailSections live import | — | Phase 5/8 | FB-UI-02-1 転用 |
| QA-008 | build-seed-sql spec（全項目） | — | Phase 5 | AC-9 |
| QA-009 | `pnpm typecheck` | — | Phase 8 | 全 ws |
| QA-010 | `pnpm lint` | — | Phase 8 | 全 ws |
| QA-011 | targeted vitest（A+B） | — | Phase 5/6 | 全 green |
| QA-012 | `pnpm build` | — | Phase 5 | api + web |

---

## 完了条件（Phase 9）

- [ ] QA-001〜QA-012 の全 gate が PASS（または PASS になるまで対象 Phase へ差し戻して修正済み）
- [ ] 各 gate の実行結果が上記判定表に記録されている（PASS/FAIL 様式）
- [ ] `apps/web` に D1 直アクセスが混入していない（QA-001）
- [ ] API endpoint / migration / Form schema の変更が 0 件（QA-002 / AC-10）
- [ ] HEX 直書き 0・OKLch トークンのみ（QA-003 / verify-design-tokens green）
- [ ] stableKey リテラル直書き 0（QA-004 / lint-stablekey-literal strict green）
- [ ] 新規 primitive 0（QA-006）
- [ ] `MemberDetailSections` が削除でなく live import で転用されている（QA-007 / FB-UI-02-1）
- [ ] FAIL 修正により新たなテスト失敗が発生していない（修正の副作用なし）
- [ ] `*.test.{ts,tsx}` ファイルが追加されていない

## メタ情報
workflow_state: `implemented_local_visual_present_staging_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
実装差分が不変条件（#1/#2/#3/#4/#5/#6）・AC-8/AC-9/AC-10、型・lint・verify-design-tokens・build・targeted tests をすべて満たすことを確認する。

## 実行タスク
- grep gate（D1/endpoint/token/stablekey/visibility/primitive/live-import）と workspace typecheck/lint/build/test gate を実行する。
- FAIL があれば判定表の差し戻し先 Phase へ戻して同一サイクルで修正する。

## 参照資料
- `phase-8.md`
- `phase-1.md`（§3 AC / 不変条件）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物
- Phase 9 QA 仕様

## 統合テスト連携
Phase 10 の最終レビューゲート（AC 判定）は本 Phase の gate 結果を根拠にする。
