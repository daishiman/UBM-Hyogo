# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 8（リファクタリング） |
| 下流 | Phase 10（GO/NO-GO 判定） |
| 状態 | spec_created |
| タスク種別 | implementation（VISUAL） |

## 目的

実装・リファクタ完了状態に対し、**line budget・link・mirror parity・型/lint/build を一括判定**し、さらに AC-5（OKLch トークン）/ AC-6（新規 primitive ゼロ）/ AC-7（apps/api・packages/shared diff ゼロ）を**具体コマンド付きの機械検証**で確定する。ローカル検証コマンド（typecheck / lint / vitest 対象限定 / next build --webpack）を一覧化し、各検証の期待結果（PASS 条件）を明示する。本 Phase は実装仕様書として AC-5/6/7 の機械検証手順を曖昧さなく定義する。

## 実行タスク

1. **型 / lint / build の一括判定方針**: `typecheck` / `lint` / `next build --webpack`（OpenNext 互換）のコマンドと PASS 条件を `outputs/phase-09/main.md` に定義する。
2. **vitest 対象限定実行**: attendance feature 配下に限定した vitest 実行コマンドを定義する。
3. **line budget / link / mirror parity 判定**: docs/CSS の line budget・リンク健全性・mirror parity の判定方針を記す。
4. **AC-5 token-audit**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がゼロであることの grep コマンドと期待結果（0 件=PASS）、CI gate `verify-design-tokens` 対応を `outputs/phase-09/token-audit.md` に定義する。
5. **AC-6 新規 primitive ゼロ確認**: `apps/web/src/components/` に新規ファイル追加が無いことの確認コマンドを定義する。
6. **AC-7 diff ゼロ確認**: `git diff --name-only` に `apps/api` / `packages/shared` が含まれないことの確認コマンドを定義する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC-5/6/7 の GATE 担保区分 |
| 必須 | outputs/phase-08/before-after.md | クラス整理後の `globals.css`（token-audit 対象） |
| 必須 | _shared-context.md §9 | ローカル検証コマンド正本 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | 品質ゲート判定パターン |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（AC-7 裏取り） |

### 実コード anchor / gate（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| gate 本体 | `scripts/verify-design-tokens.ts`（`forbidden-color-literal` / `hexRe` 行 522 付近） | HEX literal 検査ロジック |
| gate workflow | `.github/workflows/verify-design-tokens.yml`（job `verify-design-tokens`） | CI 実行（`pnpm verify:tokens`） |
| npm script | `package.json` `verify:tokens`（行 39） | ローカル gate 実行 |
| token 正本 | `apps/web/src/styles/tokens.css` | `var(--ubm-*)` 参照先 |

## 実行手順

### ステップ 1: 型 / lint / vitest / build の一括実行

```bash
# 1) 型チェック（web パッケージ）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
# 2) lint（boundary / deps / stablekey / no-inline-style + -r lint）
mise exec -- pnpm --filter @ubm-hyogo/web lint
# 3) vitest（attendance feature 配下に限定）
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .
# 4) production build（OpenNext 互換 = webpack 正本）
mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack
```

- PASS 条件: 1〜4 すべて exit 0。型エラー / lint 違反 / テスト FAIL / build エラーが 0 件。

### ステップ 2: AC-5 token-audit

- `outputs/phase-09/token-audit.md` の grep コマンドを実行し、HEX / `bg-[#` / `text-[#` が 0 件であることを確認する。
- CI gate `verify-design-tokens`（`pnpm verify:tokens`）をローカル実行し PASS を確認する。

### ステップ 3: AC-6 / AC-7 機械確認

- `apps/web/src/components/` に新規ファイル追加が無いこと（AC-6）、`git diff --name-only` に `apps/api` / `packages/shared` が含まれないこと（AC-7）を確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | カバレッジ済み TC を vitest 一括判定で再実行 |
| Phase 8 | クラス整理後の `globals.css` を token-audit 対象にする |
| Phase 10 | 品質保証 全 PASS を GO/NO-GO の必須入力にする |
| Phase 11 | build PASS を screenshot 取得の前提にする |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 型整合 | — | `typecheck` exit 0。新規 `attendanceFollowLevel` / `AttendanceDetailTabs` の型が解決する |
| lint 整合 | #9 / no-inline-style | `lint` exit 0。inline style / boundary 違反なし |
| build 整合 | apps/web env 不変条件 | `next build --webpack`（OpenNext 互換）で build 成功 |
| OKLch トークン | AC-5 | HEX / `bg-[#` / `text-[#` が 0 件。`verify-design-tokens` PASS |
| 新規 primitive ゼロ | AC-6 | `apps/web/src/components/` 新規ファイル 0 件 |
| diff ゼロ | AC-7 | `apps/api` / `packages/shared` の diff 0 件 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型/lint/vitest/build 一括判定方針 | 9 | spec_created | main.md コマンド一覧 |
| 2 | line budget / link / mirror parity 判定 | 9 | spec_created | main.md |
| 3 | AC-5 token-audit（grep + gate） | 9 | spec_created | token-audit.md |
| 4 | AC-6 新規 primitive ゼロ確認 | 9 | spec_created | token-audit.md |
| 5 | AC-7 diff ゼロ確認 | 9 | spec_created | token-audit.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | line budget / link / mirror parity / 型 / lint / build 一括判定方針 + コマンド一覧 |
| ドキュメント | outputs/phase-09/token-audit.md | AC-5 token 監査（grep + gate）/ AC-6 / AC-7 機械検証手順 |
| メタ | artifacts.json | Phase 9 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-09/main.md` に typecheck / lint / vitest（対象限定）/ next build --webpack のコマンドと PASS 条件が書かれている
- [ ] line budget / link / mirror parity の判定方針が記されている
- [ ] `outputs/phase-09/token-audit.md` に AC-5 の grep コマンド（HEX / `bg-[#` / `text-[#`）と期待結果（0 件=PASS）がある
- [ ] CI gate `verify-design-tokens`（`pnpm verify:tokens`）との対応が記されている
- [ ] 新規 CSS が `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `var(--ubm-shadow-*)` 経由であることのチェックリストがある
- [ ] AC-6（新規 primitive ゼロ）の確認コマンドがある
- [ ] AC-7（apps/api・packages/shared diff ゼロ）の確認コマンドがある

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-09/{main,token-audit}.md` が配置済み
- [ ] AC-5/6/7 が具体コマンド付きの機械検証手順として定義されている
- [ ] token-audit の grep 対象が `apps/web/src/features/admin/attendance` と `globals.css` の attendance ブロックを含む
- [ ] artifacts.json の Phase 9 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 10（GO/NO-GO 判定）
- 引き継ぎ事項: 品質保証 全 PASS（型/lint/build/token/diff）/ token-audit 0 件
- ブロック条件: typecheck / lint / build / token-audit のいずれかが FAIL の場合は Phase 5/8 に戻る
