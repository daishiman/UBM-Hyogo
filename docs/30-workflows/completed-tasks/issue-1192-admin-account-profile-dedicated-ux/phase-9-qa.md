---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 9
phase_name: QA
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 9: 品質保証

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 対象 | AC-6 / AC-7 / AC-8 / AC-9 の機械検証 + 回帰確認（既存 `page.spec.tsx` 全件 PASS = AC-4） |
| 方針 | 検証コマンド 5 種（正本）+ grep gate 4 種で機械判定し、PASS 基準を明示する。local local 実装サイクルで実行済み済み。staging screenshot / commit / PR は user-gated |

---

## 目的

検証コマンド正本 5 種と grep gate により AC-6/7/8/9 を機械検証し、既存 degrade 分岐テストの回帰（AC-4）を含めて一括判定する。

## 検証コマンド正本（5 種）と期待結果

> 全コマンドはリポジトリルートで実行する。local local 実装サイクルで実行済み済み。

| # | コマンド | 期待結果（PASS 基準） |
|---|---------|---------------------|
| V-1 | `mise exec -- pnpm typecheck` | exit 0（型エラー 0。`AdminAccessNotice` の import 解決・`MeProfileResponse` fixture の型整合を含む） |
| V-2 | `mise exec -- pnpm lint` | exit 0（unused import / import order / boundaries 含め違反 0。違反時はまず `pnpm lint --fix` を試行） |
| V-3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | `/profile` 配下 focused Vitest 全 GREEN（新規 T-C1〜T-C3 / T-P1〜T-P3 の 6 件 + 既存 `page.spec.tsx` 全件。AC-1/2/3/4/5/9 の自動テスト裏付け） |
| V-4 | `mise exec -- pnpm verify:tokens` | exit 0（HEX 直書き 0 / OKLch トークン正本整合 = AC-7） |
| V-5 | `git diff --name-only -- apps/api packages` | 出力 0 行（`apps/api` / `packages/` 差分ゼロ = AC-8） |

> いずれか FAIL の場合は最大 3 回まで自動修復（unused import 除去 / 型注釈補完 / `lint --fix`）を試み、修復差分を記録してから再実行する。V-5 が FAIL（差分あり）の場合は自動修復ではなく**差分の除去（revert）**が正（本タスクは web 表現層のみが正当な差分）。

## grep gate（4 種）

### gate-(a): `isAdmin` 参照が page.tsx 条件描画のみ（AC-6）

```bash
grep -rn "isAdmin" "apps/web/app/(member)/profile/"
```

- **PASS 基準**: ヒットが以下に閉じる。
  - `page.tsx`: 条件描画 `{me.user.isAdmin ? <AdminAccessNotice /> : null}` の 1 箇所。
  - `page.spec.tsx`: T-P1/T-P2/T-P3 の fixture（`isAdmin: true/false`）のみ。
  - `AdminAccessNotice.tsx` / `AdminAccessNotice.component.spec.tsx`: ヒット 0（コンポーネントは isAdmin を知らない = 判定済みの呼び出し側でのみ mount する設計）。
- web 側に cookie 解析・role 解決等の新規認証判定ロジックが無いこと（`/me` レスポンスの読み取りのみ）を本 gate と `git diff` レビュー（Phase 10）で二重確認する。

### gate-(b): HEX 直書きなし（AC-7）

```bash
grep -rnE '#[0-9a-fA-F]{3,8}\b' "apps/web/app/(member)/profile/" --include='*.tsx'
```

- **PASS 基準**: ヒット 0 行（V-4 `verify:tokens` exit 0 と併せて二重判定）。新規 CSS クラス・inline style も追加しない（Phase 2 CSS 設計: 既存 `SectionCard` / `ButtonLink` の視覚契約のみ）。

### gate-(c): `*.test.` suffix なし（不変条件 #8）

```bash
find "apps/web/app/(member)/profile" -name '*.test.ts' -o -name '*.test.tsx'
```

- **PASS 基準**: 出力 0 行。新規テストは `AdminAccessNotice.component.spec.tsx` / `page.spec.tsx`（編集）のみで、`*.spec.tsx` 命名に統一（lefthook `block-test-suffix` / CI `verify-test-suffix` と整合）。

### gate-(d): `memberId` 露出なし（不変条件 #11 / AC-5）

```bash
grep -rn "memberId" "apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx" "apps/web/app/(member)/profile/_components/AdminAccessNotice.component.spec.tsx"
```

- **PASS 基準**: `AdminAccessNotice.tsx` でヒット 0（props なし・member データ非参照）。spec 側のヒットは「member データ文字列が**描画されない**ことを assert する否定 assertion（T-C3）」のみ許容（露出を検証するための参照は可・露出させる参照は不可）。

## AC 別 機械検証手順

| AC | 検証手段 | PASS 基準 |
|----|---------|----------|
| AC-6 | gate-(a) + Phase 10 の diff レビュー | `isAdmin` ヒットが page.tsx 条件描画 + spec fixture のみ。新規認証ロジック 0 |
| AC-7 | V-4 `verify:tokens` + gate-(b) | exit 0 / HEX ヒット 0 / 新規 CSS クラス 0 |
| AC-8 | V-5 `git diff --name-only -- apps/api packages` | 出力 0 行 |
| AC-9 | V-1 + V-2 + V-3 | typecheck / lint exit 0・focused Vitest 全 GREEN |

## 回帰確認（AC-4: degrade 分岐不変）

| 項目 | 内容 |
|------|------|
| 対象 | 既存 `apps/web/app/(member)/profile/page.spec.tsx` の全既存テスト（404 / 410 / 5xx / transport degrade 分岐・401 redirect） |
| 手段 | V-3 の focused Vitest 実行に既存テストが全件含まれる（focused パターンは `/profile` 配下全 spec を拾う） |
| PASS 基準 | 既存テスト全件 GREEN（1 件も skip / 修正せず通ること = 非管理者・エラー分岐の DOM 不変）。加えて T-P3（`/me/profile` 失敗 degrade で isAdmin=true でも notice なし）が degrade 側の新規 guard として GREEN |

## QA サマリ判定表（実装サイクルで記入）

| 検証 | 手段 | PASS 基準 | 実結果 |
|------|------|----------|--------|
| V-1 typecheck | コマンド | exit 0 | PASS（local evidence） |
| V-2 lint | コマンド | exit 0 | PASS（local evidence） |
| V-3 focused Vitest | コマンド | 新規 6 件 + 既存全件 GREEN | PASS（local evidence） |
| V-4 verify:tokens | コマンド | exit 0 | PASS（local evidence） |
| V-5 api/packages diff | コマンド | 0 行 | PASS（local evidence） |
| gate-(a) isAdmin 閉域 | grep | page.tsx 1 箇所 + spec fixture のみ | PASS（local evidence） |
| gate-(b) HEX | grep | 0 行 | PASS（local evidence） |
| gate-(c) test suffix | find | 0 行 | PASS（local evidence） |
| gate-(d) memberId | grep | 実装 0・spec は否定 assertion のみ | PASS（local evidence） |

---

## 実行タスク（local 実装サイクルで実施済み）

1. V-1〜V-5 の検証コマンド正本を順に実行し、各 PASS 基準を満たすことを確認する。FAIL は最大 3 回自動修復（V-5 は revert が正）。
2. gate-(a)〜(d) の grep gate を実行し、ヒット内容を PASS 基準と突き合わせる。
3. 回帰確認（既存 `page.spec.tsx` 全件 GREEN）を V-3 の結果から判定し、AC-4 を確定する。
4. QA サマリ判定表を実結果で埋め、未達項目を Phase 10 のブロッカー判定へ申し送る。

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-1..AC-9 の定義・検証方法正本 |
| 設計 | `phase-2-design.md` | 変更 4 ファイル確定・CSS 設計（新規クラス 0） |
| リファクタ | `phase-8-refactor.md` | RC 観点（差分閉域）の前提 |
| gate | `scripts/verify-design-tokens.ts` / lefthook `block-test-suffix` | V-4 / gate-(c) の実装正本 |

## 成果物

- `phase-9-qa.md`（検証コマンド正本 5 種 / grep gate 4 種 / AC 別機械検証手順 / 回帰確認 / QA サマリ判定表）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest（`/profile` 配下・新規 6 件 + 既存回帰）と Phase 11 の視覚証跡計画で行う。apps/api との統合 contract は変更しない（V-5 で機械保証）。QA 結果は Phase 10 の AC 充足突合表へ連結する。

## 完了条件

- [ ] 検証コマンド正本 5 種が期待結果付きで定義されている（本書・済）。
- [ ] grep gate (a)〜(d) が PASS 基準付きで定義されている（本書・済）。
- [ ] （実装サイクル）V-1〜V-5 全 PASS・gate-(a)〜(d) 全 PASS。
- [ ] （実装サイクル）既存 `page.spec.tsx` 全件 GREEN（AC-4 回帰確認）が確認され、QA サマリ判定表が実結果で埋まっている。
