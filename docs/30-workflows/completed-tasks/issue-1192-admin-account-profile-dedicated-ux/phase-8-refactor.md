---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 8
phase_name: リファクタ
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 8: リファクタリング

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 対象 | 新規 1 コンポーネント + `page.tsx` 編集 1 箇所の極小差分（変更ファイル 4 件・うち実装 2 件） |
| 紐づく AC | AC-5（単一責務・member データ非含有）/ AC-6（認証判定ロジック非追加）/ AC-7（新規 CSS なし） |
| 方針 | 差分が極小のため**リファクタ対象は限定的**。確認観点と「リファクタ不要判定の条件」を仕様化し、満たせばリファクタ作業ゼロで Phase 9 へ進む |

---

## 目的

本タスクは新規 `AdminAccessNotice.tsx` 1 件 + `page.tsx` への import 1 行・条件描画 1 行の追加（+ spec 2 件）であり、既存コードの構造変更を伴わない。Phase 8 では「重複・dead code・責務漏れが**発生していない**こと」を確認観点として検査し、リファクタ不要判定の条件を機械的に判定できる形で固定する。

## 確認観点（対象 / 確認内容 / PASS 基準）

| # | 観点 | 確認内容 | PASS 基準 |
|---|------|---------|----------|
| RC-1 | `page.tsx` の import 順 | `import { AdminAccessNotice } from "./_components/AdminAccessNotice";` が既存の `_components` import 群（`ProfileHeader` 等）と同一ブロック・同一スタイル（相対パス `./_components/`）で並んでいる | 既存 import 群の並び規則（外部 → `@/` alias → 相対）を乱していない。lint（import order ルール）exit 0 |
| RC-2 | 条件描画の既存スタイル整合 | `{me.user.isAdmin ? <AdminAccessNotice /> : null}` が page.tsx 内の既存条件描画（三項演算子 + `null`）と同一イディオムである | `&&` 短絡や即時関数など別イディオムを持ち込んでいない。ProfileHeader 直後の 1 行のみ（Phase 2 D-2 の配置と一致） |
| RC-3 | dead code 不発生 | 追加した import / コンポーネント / spec fixture が全て使用されている。未使用 export・未使用変数ゼロ | `pnpm typecheck` + `pnpm lint`（unused 検出含む）exit 0。`AdminAccessNotice` の import が page.tsx で実際に描画式に到達している |
| RC-4 | `AdminAccessNotice` の単一責務維持 | コンポーネントが「管理者向け案内カードの静的描画」のみを担う。props なし・hook なし・分岐なし・member データ参照なし（不変条件 #11 / AC-5） | ファイル内に `props` 引数・`use*` hook・条件分岐・`memberId`/`email` 参照が 0。`SectionCard` + 案内文 + `ButtonLink` の 3 要素のみで構成 |
| RC-5 | 重複実装の不発生 | 管理者案内 UI が他所（shell / sidebar / 他コンポーネント）と重複定義されていない。カード枠・ボタンは既存 primitives 再利用のみ | 新規 CSS クラス 0・新規 primitive 0（`grep -rn "AdminAccessNotice" apps/web` のヒットが変更 4 ファイル内に閉じる） |

## リファクタ不要判定の条件

以下を**全て**満たす場合、Phase 8 のリファクタ作業は「不要」と判定して記録のみ残し、Phase 9 へ進む。1 つでも満たさない場合は該当観点の最小差分修正を行い、修正後に Phase 6 の focused Vitest を再実行して GREEN を確認する。

- [ ] RC-1〜RC-5 が全て PASS 基準を満たす（local 実装サイクルで確認済み）。
- [ ] 差分ファイルが Phase 2 確定の 4 件（`AdminAccessNotice.tsx` / 同 `.spec.tsx` / `page.tsx` / `page.spec.tsx`）に閉じている（`git status --porcelain` で確認）。
- [ ] `page.tsx` の差分が import 1 行 + 条件描画 1 行に収まっている（`git diff -- 'apps/web/app/(member)/profile/page.tsx'` の追加行数で確認）。
- [ ] 既存コード（ProfileHeader 以下の member プロフィール本体・degrade 分岐）に構造変更が入っていない（AC-4 の前提保全）。

> **過剰リファクタの禁止**: 本タスクを契機に page.tsx の既存構造（degrade 分岐の整理・既存 import の並べ替え等）へ手を入れることは、AC-4（degrade 分岐不変）/ R-2（非管理者 DOM 完全同一）を危険に晒すためスコープ外とする。リファクタしたい既存課題を発見した場合は Phase 12 の未タスク分類（current / out-of-scope / baseline non-issue）へ申し送る。

## リファクタリング記録テーブル（実装サイクルで記入）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| （計画段階では空欄。リファクタ不要判定が成立した場合は「該当なし（不要判定成立）」と 1 行記録する） | | | | |

---

## 実行タスク（local 実装サイクルで実施済み）

1. RC-1〜RC-5 の確認観点を順に検査する（grep / typecheck / lint / 目視）。
2. リファクタ不要判定の条件 4 項目を判定し、成立すれば記録テーブルへ「該当なし」を記録して Phase 9 へ進む。
3. 不成立の観点があれば最小差分で修正し、`mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` を再実行して GREEN を確認する。
4. 発見した既存課題（本タスク差分外）は Phase 12 の分類へ申し送る（本 Phase で修正しない）。

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-4/5/6/7・R-2 不変要件 |
| 設計 | `phase-2-design.md` | D-1 シグネチャ（単一責務の正本）/ D-2 配置・変更 4 ファイル確定 |
| 設計レビュー | `phase-3-design-review.md` | 影響半径（`/profile` route のみ）・依存方向 |
| 実装対象 | `apps/web/app/(member)/profile/page.tsx` | RC-1/RC-2 の既存スタイル基準 |

## 成果物

- `phase-8-refactor.md`（確認観点 RC-1..RC-5 / リファクタ不要判定の条件 / 記録テーブル）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest（`/profile` 配下）と Phase 11 の視覚証跡計画で行う。apps/api との統合 contract は変更しない（AC-8: `apps/api` / `packages/` 差分ゼロ）。Phase 8 の確認結果は Phase 9 の grep gate / 検証コマンドの前提として連結する。

## 完了条件

- [ ] RC-1〜RC-5 の確認観点が PASS 基準付きで定義されている（本書・済）。
- [ ] リファクタ不要判定の条件が機械判定可能な形で定義されている（本書・済）。
- [ ] （実装サイクル）RC-1〜RC-5 全 PASS、またはリファクタ記録テーブルに最小差分修正が記録され focused Vitest GREEN。
- [ ] （実装サイクル）差分が 4 ファイルに閉じ、page.tsx 追加が import 1 行 + 条件描画 1 行に収まっている。
