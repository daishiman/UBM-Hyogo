# Workflow: admin-member-detail-tag-source-500-and-drawer-resilience

## 概要

管理画面メンバー一覧 `/(admin)/admin/members` で、行アクション（メンバー名ボタン / 編集アイコンボタン）を押下して会員詳細ドロワーを開くと、`GET /api/admin/members/:id`（例 `GET /api/admin/members/TEST-MEM-09`）が **HTTP 500** を返し、ドロワーが「読み込み失敗」表示のまま回復できず、DevTools コンソールに 500 ログと深い React スタックトレース（`ik → ug → uh` の反復）が大量出力される不具合を解消する。

**真因 A（500 の主因・確定）**: `member_tags.source` カラムは migration `0002_admin_managed.sql:46` で `source TEXT NOT NULL`（**CHECK 制約なし＝任意文字列許容**）として定義されている。seed データ（`apps/api/migrations/seed/test-accounts-seed.sql:91-121`）は `source='seed'` を投入し、実運用では `'rule'`（tag candidate enqueue）/ `'manual'`（bulk tag・drawer assign）が入る。一方 view 層の `TagSourceZ = z.enum(["rule","ai","manual"])`（`packages/shared/src/zod/primitives.ts:29`）は 3 値固定で、`buildAdminMemberDetailView`（`apps/api/src/repository/_shared/builder.ts:429`）が `source` を含めてタグを返すため、`AdminMemberDetailViewZ.safeParse(view)`（`apps/api/src/routes/admin/members.ts:506`）が失敗し、508 行で `500` を返す。一覧 `GET /api/admin/members` は `parseTagsJson`（`members.ts:130-149`）で `source` を参照せず JSON.parse 失敗を fail-soft に握るため、同じデータでも 500 が露出しない**非対称**が真の論点。さらに `buildMemberProfile`（`builder.ts:357`）にも同一の `as` キャストがあり、TEST-MEM-09 が会員マイページ `/profile` を開いた場合にも同じ 500 が起きうる。

**真因 B（UI 堅牢性の欠落・確定）**: `MemberDrawer`（`apps/web/src/features/admin/components/_members/MemberDrawer.tsx:41-57`）は fetch 失敗時に `setError` で文言を出すだけで、**再試行（retry）導線が無く、依存配列が `[memberId]` のみのため同一メンバーでは回復不能**。コンソールの `ug/uh` 反復は 1 回の 500 に対する深い React 再帰スタックの表示であり、真因 A を直せばエラーは消える。ただし将来 500 等の失敗が他要因で起きてもドロワーが回復できる防御は別途必要。

本ワークフローは「(A) タグ source の値ドメイン不一致による詳細/マイページ API 500 を fail-soft 正規化 + enum 防御で解消」「(B) `MemberDrawer` の fetch 失敗時の再試行導線による回復可能化」を **今回 1 実装サイクル内**で完結させる実装仕様書群である（CONST_007）。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `fix/admin-member-detail-500-and-drawer-resilience` |
| 起点 | `origin/dev` (2644fcaf2) — `origin/main` を完全内包し 673 先行・同期不要 |
| 種別 | bugfix / runtime 500 recovery + defensive UX |
| 実装区分 | **[実装区分: 実装仕様書]**（Lane A / Lane B とも CONST_005 必須項目を充足。判定根拠は Phase 1 §実装区分判定） |
| implementation_mode | `new`（既存コードへの編集 + 新規テスト追加） |
| taskType | `implementation` |
| visualEvidence | `VISUAL`（Lane B が `MemberDrawer` の error 分岐 UI に再試行ボタンを追加。implemented_local_evidence_captured 段階では PNG 未取得・実装後 staging で取得） |
| workflow_state | `implemented_local_evidence_captured`（local code implementation・focused tests・typecheck は完了。commit・PR は user-gated） |
| 想定 PR base | `dev` |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `outputs/phase-1/phase-1.md` | 要件定義（不具合の事実・実装区分判定・AC・inventory・命名規則） |
| 2 | `outputs/phase-2/phase-2.md` | 設計（スコープ境界・タスク分解・状態所有権・修正方針・参照仕様） |
| 3 | `outputs/phase-3/phase-3.md` | 設計レビュー（モジュール俯瞰・代替案比較・Phase 4 進行判定） |
| 4 | `outputs/phase-4/phase-4.md` | I/O 契約・テスト計画（HTTP / 関数 / 期待値・fail path 列挙） |
| 5 | `outputs/phase-5/phase-5.md` + `task-01-*.md` + `task-02-*.md` | 実装手順インデックス + 実装仕様書本体（Lane A / Lane B） |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（fail path / 回帰 guard） |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロックの line/branch） |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング方針 + エラーパターン |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（type/lint/test 一括） |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC 充足・blocker 判定・未タスク MINOR） |
| 11 | `outputs/phase-11/manual-test-result.md` + `screenshots/` | 手動テスト計画 + 証跡（VISUAL・実装後に PNG 取得） |
| 12 | `outputs/phase-12/*`（strict 7） | 実装ガイド・SSOT 同期・未タスク・skill feedback・compliance |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（多段ゲート、`dev` base、user-gated） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で、byte-identical に保つ。

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 |
|--------|------|------|--------|------|
| Lane A | `packages/shared` + `apps/api` | NON_VISUAL | 独立 | タグ source の fail-soft 正規化（`normalizeTagSource()` 純関数新設）+ `TagSourceZ` の `.catch("manual")` 防御 + `builder.ts` の `as` キャスト 2 箇所（357/429）置換 + 回帰テスト |
| Lane B | `apps/web`（UI） | VISUAL | 独立 | `MemberDrawer` の fetch 失敗時に「再試行」ボタンを追加し、`reloadKey` state で useEffect を再駆動して回復可能化 + テスト |

Lane A / Lane B は関心が完全に分離（API/型/zod の値ドメイン正規化 vs web UI のエラー回復）し、独立に並列実装可能。先送り・別 PR・バックログ送りは無し。

## 修正方針（確定・ユーザー承認済み）

ユーザー確認の結果、真因 A は **「fail-soft 正規化 ＋ enum 防御」**、スコープは **「500 解消 ＋ UI 堅牢化の両方」** を正本とする。

- **層 1（fail-soft 正規化・shared）**: `packages/shared/src/types/common.ts` に純関数 `normalizeTagSource(raw: string | null | undefined): TagSource` を新設。`'rule'|'ai'|'manual'` は恒等、`'seed'` を含む全未知値は `'manual'` へフォールバック（防御的・例外を投げない＝WEEKGRD-02 準拠）。`TagSource` union（3 値）は**拡張しない**（ブラスト半径最小・既存 source 表示分岐に影響ゼロ）。
- **層 2（enum 防御・zod）**: `packages/shared/src/zod/primitives.ts` の `TagSourceZ` に `.catch("manual")` を付与し、万一未正規化値が view へ流入しても `safeParse` が落ちない最終防壁とする。
- **適用点**: `builder.ts:357`（`buildMemberProfile`）と `builder.ts:429`（`buildAdminMemberDetailView`）の `t.source as "rule" | "ai" | "manual"` を `normalizeTagSource(t.source)` に置換。これにより管理画面詳細・会員マイページ双方で seed/未知 source による 500 が消える。
- **UI 堅牢化（Lane B）**: `MemberDrawer` の `error` 分岐に既存 `Button`（`variant="danger"` 相当）で「再試行」を追加し、`reloadKey` state を useEffect 依存に加えて押下で再 fetch する。新規 primitive は生やさず OKLch トークン正本に従う。

## Acceptance Criteria

- **AC-1**: `GET /api/admin/members/:id` が `source='seed'` を含むタグ保有メンバー（TEST-MEM-09）で **200** を返す（詳細 API 500 解消）。
- **AC-2**: `normalizeTagSource(raw)` が `'rule'|'ai'|'manual'` を恒等、`'seed'` と全未知/空文字を `'manual'` へ正規化し、例外を投げない。
- **AC-3**: `TagSourceZ` が未知値を `.catch("manual")` でフォールバックし `safeParse` が失敗しない（最終防壁）。
- **AC-4**: `builder.ts` の `buildMemberProfile`(357) と `buildAdminMemberDetailView`(429) が `as` キャストを `normalizeTagSource()` に置換し、会員マイページ詳細でも seed source で 500 にならない。
- **AC-5**: `MemberDrawer` の fetch 失敗時に「再試行」ボタンが表示され、押下で再 fetch して成功時に詳細表示へ回復できる（回復不能の解消）。
- **AC-6**: 既存 API endpoint surface（一覧 `GET /admin/members`・詳細・tags 系）のレスポンス shape、D1 schema、Google Form 仕様は不変（不変条件 #1）。
- **AC-7**: `TagSource` union（3 値）を拡張しない。新規 test ファイルは `*.spec.{ts,tsx}` のみ。HEX 直書きなし（OKLch トークン正本）。

## 不変条件（CLAUDE.md / プロジェクト準拠）

- 既存 API endpoint surface・レスポンス shape を変更しない（fail-soft 正規化は view object 構築時の値正規化のみで、契約は不変）。
- D1 への直接アクセスは `apps/api` に閉じる（不変条件 #5。`apps/web` から D1 binding 禁止）。
- `apps/web` の env 参照は `getEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` 経由のみ。
- D1 schema 変更・migration 追加・Google Form 仕様変更を行わない（seed データも書き換えない＝コード側で吸収）。
- OKLch トークン正本（HEX 直書き禁止）。Lane B の再試行ボタンは既存 `Button` primitive と `--ubm-color-danger` 系トークンに従う（新規 primitive を生やさない）。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
- admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準（Lane B は GET 再試行のため mutation 非該当・既存 fetch を踏襲）。

## 既知のスコープ外（本ワークフローでは扱わない）

| 事象 | 理由 / 対応先 |
|------|------|
| `[Sentry] You cannot use Sentry.init() in a browser extension` 警告 | ブラウザ拡張バンドル由来・自社外。既存 `sentry-extension-noise-filter` で対応済み観点 |
| `member_tags.source` への DB CHECK 制約追加 | schema/migration 変更は不変条件で禁止。値の正本是正はコード層（normalizeTagSource）で吸収。CHECK 制約追加が必要なら別ワークフロー（migration タスク）で扱う |
| `MemberTagsEditor` 等ドロワー内子コンポーネントの個別エラー回復強化 | 本サイクルは詳細 fetch（ドロワー本体）の回復で症状を解消。子の tags fetch は成功時のみマウントされ、本不具合の経路ではない。MINOR は Phase 12 未タスクで判定 |
| seed データの source 値そのものの是正 | コード側 fail-soft 吸収を正本とする方針（ユーザー承認）。seed 書き換えは不採用 |

## 正本順位（衝突時）

1. 本 `index.md`（SCOPE）
2. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
3. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
4. `docs/00-getting-started-manual/specs/*.md`（`01-api-schema.md` / `11-admin-management.md`）
