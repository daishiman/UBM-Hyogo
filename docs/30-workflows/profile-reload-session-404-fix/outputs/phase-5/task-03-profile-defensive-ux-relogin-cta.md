# task-03: `/profile` の `/me` 404 分岐に再ログイン CTA を追加 + `SectionError` CTA 拡張

[実装区分: 実装仕様書]

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/app/(member)/profile/page.tsx`（編集）・`apps/web/src/components/member/SectionError.tsx`（編集）・テスト 2 ファイル（編集 1 / 新規 1）を追加してエラー表示 UX を是正するもので、コード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
|------|------|
| ワークフロー | `profile-reload-session-404-fix` |
| 親 Phase | Phase 5（実装） |
| ブランチ | `docs/profile-reload-session-404-fix-spec`（実装サイクルで feature ブランチへ） |
| 起点 | `origin/dev` (bd0393a29) |
| visualEvidence | VISUAL（`/profile` のエラーバナー UI が変わる。screenshot は staging 認証必須で user-gated） |
| 想定 PR base | `dev` |
| 並列性 | T01 / T02 と相互非依存（並列実装可） |

## 背景

`/profile` の Server Component は `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", ... })` の結果が `!meResult.ok` のとき、`SectionError` に `detail={meResult.error.message}` を渡している。これにより `/me` が 404 を返したとき「fetchAuthed failed: 404」という生の技術文字列がそのままユーザーに露出する。401 は `AuthRequiredError` で `/login` redirect に乗るが、404 は乗らずこの分岐に落ちる。詳細は `outputs/phase-1/phase-1.md` §1.1〜1.2 参照。T01/T02 で 404 自体は根治するが、デプロイ齟齬・将来の同種事象に備え UX 層でも生エラー露出を閉じ、404 のときは再ログイン導線を提示する。

## 目的

`/profile` の `!meResult.ok` 分岐で `meResult.error.code` を判定し、`MEMBER_SESSION_404` のときは再ログイン CTA（`/login?redirect=/profile`）つきの固定文言エラーを表示する。それ以外の非 2xx は既存の「セッション情報を取得できませんでした」タイトルに固定の一般文言 detail + 「再読み込み」を表示し、いずれの分岐でも生 `error.message` を露出しない。`SectionError` に optional な `actionHref` / `actionLabel` を追加し、両方ある時のみ action リンクを描画する（既存 `retryHref` 呼び出しは後方互換）。AC-3（401→`/login` redirect）は不変。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `apps/web/src/components/member/SectionError.tsx` | 編集 | `SectionErrorProps` に `actionHref?` / `actionLabel?` を追加し、両方 truthy のとき `<a data-role="action" href={actionHref}>{actionLabel}</a>` を描画 |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | `!meResult.ok` 分岐で `meResult.error.code` を判定。`MEMBER_SESSION_404` は CTA つき固定文言、それ以外は固定一般文言 + retry。生 `error.message` を渡さない |
| `apps/web/app/(member)/profile/page.spec.tsx` | 編集 | `MEMBER_SESSION_404` → CTA 表示 / それ以外 → retry のテストケース追加 |
| `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 新規 | `actionHref` + `actionLabel` の描画 / 片方のみ非描画 / 既存後方互換のテスト |

それ以外のファイルは無編集。`/me/profile` 側（既存 `MEMBER_FETCH_404` → `notFound()`）は変更しない。

## 2. 主要な関数・型・モジュールのシグネチャまたは構造（CONST_005 必須）

```tsx
// apps/web/src/components/member/SectionError.tsx
export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  actionHref?: string;   // 追加
  actionLabel?: string;  // 追加
  className?: string;
}
```

描画条件:
- `retryHref` が truthy のとき `<a data-role="retry">再読み込み</a>`（既存）
- `actionHref && actionLabel` が両方 truthy のとき `<a data-role="action" href={actionHref}>{actionLabel}</a>`（追加）
- 両方ある場合は両リンクを並べて描画する

`/profile` 側の分岐構造（`page.tsx`）:

```tsx
if (!meResult.ok) {
  if (meResult.error.code === "MEMBER_SESSION_404") {
    return (
      <main data-route="member" data-section-rhythm="comfortable">
        <SectionError
          title="セッション情報を取得できませんでした"
          detail="アカウント情報を確認できませんでした。再ログインしてください。"
          actionHref="/login?redirect=/profile"
          actionLabel="再ログイン"
        />
      </main>
    );
  }
  return (
    <main data-route="member" data-section-rhythm="comfortable">
      <SectionError
        title="セッション情報を取得できませんでした"
        detail="時間をおいて再読み込みしてください。"
        retryHref="/profile"
      />
    </main>
  );
}
```

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 状態 | `meResult` | 出力 |
|------|------|------|
| `/me` 401 | `AuthRequiredError` rethrow | `redirect("/login?redirect=/profile")`（AC-3・不変） |
| `/me` 404 | `error.code === "MEMBER_SESSION_404"` | CTA つき `SectionError`（title=固定 / detail=固定 / actionHref=`/login?redirect=/profile` / actionLabel=`再ログイン`） |
| `/me` その他非 2xx | `error.code !== "MEMBER_SESSION_404"` | retry つき `SectionError`（title=固定 / detail=固定一般文言 / retryHref=`/profile`） |
| `/me` 200 | `meResult.ok=true` | 既存本文（不変） |

| 区分 | 内容 |
|------|------|
| 入力 | `safeServerFetch` の `SafeResult<MeSessionResponse>`（`error.code` / `error.message`） |
| 出力 | Server Component の JSX（`SectionError` の props 切替） |
| 副作用 | なし（追加の fetch / D1 アクセスは発生しない） |
| 不変 | `error.message` をどの分岐でも UI に渡さない（生エラー露出ゼロ）。`AuthRequiredError` の `/login` redirect 経路は変更しない |

## 4. 編集差分（unified diff）

```diff
--- a/apps/web/src/components/member/SectionError.tsx
+++ b/apps/web/src/components/member/SectionError.tsx
@@ -1,9 +1,11 @@
 import { cn } from "../../lib/cn";
 
 export interface SectionErrorProps {
   title?: string;
   detail?: string;
   retryHref?: string;
+  actionHref?: string;
+  actionLabel?: string;
   className?: string;
 }
 
 export function SectionError({
   title = "読み込みに失敗しました",
   detail = "時間をおいて再読み込みしてください。",
   retryHref,
+  actionHref,
+  actionLabel,
   className,
 }: SectionErrorProps) {
   return (
     <div
       role="alert"
       aria-live="polite"
       data-component="section-error"
       data-variant="member"
       className={cn("section-error section-error--member", className)}
     >
       <p data-role="title">{title}</p>
       <p data-role="detail">{detail}</p>
+      {actionHref && actionLabel ? (
+        <a href={actionHref} data-role="action">
+          {actionLabel}
+        </a>
+      ) : null}
       {retryHref ? (
         <a href={retryHref} data-role="retry">
           再読み込み
         </a>
       ) : null}
     </div>
   );
 }
```

```diff
--- a/apps/web/app/(member)/profile/page.tsx
+++ b/apps/web/app/(member)/profile/page.tsx
@@ -50,13 +50,28 @@ export default async function ProfilePage() {
   }
 
   if (!meResult.ok) {
+    if (meResult.error.code === "MEMBER_SESSION_404") {
+      return (
+        <main data-route="member" data-section-rhythm="comfortable">
+          <SectionError
+            title="セッション情報を取得できませんでした"
+            detail="アカウント情報を確認できませんでした。再ログインしてください。"
+            actionHref="/login?redirect=/profile"
+            actionLabel="再ログイン"
+          />
+        </main>
+      );
+    }
+
     return (
       <main data-route="member" data-section-rhythm="comfortable">
         <SectionError
           title="セッション情報を取得できませんでした"
-          detail={meResult.error.message}
+          detail="時間をおいて再読み込みしてください。"
           retryHref="/profile"
         />
       </main>
     );
   }
```

> 上記 diff の行番号は現行 `page.tsx`（`if (!meResult.ok) {` 52 行付近）に対応。

## 5. テスト方針（CONST_005 必須）

新規 test は `*.spec.tsx`（不変条件 #8）。`jsdom` 環境で React Server Component を `render` するため、既存 `page.spec.tsx` のテストハーネスに倣う（`fetchAuthed` / `safeServerFetch` を mock し `meResult` を制御）。

### 5.1 `apps/web/src/components/member/__tests__/SectionError.spec.tsx`（新規）

| TC-ID | ケース名 | 入力 props | 期待 |
|-------|---------|-----------|------|
| TC-T03-S1 | `actionHref` + `actionLabel` で action リンクを描画 | `actionHref="/login?redirect=/profile"` `actionLabel="再ログイン"` | `[data-role="action"]` が存在し `href` が `/login?redirect=/profile`・テキストが `再ログイン` |
| TC-T03-S2 | `actionHref` のみ（label 無し）は action リンクを描画しない | `actionHref="/x"` のみ | `[data-role="action"]` が存在しない |
| TC-T03-S3 | `actionLabel` のみ（href 無し）は action リンクを描画しない | `actionLabel="再ログイン"` のみ | `[data-role="action"]` が存在しない |
| TC-T03-S4 | `retryHref` のみの既存呼び出しは後方互換（retry のみ描画・action 無し） | `retryHref="/profile"` | `[data-role="retry"]` 存在 / `[data-role="action"]` 非存在 |
| TC-T03-S5 | `retryHref` と action 両方ある場合は両リンク描画 | `retryHref="/profile"` + action 一式 | `[data-role="retry"]` と `[data-role="action"]` の両方が存在 |

### 5.2 `apps/web/app/(member)/profile/page.spec.tsx`（編集・ケース追加）

`safeServerFetch` の `/me` 呼び出しが返す `SafeResult` を mock で制御する。

| TC-ID | ケース名 | mock 状態 | 期待 |
|-------|---------|----------|------|
| TC-T03-P1 | `/me` が `MEMBER_SESSION_404` のとき再ログイン CTA を表示し生 message を露出しない | `meResult={ok:false, error:{code:"MEMBER_SESSION_404", message:"fetchAuthed failed: 404"}}` | `[data-role="action"]` の `href` が `/login?redirect=/profile`・テキスト `再ログイン` / 描画 HTML に `fetchAuthed failed: 404` を含まない / detail に「再ログインしてください」を含む |
| TC-T03-P2 | `/me` がその他非 2xx（5xx）のとき固定一般文言 + retry を表示し生 message を露出しない | `meResult={ok:false, error:{code:"MEMBER_SESSION_500", message:"fetchAuthed failed: 500"}}` | `[data-role="retry"]` の `href` が `/profile` / `[data-role="action"]` 非存在 / 描画 HTML に `fetchAuthed failed: 500` を含まない / detail が「時間をおいて再読み込みしてください。」 |
| TC-T03-P3 | `/me` 401（`AuthRequiredError` rethrow）は `/login?redirect=/profile` へ redirect（AC-3 非回帰） | `fetchAuthed` が `AuthRequiredError` を throw | `next/navigation` の `redirect` が `"/login?redirect=/profile"` で呼ばれる |

> 既存の `page.spec.tsx` が `next/navigation` の `redirect` / `notFound` をどう mock しているかに合わせる（既存テストの mock 定義を流用）。`MEMBER_SESSION_404` 判定は `safeServerFetch` の `codePrefix="MEMBER_SESSION"` + status 404 から `MEMBER_SESSION_404` が生成される実挙動（`apps/web/src/lib/server-fetch/safe-fetch.ts`）と整合する。

### 5.3 視覚証跡（VISUAL・user-gated）

`/profile` のエラーバナー UI が変わるため screenshot 証跡が望ましいが、`/profile` は member セッション必須で staging 認証が要る。screenshot 取得は user-gated とし、本サイクルでは jsdom レンダリング（TC-T03-P1/P2 の DOM assertion）を一次証跡とする（two-tier）。

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
mise exec -- pnpm install

# 3. 型 / lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4. 本タスクの追加テスト（ルートから filter 指定で実行）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "src/components/member/__tests__/SectionError.spec.tsx" \
  "app/(member)/profile/page.spec.tsx"

# 5. HEX 直書きが無いことの確認（OKLch トークン正本・新規 primitive を生やさない）
#    本タスクは既存 section-error primitive + data-role="action" の <a> のみで色指定を追加しない
git diff apps/web/src/components/member/SectionError.tsx | grep -E '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#' || echo "HEX 直書きなし"
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
|----|------|------|
| DoD-T03-1 | `SectionError` に `actionHref?` / `actionLabel?` が追加され、両方 truthy 時のみ `<a data-role="action">` を描画 | `git diff SectionError.tsx` / TC-T03-S1〜S3 |
| DoD-T03-2 | 既存 `retryHref` のみの呼び出しが後方互換（retry のみ描画） | TC-T03-S4 |
| DoD-T03-3 | `/profile` で `MEMBER_SESSION_404` のとき `actionHref="/login?redirect=/profile"` の CTA を表示 | TC-T03-P1 |
| DoD-T03-4 | どの非 2xx 分岐でも生 `error.message` を UI に渡さない（描画 HTML に `fetchAuthed failed:` を含まない） | TC-T03-P1 / P2 |
| DoD-T03-5 | `/me` 401 は従来どおり `/login?redirect=/profile` へ redirect（AC-3 非回帰） | TC-T03-P3 |
| DoD-T03-6 | `typecheck` / `lint` が exit 0・HEX 直書きなし | §6 手順 3 / 5 |
| DoD-T03-7 | `/me/profile` 側（`MEMBER_FETCH_404` → `notFound()`）を変更していない | `git diff page.tsx` が `!meResult.ok` 分岐のみ |

## 8. ロールバック手順

```bash
# page.tsx / SectionError.tsx を戻す
git checkout -- "apps/web/app/(member)/profile/page.tsx" \
                 apps/web/src/components/member/SectionError.tsx
# 追加 / 編集した test を戻す
git checkout -- "apps/web/app/(member)/profile/page.spec.tsx"
git rm apps/web/src/components/member/__tests__/SectionError.spec.tsx
```

戻すと再び生 message を露出する状態に戻るが、T01/T02 が landed していれば 404 自体は発生しない（UX 防御のみ消える）。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送り（`Phase 2 で対応`、`バックログ送り` 等）は **無し**。本タスクのスコープ（404 分岐の CTA + `SectionError` 拡張 + テスト）は本サイクルで完結する。screenshot 取得のみ staging 認証必須のため user-gated だが、これはスコープの先送りではなく証跡取得方法の制約である。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。VISUAL のため `outputs/phase-11/` の screenshot 参照が取得済みなら PR 本文へ含める（未取得なら screenshot セクションを作らない）。T01 / T02 と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
