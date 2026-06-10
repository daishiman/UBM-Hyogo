# task-02: Lane B — MemberDrawer の fetch 失敗時 再試行導線（回復可能化）

[実装区分: 実装仕様書]

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集）・新規テスト 1 ファイルを追加して fetch 失敗時の回復導線を加えるもので、コード変更が不可欠なため実装仕様書とする（docs-only ではない）。

## メタ情報

| 項目 | 値 |
|------|------|
| ワークフロー | `admin-member-detail-tag-source-500-and-drawer-resilience` |
| 親 Phase | Phase 5（実装） |
| ブランチ | `fix/admin-member-detail-500-and-drawer-resilience`（実装サイクルで feature ブランチへ） |
| 起点 | `origin/dev` (2644fcaf2) |
| Lane | B（VISUAL・`apps/web`） |
| visualEvidence | VISUAL（`MemberDrawer` の error 分岐 UI に再試行ボタンが追加される。screenshot は staging 認証必須で user-gated） |
| 想定 PR base | `dev` |
| 並列性 | Lane A と相互非依存（並列実装可） |

## 背景

`MemberDrawer`（`apps/web/src/features/admin/components/_members/MemberDrawer.tsx:41-57`）は詳細 fetch（`GET /api/admin/members/:id`）失敗時に `setError` で文言を出すだけで、再試行（retry）導線が無く、useEffect 依存配列が `[memberId]` のみのため同一メンバーでは回復できない（`MemberDrawer.tsx:61-64` は `<p role="alert">読み込み失敗: {error}</p>` のみ）。Lane A で seed source 500 自体は根治するが、将来 500 等の失敗が他要因で起きてもドロワーが回復できる防御を別途加える。詳細は `_shared-context.md §1 真因 B` / `outputs/phase-1/phase-1.md` 参照。

## 目的

`MemberDrawer` に `reloadKey` state を追加し、詳細 fetch の useEffect 依存配列を `[memberId, reloadKey]` に拡張する。error 分岐に既存 `Button`（`variant="danger"` `size="sm"`・既に import 済み）の「再試行」ボタンを追加し、押下で `setError(null); setData(null); setReloadKey((k) => k + 1);` を実行して再 fetch する。`role="alert"` を保持し、ボタンに `data-testid="member-detail-retry"` を付与する。OKLch トークン正本に従い HEX 直書きしない・新規 primitive を生やさない。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `MemberDrawer` に `reloadKey` state 追加・useEffect 依存 `[memberId, reloadKey]`・error 分岐に再試行 `Button` 追加 |
| `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | 新規 | 初回 500→error+retry 表示、押下→2 回目 200→回復（Phase 4 §3.3 の TC-B-R1〜R4） |

それ以外のファイルは無編集。`MemberDrawerBody` / `MemberTagsEditor` 等の子コンポーネント・既存 `Button` primitive は変更しない（新規 primitive を生やさない）。

## 2. 主要な関数・型・構造のシグネチャ（CONST_005 必須・before→after 逐語）

### 2.1 state 追加・useEffect 依存拡張（`MemberDrawer.tsx:37-57`）

```diff
 export function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
   const [data, setData] = useState<AdminMemberDetailView | null>(null);
   const [error, setError] = useState<string | null>(null);
+  const [reloadKey, setReloadKey] = useState(0);

   useEffect(() => {
     let cancelled = false;
     setData(null);
     setError(null);
     fetch(`/api/admin/members/${encodeURIComponent(memberId)}`, { cache: "no-store" })
       .then(async (r) => {
         if (!r.ok) throw new Error(`HTTP ${r.status}`);
         const j = (await r.json()) as AdminMemberDetailView;
         if (!cancelled) setData(j);
       })
       .catch((e: unknown) => {
         if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
       });
     return () => {
       cancelled = true;
     };
-  }, [memberId]);
+  }, [memberId, reloadKey]);
```

### 2.2 error 分岐に再試行ボタン追加（`MemberDrawer.tsx:60-65`）

```diff
   return (
     <Drawer open onClose={onClose} title="会員詳細">
       {error ? (
-        <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
-          読み込み失敗: {error}
-        </p>
+        <div role="alert" className="flex flex-col gap-2 text-sm text-[var(--ubm-color-danger)]">
+          <p>読み込み失敗: {error}</p>
+          <div>
+            <Button
+              type="button"
+              variant="danger"
+              size="sm"
+              data-testid="member-detail-retry"
+              onClick={() => {
+                setError(null);
+                setData(null);
+                setReloadKey((k) => k + 1);
+              }}
+            >
+              再試行
+            </Button>
+          </div>
+        </div>
       ) : !data ? (
```

> `role="alert"` を `<p>` から外側 `<div>` へ移し、本文 `<p>` と再試行ボタンを内包する（alert として一括読み上げ）。`Button` は `MemberDrawer.tsx:23` で既に import 済み（追加 import 不要）。色は `--ubm-color-danger` トークンと `Button variant="danger"` のみで、HEX 直書きを追加しない。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
|------|------|
| 入力 | `memberId`（props・不変）/ `reloadKey`（内部 state・再試行で +1）。詳細 fetch の HTTP 結果（`r.ok` / `r.status`） |
| 出力 | error 時は `role="alert"` 内に文言 + `data-testid="member-detail-retry"` の再試行ボタン。再試行押下で再 fetch、成功時は `MemberDrawerBody`（詳細表示）へ回復 |
| 副作用 | 再試行押下時に `setError(null)` / `setData(null)` / `setReloadKey((k)=>k+1)` の state 更新。依存変化により useEffect が再駆動し `fetch` を再実行 |
| 不変 | `MemberDrawerBody` / `MemberTagsEditor` 等の子・既存 `Button` primitive・成功時 / 読み込み中 分岐は変更しない。新規 primitive を生やさない。HEX 直書きなし（OKLch トークン正本） |

| 状態 | 表示 |
|------|------|
| 詳細 fetch 失敗（`!r.ok` / catch） | `role="alert"`：`読み込み失敗: {error}` + 再試行ボタン（`member-detail-retry`） |
| 再試行押下後 2 回目成功 | `MemberDrawerBody`（詳細）へ回復・alert 消失 |
| 読み込み中（`!data`） | 既存 `role="status"` の「読み込み中…」（不変） |
| 初回成功 | 既存 `MemberDrawerBody`（不変）・再試行ボタン非描画 |

## 4. テスト方針（CONST_005 必須）

新規 test は `*.spec.tsx`（不変条件 #8）。`global.fetch` を 1 回目 500・2 回目 200 でモックする（`MemberDrawer.tags.spec.tsx` の `vi.spyOn(globalThis,"fetch")` 手法・`useAdminMutation` / `fetchMemberTags` の mock 定義を流用して回復後の子をクラッシュさせない）。Phase 4 §3.3 の TC を実装する。

| TC-ID | ケース | fetch mock | 期待 |
|-------|--------|-----------|------|
| TC-B-R1 | 初回 500 → error + 再試行ボタン表示 | 1 回目 `{ok:false,status:500}` | `getByRole("alert")` に「読み込み失敗」を含む / `getByTestId("member-detail-retry")` が存在 |
| TC-B-R2 | 押下 → 2 回目成功 → 詳細回復 | 1 回目 500・2 回目 `{ok:true,json:()=>mkDetail()}` | ボタン click 後 `waitFor` で `mkDetail()` の `fullName`「山田 太郎」が描画・alert の「読み込み失敗」が消える |
| TC-B-R3 | 再試行で再 fetch される | 同 TC-B-R2 | click 後 `fetch` が 2 回以上呼ばれる / 回復後 `member-detail-retry` が消える |
| TC-B-R4 | 初回成功時は再試行ボタン非描画（非回帰） | 1 回目 `{ok:true,...}` | `queryByTestId("member-detail-retry")` が null / 詳細本体が描画 |

> 既存 `MemberDrawer.tags.spec.tsx` / `MemberDrawer.tagInlineCreate.spec.tsx` は初回成功経路（`mockDetailFetch` が常に `ok:true`）を前提とするため、依存配列拡張（`[memberId, reloadKey]`）後も初回挙動は不変＝非破壊。Phase 6 で両既存 spec の回帰実行を明記する。

### 4.1 視覚証跡（VISUAL・user-gated）

`MemberDrawer` の error 分岐 UI が変わるため screenshot 証跡が望ましいが、`/admin/members` は管理者セッション必須で staging 認証が要る。implemented_local_evidence_captured 段階では PNG 未取得（`screenshots/` に実 PNG を置かず capture metadata の `status` を `staging_visual_pending_user_gate` とする）。jsdom レンダリング（TC-B-R1〜R4 の DOM assertion）を一次証跡とする。

## 5. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
pnpm install

# 3. 型 / lint
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint

# 4. Lane B テスト（repo root 由来。filter で No test files の場合は cd + --root）
pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
# fallback:
# cd apps/web && pnpm exec vitest run \
#   apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx --root ../..

# 5. 既存 drawer テストの非破壊確認
pnpm --filter @ubm-hyogo/web exec vitest run \
  src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx \
  src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx

# 6. HEX 直書きが無いことの確認（OKLch トークン正本・新規 primitive を生やさない）
git diff apps/web/src/features/admin/components/_members/MemberDrawer.tsx | \
  grep -E '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#' || echo "HEX 直書きなし"
```

## 6. 完了条件（DoD: Definition of Done・CONST_005 必須）

| ID | 条件 | 検証 |
|----|------|------|
| DoD-B-1 | `MemberDrawer` に `reloadKey` state が追加され useEffect 依存が `[memberId, reloadKey]` | `git diff MemberDrawer.tsx` |
| DoD-B-2 | 詳細 fetch 失敗時に `role="alert"` 内へ `data-testid="member-detail-retry"` の再試行ボタンを描画 | TC-B-R1 |
| DoD-B-3 | 再試行押下で `setError(null)`/`setData(null)`/`setReloadKey(+1)` により再 fetch し成功時に回復 | TC-B-R2 / TC-B-R3 |
| DoD-B-4 | 初回成功時は再試行ボタンを描画しない（非回帰） | TC-B-R4 |
| DoD-B-5 | 既存 `Button` primitive（`variant="danger"` `size="sm"`）を再利用し新規 primitive を生やさない・HEX 直書きなし | §5 手順 6 |
| DoD-B-6 | `typecheck` / `lint` exit 0・既存 drawer テスト非破壊 | §5 手順 3 / 5 |

## 7. ロールバック手順

```bash
git checkout -- apps/web/src/features/admin/components/_members/MemberDrawer.tsx
git rm apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
```

戻すと fetch 失敗時に再試行できない状態に戻る（Lane A が landed していれば seed source 500 自体は発生しない）。

## 8. 後続タスク・先送り項目

CONST_007 に違反する先送りは**無し**。`MemberTagsEditor` 子コンポーネントの個別エラー回復強化は本経路外（子の tags fetch は成功時のみマウント）でスコープ外であり、Phase 12 で MINOR 判定する。

## 9. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。VISUAL のため `outputs/phase-11/` の screenshot 参照が取得済みなら PR 本文へ含める（未取得なら screenshot セクションを作らない）。Lane A と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
