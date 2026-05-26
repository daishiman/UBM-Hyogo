# public-header-my-profile-nav-alignment

[実装区分: 実装仕様書]

> **判定根拠（CONST_004）**: 公開ヘッダ (`PublicHeader`) にログイン中ユーザー向けの「マイページ」CTA動線を追加し、
> プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`) で抜け落ちていた `/profile` への
> 遷移経路を確保する。`PublicHeader.tsx` / `PublicHeaderWithPath.tsx`（新規） / `SessionAwarePublicHeader.tsx`（新規） / `(public)/layout.tsx` /
> `app/page.tsx` の実コード変更を伴うため、デフォルト（実装仕様書）扱いとする。

## メタ情報

| 項目                | 値                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Task ID             | TASK-PUB-HEADER-MY-PROFILE-NAV                                                                                    |
| Feature 名          | public-header-my-profile-nav-alignment                                                                            |
| Task type           | implementation                                                                                                    |
| visualEvidence      | VISUAL_ON_EXECUTION（UI ヘッダ CTA 変更。local component evidence は完了、browser/session smoke は user-gated） |
| implementation_mode | `verify_existing`（実装は完了済み・focused unit test green。Phase 5 は diff 確認モード）                          |
| workflow_state      | `implemented_local_evidence_captured`（local 実装＋focused vitest 完了、browser/session smoke は user-gated）     |
| 影響 surface        | `apps/web` 公開層ヘッダ（`PublicHeader` / `PublicHeaderWithPath` / `SessionAwarePublicHeader`） + `(public)/layout.tsx` + `app/page.tsx` |
| 元 issue            | なし（プロトタイプ整合性タスク・ui-prototype-alignment 連携）                                                     |
| 親 workflow         | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`                                                          |

## 背景（一次情報）

`docs/00-getting-started-manual/claude-design-prototype/` のプロトタイプはログイン中ユーザーが任意の公開
ページから自分のマイページ (`/profile`) へ最短遷移できる導線を含むが、現行 `PublicHeader.tsx` は未ログイン
前提の固定 CTA (`/login`) のみで、ログイン中でも「マイページ」リンクが現れず動線が断絶していた。

`/profile` 自体は既に `MemberHeader` 経由でアクセス可能だが、公開層 (`/`, `/members`, `/members/[id]`,
`/register`, `/privacy`, `/terms`) を閲覧中の会員には到達手段が無く、UX 断絶となっていた。

## 真の論点

1. **真の論点**: 単なる nav リンク追加ではなく、**「公開ヘッダの session 認識 vs PublicHeader の sync テスト互換」**
   をどう両立するか。`PublicHeader` を直接 async 化すると既存 `PublicHeader.spec.tsx` の render が壊れ、
   ヘッダの構造テストが session mock 前提に汚染される。
2. **依存関係・責務境界**: `PublicHeader` は sync な presentational component に保ち、session 取得は
   新設 `SessionAwarePublicHeader`（async Server Component）に閉じ込め、pathname 解決は `PublicHeaderWithPath`
   の client island に閉じ込める。layout / page は wrapper を差し替えるだけで session 判定の場所を持たない。
3. **価値とコストの不均衡**: 新規 1 ファイル + props 1 個追加 + nav 1 リンク追加で動線確保が完結する。
   既存テストの破壊は wrapper の `vi.mock` のみで吸収可能。
4. **改善優先順位**: ① `PublicHeader` に `currentUser` prop と「マイページ」CTA分岐を追加 →
   ② `PublicHeaderWithPath` を新設し real pathname を渡す → ③ `SessionAwarePublicHeader` を新設し `getSession()` を呼ぶ → ④ `(public)/layout.tsx` と `app/page.tsx`
   の `<PublicHeader />` を `<SessionAwarePublicHeader />` に差し替え → ④ unit test 拡充 →
   ⑤ layout.spec は async wrapper を vi.mock 化。
5. **4条件評価**:
   - 価値性: 会員のマイページ到達コスト削減（公開層→マイページ間 1 click 化）。
   - 実現性: 既存 primitives / token のみで完結。HEX 直書きなし。
   - 整合性: 既存 API endpoint surface 変更なし、D1 直接アクセスなし、auth fail-closed と整合。
   - 運用性: PublicHeader spec の構造テストは sync 維持で従来通り検証可能。

## Phase 構成

| Phase | 名称             | 状態      | 出力先                       |
| ----- | ---------------- | --------- | ---------------------------- |
| 1     | 要件定義         | completed | outputs/phase-1/phase-1.md   |
| 2     | 設計             | completed | outputs/phase-2/phase-2.md   |
| 3     | 設計レビュー     | completed | outputs/phase-3/phase-3.md   |
| 4     | テスト作成       | completed | outputs/phase-4/phase-4.md   |
| 5     | 実装             | completed | outputs/phase-5/phase-5.md   |
| 6     | テスト拡充       | completed | outputs/phase-6/phase-6.md   |
| 7     | カバレッジ確認   | completed | outputs/phase-7/phase-7.md   |
| 8     | リファクタリング | completed | outputs/phase-8/phase-8.md   |
| 9     | 品質保証         | completed | outputs/phase-9/phase-9.md   |
| 10    | 最終レビュー     | completed | outputs/phase-10/phase-10.md |
| 11    | 手動テスト       | completed | outputs/phase-11/phase-11.md |
| 12    | ドキュメント更新 | completed | outputs/phase-12/phase-12.md |
| 13    | PR作成           | blocked   | outputs/phase-13/phase-13.md |

## スコープ

### 含むもの

- `apps/web/src/components/public/PublicHeader.tsx` に `currentUser?: PublicHeaderCurrentUser | null` prop を追加し、
  ログイン中のみ右上 CTA を「マイページ」 + `data-state="authenticated"` で出し分け。
- 新規 `apps/web/src/components/public/PublicHeaderWithPath.tsx` で `usePathname()` を使い、real pathname を
  `PublicHeader` の `currentPath` に渡す。
- 新規 `apps/web/src/components/public/SessionAwarePublicHeader.tsx` で `getSession()` をラップし
  `PublicHeader` に `currentUser` を渡す async Server Component を提供。
- `apps/web/app/(public)/layout.tsx` と `apps/web/app/page.tsx` の `<PublicHeader />` を
  `<SessionAwarePublicHeader />` に置換。
- `PublicHeader.spec.tsx` に未ログイン / ログイン中 / `aria-current` の 3 ケース追加（合計 5 tests）。
- `SessionAwarePublicHeader.spec.tsx` に session `null` / session 有りの 2 ケースを追加し、`getSession()` → `currentUser` 変換を直接検証。
- `(public)/layout.spec.tsx` で async child の render 失敗を `vi.mock` で回避。

### 含まないもの

- `/profile` 画面そのものの再設計（既に `ui-prototype-alignment-mvp-recovery` で整合済み）
- `MemberHeader` の変更（既に `/profile` リンクを保持済み）
- 新規 endpoint 追加・D1 schema 変更・OAuth provider 変更
- Visual baseline 更新（`VISUAL_ON_EXECUTION` として browser/session smoke は user-gated。local component evidence は取得済み）

## 不変条件（CLAUDE.md より）

- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる。`SessionAwarePublicHeader` は `getSession()` 経由のみ。
- 不変条件 #11: fail-closed（gateReason ありは session 不発行）。`getSession()` が `null` を返した場合は
  未ログイン UI（`/login` CTA）を表示する。
- HEX 直書き禁止 / tokens.css 経由（本タスクは新規スタイル追加なし、`data-state` 属性のみ）。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（既存命名規則を踏襲）。
- apps/web env アクセス不変条件: `SessionAwarePublicHeader` は env を直接参照しない。

## DoD（Definition of Done）

- **AC-1**: `PublicHeader.tsx` に `currentUser?: PublicHeaderCurrentUser | null` prop が定義されている。
- **AC-2**: ログイン中（`currentUser != null`）のとき右上 CTA は `/profile` + `data-state="authenticated"`。
  `/profile` 表示中は同 CTA に `aria-current="page"` が付く。
- **AC-3**: 未ログイン時は従来通り CTA が `/login` + `data-state="anonymous"`。
- **AC-4**: `SessionAwarePublicHeader.tsx` が `getSession()` を呼び、`{ memberId, name? }` を `currentUser` に渡す。
- **AC-5**: `(public)/layout.tsx` と `app/page.tsx` の `<PublicHeader />` が `<SessionAwarePublicHeader />` に置換されている。
- **AC-6**: `PublicHeader.spec.tsx` が 5 tests green、`SessionAwarePublicHeader.spec.tsx` が 2 tests green、`(public)/layout.spec.tsx` が 3 tests green。
- **AC-7**: `pnpm typecheck` / `pnpm lint` green。
- **AC-8**: プロトタイプ整合: `claude-design-prototype/` のヘッダ動線（ログイン中はマイページ最短遷移）と一致。

## 検証コマンド

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# focused unit test
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/components/public/__tests__/PublicHeader.spec.tsx \
  "apps/web/app/(public)/layout.spec.tsx"
```

## 関連リソース

| 種別           | パス / 参照                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| 実装変更       | `apps/web/src/components/public/PublicHeader.tsx`                               |
| 新規           | `apps/web/src/components/public/PublicHeaderWithPath.tsx`                       |
| 新規           | `apps/web/src/components/public/SessionAwarePublicHeader.tsx`                   |
| 配線           | `apps/web/app/(public)/layout.tsx`, `apps/web/app/page.tsx`                     |
| テスト         | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`, `apps/web/src/components/public/__tests__/SessionAwarePublicHeader.spec.tsx`, `apps/web/app/(public)/layout.spec.tsx` |
| 依存（read）   | `apps/web/src/lib/session.ts`（`getSession()`）                                 |
| プロトタイプ   | `docs/00-getting-started-manual/claude-design-prototype/`                       |
| 親 workflow    | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`                        |
