# Phase 5: 実装（GREEN）

## 実装対象一覧（FB RT-03 必須記載）

| Path | 種別 | 内容 |
|------|------|------|
| `apps/web/src/lib/constants/form.ts` | 新規作成 | `FORM_RESPONDER_URL` 定数（CLAUDE.md 固定値） |
| `apps/web/src/components/public/CallToActionCTA.tsx` | 新規作成 | dark variant CTA component |
| `apps/web/src/styles/legacy-public.css` | 編集 | `[data-component="call-to-action-cta"]` の dark variant style 追加 |
| `apps/web/app/page.tsx` | 編集 | `CallToActionCTA` import + MemberGrid section 後に mount |

## タスク 1: constants 作成

**事前 grep:**

```bash
grep -rn "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ" apps/web/src
# → 0 件であることを確認（hardcode 重複が無いことの担保）
```

**ファイル:** `apps/web/src/lib/constants/form.ts`

Phase 2 「constants」セクションの内容で新規作成。

## タスク 2: CallToActionCTA.tsx 作成

**ファイル:** `apps/web/src/components/public/CallToActionCTA.tsx`

Phase 2 「CallToActionCTA.tsx」セクションの内容で新規作成。

**注意点:**
- `import type { ReactElement } from "react"` を明示し、戻り値型を `ReactElement` で固定
- props は `readonly` 修飾子
- default props は引数 destructuring の default 値で表現

## タスク 3: legacy-public.css の dark variant style 追加

**事前 grep:**

```bash
grep -n "ubm-color-text\|ubm-color-panel\|--space-8\|--text-xs\|--radius-lg" apps/web/src/styles/tokens.css
# 全 token が存在することを確認。未定義の token があれば、tokens.css に同 wave で追加可否を判断する
```

**ファイル:** `apps/web/src/styles/legacy-public.css`

Phase 2 「CSS 設計」セクションの style block を `@layer components { ... }` 内に追加。
HEX 直書きが含まれていないことを diff 後に再確認する:

```bash
grep -n "#[0-9a-fA-F]\{3,8\}" apps/web/src/styles/legacy-public.css | grep -i "call-to-action"
# → 0 件であること
```

## タスク 4: HomePage への mount

**ファイル:** `apps/web/app/page.tsx`

差分:

```diff
 import { Hero } from "../src/components/public/Hero";
 import { MemberGrid } from "../src/components/public/MemberGrid";
+import { CallToActionCTA } from "../src/components/public/CallToActionCTA";
 import { PublicFooter } from "../src/components/public/PublicFooter";
 import { PublicHeader } from "../src/components/public/PublicHeader";
 import { Stats } from "../src/components/public/Stats";
 import { Timeline } from "../src/components/public/Timeline";
 import { ZoneIntro } from "../src/components/public/ZoneIntro";
+import { FORM_RESPONDER_URL } from "../src/lib/constants/form";
 import {
   PUBLIC_API_REVALIDATE,
   getStats,
   listMembersRaw,
 } from "../src/lib/api/public";
```

```diff
         {members.items.length > 0 ? (
           <section data-component="featured-members">
             <h2>新しく参加したメンバー</h2>
             <MemberGrid items={members.items} density="comfy" />
             <p>
               <a href="/members">メンバー一覧を見る →</a>
             </p>
           </section>
         ) : null}
+        <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
       </main>
       <PublicFooter />
     </>
   );
 }
```

## TDD GREEN 検証

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run \
  apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  apps/web/src/lib/constants/__tests__/form.spec.ts
# 全件 PASS を確認
```

## canUseTool 適用可能範囲（FB P0-09-U1-2 該当なし）

本タスクは LLM tool callback 経路を持たないため対象外。

## 完了条件（DoD）

- [ ] 4 ファイルの作成/編集が完了
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] Phase 4 のテストが全件 GREEN
- [ ] `grep -n "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ" apps/web/src` の結果が `constants/form.ts` 1 件のみ
- [ ] `grep -n "#[0-9a-fA-F]\{3,8\}" apps/web/src/styles/legacy-public.css | grep -i "call-to-action"` が 0 件

## 成果物

`outputs/phase-5/implementation-plan.md`
