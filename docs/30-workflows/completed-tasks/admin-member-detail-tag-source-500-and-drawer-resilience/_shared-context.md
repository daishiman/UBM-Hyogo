# _shared-context（SubAgent 共有正本・設計確定事実）

> このファイルは Phase 4-13 を並列展開する SubAgent が参照する設計の確定事実集である。
> 衝突時の正本順位は `index.md` > `phase-{1,2,3}` > `task-0N-*` > specs。本ファイルは設計事実の単一ソース。

## 0. タスク一行要約

管理画面メンバー詳細 API `GET /api/admin/members/:id` が `member_tags.source='seed'` 等の未知値で `TagSourceZ` 検証に失敗し 500 になる不具合を **fail-soft 正規化＋enum 防御** で解消し（Lane A）、`MemberDrawer` の fetch 失敗時に**再試行導線**を追加して回復可能化する（Lane B）。実装区分はいずれも **実装仕様書**。

## 1. 真因（実コード裏取り済み）

### 真因 A — 500（主因）
- `apps/api/migrations/0002_admin_managed.sql:46`: `source TEXT NOT NULL`（**CHECK 制約なし**）。DB はタグ source に任意文字列を許す。
- `apps/api/migrations/seed/test-accounts-seed.sql:91-121`: TEST-MEM-09 等へ `source='seed'` を INSERT。
- 実運用の source 値: `'rule'`（`tagCandidateEnqueue`）/ `'manual'`（bulk tag・drawer assign。`members.ts:761`, `memberTags.ts:174,274`）。
- `packages/shared/src/zod/primitives.ts:29`: `export const TagSourceZ = z.enum(["rule", "ai", "manual"]);`（3 値固定）。
- `packages/shared/src/types/common.ts:13`: `export type TagSource = "rule" | "ai" | "manual";`。
- `packages/shared/src/zod/viewmodel.ts:71`: `MemberProfileZ.profile.tags[].source: TagSourceZ`。
- `apps/api/src/repository/_shared/builder.ts:357`（`buildMemberProfile`）と `:429`（`buildAdminMemberDetailView`）が `source: t.source as "rule" | "ai" | "manual"` でキャスト（実際の DB 値を無視）。
- `apps/api/src/routes/admin/members.ts:506-508`: `const parsed = AdminMemberDetailViewZ.safeParse(view); if (!parsed.success) return c.json({ ok:false, error: parsed.error.message }, 500);` ← seed source で **safeParse 失敗 → 500**。
- 一覧 `GET /api/admin/members`（`members.ts:415-447` + `parseTagsJson` `130-149`）は `source` を参照せず JSON.parse を fail-soft に握るため、同データでも 500 にならない（**非対称が真の論点**）。

### 真因 B — UI 回復不能
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:41-57`: `useEffect(() => { fetch(...).then(...).catch(e => setError(...)) }, [memberId])`。失敗時は `error` を出すだけで**再試行手段なし・依存 `[memberId]` のみ**。
- `MemberDrawer.tsx:61-64`: error 分岐は `<p role="alert">読み込み失敗: {error}</p>` のみ（retry ボタンなし）。
- `MemberTagsEditor`（同ファイル 289-319）は成功時の `MemberDrawerBody`（70-77）内でのみマウントされるため、本不具合（詳細 fetch 500）の経路では走らない。サブエージェントの「両 fetch 同時 500 で無限ループ」説は**誤り**（実コードで反証済み）。コンソールの `ug/uh` 反復は 1 回の 500 の深い React 再帰スタック表示。

## 2. 修正方針（ユーザー承認済み・確定）

ユーザー確認結果: 真因 A = **「fail-soft 正規化＋enum 防御」**、スコープ = **「500 解消＋UI 堅牢化の両方」**。

### Lane A（NON_VISUAL / `packages/shared` + `apps/api`）

1. **`packages/shared/src/types/common.ts`（編集）**: 純関数 `normalizeTagSource` を新設・export。
   ```ts
   export type TagSource = "rule" | "ai" | "manual"; // 既存・拡張しない

   const KNOWN_TAG_SOURCES: readonly TagSource[] = ["rule", "ai", "manual"];

   /**
    * DB の member_tags.source（CHECK 制約なし＝任意文字列）を view 層の TagSource へ
    * fail-soft 正規化する。既知値はそのまま、'seed' を含む未知値・空文字は 'manual' へ。
    * 例外は投げない（WEEKGRD-02: 純粋関数ガードは例外なし・防御的返却）。
    */
   export function normalizeTagSource(raw: string | null | undefined): TagSource {
     return KNOWN_TAG_SOURCES.includes(raw as TagSource) ? (raw as TagSource) : "manual";
   }
   ```
   - `packages/shared/src/index.ts:2` は `export * from "./types/common";` のため barrel から自動公開される（追加 export 配線は不要だが Phase で確認する）。

2. **`packages/shared/src/zod/primitives.ts`（編集）**: 最終防壁。
   ```ts
   export const TagSourceZ = z.enum(["rule", "ai", "manual"]).catch("manual");
   ```
   - `.catch("manual")` により、万一未正規化値が view へ流入しても `safeParse` が落ちない。`viewmodel.ts:71` / `identity.ts:68` の利用は型互換（出力型は `"rule"|"ai"|"manual"` のまま）。
   - 注意: `.catch` は parse 失敗時にフォールバック値を返すだけで union 型は不変。`TagSource` TS 型・`identity.ts`（IdentityResolution 等）の意味は不変。

3. **`apps/api/src/repository/_shared/builder.ts`（編集）**: 2 箇所のキャストを置換。
   - `:357`（`buildMemberProfile`）と `:429`（`buildAdminMemberDetailView`）の `source: t.source as "rule" | "ai" | "manual"` → `source: normalizeTagSource(t.source)`。
   - import: `import { normalizeTagSource } from "@ubm-hyogo/shared";`（builder.ts が既に shared から型 import している import 行へ追記。実 import 名は実装時に確認）。

### Lane B（VISUAL / `apps/web`）

4. **`apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集）**: fetch 失敗時の回復導線。
   - `MemberDrawer` に `reloadKey` state を追加: `const [reloadKey, setReloadKey] = useState(0);`。
   - `useEffect` 依存配列を `[memberId, reloadKey]` に変更（再駆動で再 fetch）。
   - error 分岐（61-64）を「文言 + 既存 `Button`（`variant="danger"` 相当・既に import 済み）の『再試行』ボタン」に拡張。押下で `setError(null); setData(null); setReloadKey((k) => k + 1);`。
   - `role="alert"` を保持し、再試行ボタンに `data-testid="member-detail-retry"` を付与（テスト安定化）。OKLch トークン正本に従い HEX 直書きしない。新規 primitive を生やさない。

## 3. 変更ファイル一覧（CONST_005）

| Lane | パス | 種別 | 内容 |
|------|------|------|------|
| A | `packages/shared/src/types/common.ts` | 編集 | `normalizeTagSource` 純関数追加・export |
| A | `packages/shared/src/zod/primitives.ts` | 編集 | `TagSourceZ` に `.catch("manual")` |
| A | `apps/api/src/repository/_shared/builder.ts` | 編集 | `:357` / `:429` の `as` キャスト → `normalizeTagSource()` |
| B | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `reloadKey` state + 再試行ボタン + 依存配列拡張 |

## 4. テストファイル一覧（CONST_005・新規は *.spec.* のみ）

| Lane | パス | 種別 | 主ケース |
|------|------|------|----------|
| A | `packages/shared/src/zod/viewmodel.spec.ts` | 既存 spec へ追記 | `TagSourceZ`: 'rule'/'ai'/'manual' 恒等、'seed'/未知/空文字 → 'manual' |
| A | `apps/api/src/repository/__tests__/builder.repository.spec.ts` | 既存 spec へ追記 | seed / unknown source タグを持つメンバーで `buildAdminMemberDetailView` / `buildMemberProfile` が `AdminMemberDetailViewZ.safeParse` 相当の view domain を満たす |
| B | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | 既存 spec へ追記 | 初回 fetch 500 → error 表示 + 再試行ボタン表示。ボタン押下 → 2 回目 fetch 成功 → 詳細表示へ回復。`fetch` をモック（1回目 500・2回目 200） |

- builder テスト配置の前例: `apps/api/src/repository/_shared/__tests__/builder.diagnostics.repository.spec.ts`, `apps/api/src/repository/__tests__/builder.repository.spec.ts`。
- MemberDrawer 既存テスト: `MemberDrawer.tags.spec.tsx` / `MemberDrawer.tagInlineCreate.spec.tsx`（fetch モック手法はここを踏襲）。
- **vitest 実行注意（repo root 由来）**: web/api/shared の vitest config は repo root を root とするため、ファイル指定時はフルパス指定＋必要に応じ `--root` を付ける（前例: `cd apps/web && vitest run src/... --root ../..`）。Phase 4/9 で明記する。

## 5. Acceptance Criteria（index.md と同一・トレース用）

- AC-1: `GET /api/admin/members/:id` が seed source タグ保有メンバー（TEST-MEM-09）で 200。
- AC-2: `normalizeTagSource` が既知値恒等・未知/空/null/undefined → 'manual'、例外なし。
- AC-3: `TagSourceZ` が `.catch("manual")` で safeParse 不落。
- AC-4: builder.ts 357/429 が `normalizeTagSource()` 置換（マイページ詳細も 500 回避）。
- AC-5: `MemberDrawer` fetch 失敗時に再試行ボタン表示・押下で回復。
- AC-6: endpoint surface / response shape / D1 schema / Form 不変。
- AC-7: `TagSource` union 非拡張・新規 test は *.spec.*・HEX 直書きなし。

## 6. 不変条件・スコープ外

- 不変条件: API surface 不変 / D1 直アクセス apps/api 限定 / D1 schema・migration・seed・Form 不変 / OKLch トークン正本 / *.spec.* のみ。
- スコープ外: `member_tags.source` への DB CHECK 制約追加（migration 禁止）、`MemberTagsEditor` 子の個別エラー回復強化（本経路外・MINOR 候補）、seed データ書き換え（コード吸収を正本）。

## 7. 参照仕様（既存・更新有無）

| 参照 | パス | 更新 |
|------|------|------|
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | 契約不変のため更新なし（必要なら source 値ドメイン注記のみ検討） |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | 不変 |
| 設計トークン | `apps/web/src/styles/tokens.css` / `09b-design-tokens.md` | Lane B は既存 `--ubm-color-danger` 系のみ参照・更新なし |

## 8. Phase 11 / 12 の扱い（implemented_local_evidence_captured × VISUAL）

- workflow_state = `implemented_local_evidence_captured`。本ワークフローは**実装しない**（コード/テスト/commit/PR は後続・user-gated）。
- Phase 11: VISUAL だが implemented_local_evidence_captured のため PNG は未取得。`screenshots/` には実 PNG を置かず、capture metadata の `status` を `staging_visual_pending_user_gate` とし、`manual-test-result.md` に撮影計画（error→retry→回復、修正後の詳細ドロワー正常表示）を記す。`screenshots/.gitkeep` は validator error 回避のため**置かない**（PNG 0 件のディレクトリを残さない）。
- Phase 12: strict 7 を必ず揃える。compliance check は `profile-reload-session-404-fix` の 9 見出し構成（`## 1. Summary verdict` 〜 `## 9. Four-condition verdict`）を逐語踏襲。Gate-A passed（spec review・evidence=compliance check 自身）、Gate-B/C pending。
- 正式 gate（verify-pr-ready.sh）= `verify:phase12-compliance`（ok:true）+ `gate-metadata:validate`（ERROR 0）+ indexes drift（clean）の 3 点。
