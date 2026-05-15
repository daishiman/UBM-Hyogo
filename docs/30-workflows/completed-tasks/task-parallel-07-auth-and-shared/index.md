# task-parallel-07-auth-and-shared

> ワークフロー: `task-parallel-07-auth-and-shared`
> 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
> 元仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md`
> 担当: 単一実装者（solo dev）
> implementation_mode: `implementation`（新規・編集を伴う実装タスク）
> task classification: **[実装区分: 実装仕様書]**
> visual classification: **VISUAL**（loading/error の見た目改善・スクリーンショット必須）

---

## 概要

UI prototype alignment / MVP recovery のうち、**未カバー routes**（認証導線 `/login` + 共通システム `error.tsx` / `not-found.tsx` / `loading.tsx`）について、Prototype 準拠性・OKLch token・a11y（focus 管理 / aria-live）・skeleton 統一を改善する。

本タスクは MVP recovery の「会員層 (MEM)」「共通層 (COM)」の品質ギャップを閉じる位置にあり、`task-27` の MVP 3-layer mapping で識別された未カバー routes を対象とする。

---

## スコープ

### in-scope（3 改善グループ）

| グループ | 内容 |
|---------|------|
| G7-1 | `/login` route の統一（`error.tsx` Card layout 化 / `loading.tsx` 新規追加 / focus 管理） |
| G7-2 | `/` root loading の OKLch token 完全性確認、`profile/loading.tsx` の skeleton 統一 |
| G7-3 | Root `error.tsx` の focus 管理 + Card layout 検討、`not-found.tsx` のブランディング検証 |

### out-of-scope

- 既存 API endpoint surface の変更（`apps/api/src/routes/` 配下を変更しない）
- D1 schema / Google Form 仕様の変更
- 新規 primitive コンポーネントの追加（既存 `Card` / `CardContent` のみ利用）
- `/login` の認証ロジック自体の変更（Auth.js / Magic Link は触らない）

---

## 対象 routes / ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/login/error.tsx` | 編集 | Card layout 適用 + OKLch styling + focus 管理 |
| `apps/web/app/login/loading.tsx` | **新規作成** | `/login` segment 専用 skeleton |
| `apps/web/app/error.tsx` | 編集 | focus 管理 + Card layout 検討 |
| `apps/web/app/loading.tsx` | 検証 | OKLch token 完全性確認（変更が必要なら最小差分） |
| `apps/web/app/profile/loading.tsx` | 編集 | root loading と統一した skeleton 設計 |
| `apps/web/app/not-found.tsx` | 検証 | ブランディング確認（変更なし） |

### 参照依存 / 除外 SSOT

| 種別 | パス | 扱い | 理由 |
|------|------|------|------|
| 元仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md` | 入力正本 | parallel-07 のスコープと G7-1〜G7-3 の根拠 |
| design token 正本 | `docs/00-getting-started-manual/specs/design-tokens.md` / `apps/web/src/styles/tokens.css` | 参照依存 | 実装時に token utility 名を現行 `bg-accent` / `text-panel` / `bg-surface-2` / `text-danger` へ合わせる |
| UI primitive 正本 | `apps/web/src/components/ui/Card.tsx` | 参照依存 | 新 primitive を増やさず既存 Card surface を使う |
| regression gate | `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` | 下流検証依存 | broad visual smoke / token gate の実行は本タスク実装後に消費 |
| `apps/web/app/(admin)/admin/loading.tsx` | out-of-scope | 元仕様の segment-level 例に含まれるが、本タスクは `/login` / root / `/profile` の会員・共通 routes に限定する。Admin segment loading は admin workflow owner に委譲し、本タスクでは触らない |

### テスト suffix policy

| テスト種別 | 許可 suffix | gate |
|------------|-------------|------|
| React component / unit spec | `.spec.tsx` | `*.test.tsx` 禁止。既存慣例に合わせ component spec は TSX 固定 |
| Route / pure TS spec | `.spec.ts` | 対象が JSX を含まない場合のみ |
| Playwright E2E / visual spec | `.spec.ts` | Playwright 標準に合わせる。`.spec.tsx` 必須ルールの対象外 |

---

## 正本順位

1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
2. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md`（元仕様）
3. `docs/00-getting-started-manual/specs/design-tokens.md`（task-08 OKLch 正本）
4. `apps/web/src/styles/tokens.css`（task-09 OKLch 実装正本）
5. `docs/00-getting-started-manual/claude-design-prototype/`（プロトタイプ）

---

## 不変条件

1. **OKLch token のみ**: 色は `apps/web/src/styles/tokens.css` 由来のクラスで指定。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止
2. **既存 API endpoint surface のみ利用**: 新 endpoint 追加禁止
3. **D1 直接アクセス禁止**: `apps/web` から D1 binding 参照禁止
4. **既存 primitive のみ利用**: `apps/web/src/components/ui/Card.tsx` の `Card` / `CardContent` を import（新 primitive は作らない）
5. **`*.spec.tsx` 必須**: 新規テストは `.spec.tsx` 拡張子のみ（`*.test.tsx` 禁止・lefthook gate）
6. **prefers-reduced-motion 尊重**: skeleton の pulse は `motion-safe:` prefix を必須化
7. **focus 管理**: error 表示時、`h1` に `tabIndex={-1}` + `useEffect` で自動 focus（screen reader 読み上げ促進）

---

## Phase 一覧

| Phase | 名称 | ステータス |
|-------|------|------------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト計画 | completed |
| 5 | 実装 | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト（VISUAL） | completed |
| 12 | ドキュメント更新 | completed |
| 13 | PR 作成 | blocked（ユーザー承認待ち） |

---

## 受入条件（DoD サマリー）

1. `/login/error.tsx` に Card layout + focus 管理が実装されている
2. `/login/loading.tsx` が新規作成され、OKLch skeleton + `role="status"` + `aria-busy="true"` を備える
3. Root `error.tsx` に focus 管理が追加されている
4. `/profile/loading.tsx` が root loading と統一された skeleton になっている
5. `not-found.tsx` のブランディング検証結果が記録されている
6. OKLch token 完全性: HEX 直書き 0 / `verify-design-tokens` CI gate 通過
7. jest-axe violations 0
8. `pnpm typecheck` / `pnpm lint` / `pnpm test` / Playwright smoke pass
9. Phase 11 で 4 画面 × light/dark = 8 枚のスクリーンショットを `outputs/phase-11/` に保存

---

## 主要成果物

| パス | 役割 |
|------|------|
| `phase-1-requirements.md` | 要件・スコープ・受入条件 |
| `phase-2-design.md` | 4 ファイル各々の JSX / Card layout / focus / aria 設計 |
| `phase-3-design-review.md` | 設計レビュー観点 |
| `phase-4-test-plan.md` | spec ファイル一覧と jest-axe / Playwright ケース表 |
| `phase-5-implementation.md` | 変更対象ファイル一覧と実装手順 |
| `phase-6-test-additions.md` | 追加テストの describe/it 構成と期待値 |
| `phase-7-coverage.md` | カバレッジ閾値 80% と対象 spec 列挙 |
| `phase-8-refactor.md` | skeleton 共通化検討（過剰抽象化禁止） |
| `phase-9-qa.md` | typecheck / lint / test / playwright 実行コマンドと期待結果 |
| `phase-10-final-review.md` | DoD チェックリスト |
| `phase-11-manual-test.md` | 4 画面 × light/dark スクリーンショット手順 |
| `phase-12-documentation.md` | 必須 7 成果物（main + Phase 12 補助 6 ファイル） |
| `phase-13-pr.md` | PR タイトル・本文・base=dev・approval gate |
| `outputs/phase-11/*.png` | VISUAL 証跡（実行時生成） |
| `outputs/phase-12/*.md` | Phase 12 strict outputs（実行時生成） |

---

## Phase 仕様書

- [phase-1-requirements.md](./phase-1-requirements.md)
- [phase-2-design.md](./phase-2-design.md)
- [phase-3-design-review.md](./phase-3-design-review.md)
- [phase-4-test-plan.md](./phase-4-test-plan.md)
- [phase-5-implementation.md](./phase-5-implementation.md)
- [phase-6-test-additions.md](./phase-6-test-additions.md)
- [phase-7-coverage.md](./phase-7-coverage.md)
- [phase-8-refactor.md](./phase-8-refactor.md)
- [phase-9-qa.md](./phase-9-qa.md)
- [phase-10-final-review.md](./phase-10-final-review.md)
- [phase-11-manual-test.md](./phase-11-manual-test.md)
- [phase-12-documentation.md](./phase-12-documentation.md)
- [phase-13-pr.md](./phase-13-pr.md)
