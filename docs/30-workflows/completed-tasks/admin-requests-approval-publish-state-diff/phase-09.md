# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 8（リファクタリング） |
| 下流 | Phase 10（最終レビュー） |
| 状態 | completed |

## 目的

実装・リファクタ完了状態に対し、**型 / lint / focused vitest / design token gate / diff ゼロ**を一括判定する品質ゲート計画を、具体コマンド付きで曖昧さなく定義する。特に AC-4 / AC-5（OKLch トークン正本・HEX ゼロ）、AC-6（新規 primitive ゼロ）、AC-7（`apps/api` / `packages/shared` diff ゼロ）、AC-9（a11y：矢印 `aria-hidden` / dl 構造）を機械検証手順として固定する。本 Phase は `spec_created`（仕様書作成のみ）であり、コード実装・実際のコマンド実行・commit・PR は後続サイクル / user-gated とする。各ゲートの「期待結果（PASS 条件）」を明示し、実装者がそのまま実行できる粒度で記述する。

## 実行タスク

1. **型 / lint / focused vitest の一括判定方針**: `mise exec -- pnpm typecheck` / `pnpm lint` / 3 spec 限定の focused vitest のコマンドと PASS 条件を `outputs/phase-09/main.md` に定義する。
2. **AC-4 / AC-5 token-audit**: `[data-diff-side]` / `.admin-state-diff` で使用する `--ubm-color-*` トークン一覧（before=`text-secondary` / after=`accent-ink` / delete=`warn` / arrow=`text-muted`）を `outputs/phase-09/token-audit.md` に固定し、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件であることの grep コマンドと CI gate `verify-design-tokens`（`pnpm verify:tokens`）対応を記す。新規トークン追加が原則不要であることを記録する。
3. **AC-6 新規 primitive ゼロ確認**: `apps/web/src/components/ui/` に新規ファイル追加が無いこと、新規追加は helper（`requestPublishStateDiff.ts`）に限ることの確認コマンドを定義する。
4. **AC-7 diff ゼロ確認**: `git diff --name-only` に `apps/api` / `packages/shared` が含まれないことの確認コマンドを定義する。
5. **AC-9 a11y 確認**: 矢印 span に `aria-hidden="true"` が付くこと、dl（`dt`/`dd`）構造が保たれること、既存 `aria-label="申請詳細"` が不変であることを focused vitest assertion + grep で確認する方針を定義する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC-4/5/6/7/9 の GATE 担保区分 |
| 必須 | outputs/phase-08/before-after.md | helper 集約後の `globals.css` `.admin-state-diff` ブロック（token-audit 対象） |
| 必須 | _shared-context.md §5 / §9 | トークン要点・ローカル検証コマンド正本 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | 品質ゲート判定パターン |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（AC-7 裏取り） |
| UI/UX a11y | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | aria-hidden / dl 構造の a11y 指針（AC-9） |

### プロジェクト spec

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/web/src/styles/tokens.css | `var(--ubm-color-*)` 参照先・トークン実在確認 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール（AC-4） |
| gate | .github/workflows/verify-design-tokens.yml | CI gate `verify-design-tokens`（AC-5） |
| 参照 | apps/web/src/styles/globals.css | `.admin-state-diff` ブロックの token-audit 対象 |

## 実行手順

### ステップ 1: 型 / lint / focused vitest の一括実行

```bash
# 1) 型チェック
mise exec -- pnpm typecheck
# 2) lint（boundary / deps / no-inline-style 等 + -r lint）
mise exec -- pnpm lint
# 3) focused vitest（repo ルート基準・3 spec 限定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
```

- PASS 条件: 1〜3 すべて exit 0。型エラー / lint 違反 / テスト FAIL が 0 件。
- helper を新設した場合は `apps/web/src/components/admin/__tests__/requestPublishStateDiff.spec.ts`（想定）も focused vitest 対象に含める。

### ステップ 2: AC-4 / AC-5 token-audit

- `outputs/phase-09/token-audit.md` の grep コマンドを実行し、HEX / `bg-[#` / `text-[#` が 0 件であることを確認する。

```bash
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx && echo "FAIL" || echo "PASS"
# globals.css の .admin-state-diff ブロックにも HEX が無いこと
grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/styles/globals.css | grep -i "admin-state-diff" && echo "FAIL" || echo "PASS"
```

- CI gate `verify-design-tokens`（`mise exec -- pnpm verify:tokens`）をローカル実行し PASS を確認する。

### ステップ 3: AC-6 / AC-7 機械確認

```bash
# AC-6: components/ui/ に新規 primitive が無い（新規追加は helper のみ）
git status --porcelain apps/web/src/components/ui/   # 新規ファイル 0 件
# AC-7: apps/api / packages/shared の diff が 0
git diff --name-only -- apps/api packages/shared     # 空であること
```

### ステップ 4: AC-9 a11y 確認

- focused vitest（`RequestQueueDetail.spec.tsx`）で矢印 span に `aria-hidden="true"` が付くこと、`dt`/`dd` 構造が保たれることを assertion する方針を記す。
- 既存 `aria-label="申請詳細"` が不変であることを grep で確認する。

```bash
grep -n 'aria-hidden="true"' apps/web/src/components/admin/RequestQueueDetail.tsx
grep -n 'aria-label="申請詳細"' apps/web/src/components/admin/RequestQueueDetail.tsx
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | カバレッジ済み TC を focused vitest 一括判定で再実行 |
| Phase 8 | helper 集約後の `globals.css` `.admin-state-diff` ブロックを token-audit 対象にする |
| Phase 10 | 品質保証 全 PASS を GO/NO-GO の必須入力にする |
| Phase 11 | typecheck / lint PASS を staging capture の前提にする |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 型整合 | — | `typecheck` exit 0。`PublishStateDiff` / helper の型が解決する |
| lint 整合 | #9 / no-inline-style | `lint` exit 0。inline style / boundary 違反なし |
| OKLch トークン | AC-4 / AC-5 | HEX / `bg-[#` / `text-[#` が 0 件。`verify-design-tokens` PASS。新規トークン追加なし |
| 新規 primitive ゼロ | AC-6 | `components/ui/` 新規ファイル 0 件（新規は helper のみ） |
| diff ゼロ | AC-7 | `apps/api` / `packages/shared` の diff 0 件 |
| a11y | AC-9 | 矢印 `aria-hidden="true"` / dl 構造 / `aria-label="申請詳細"` 不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型/lint/focused vitest 一括判定方針 | 9 | completed | main.md コマンド一覧 |
| 2 | AC-4/AC-5 token-audit（トークン一覧 + grep + gate） | 9 | completed | token-audit.md |
| 3 | AC-6 新規 primitive ゼロ確認 | 9 | completed | token-audit.md |
| 4 | AC-7 diff ゼロ確認 | 9 | completed | token-audit.md |
| 5 | AC-9 a11y 確認 | 9 | completed | main.md / token-audit.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 型 / lint / focused vitest 一括判定方針 + コマンド一覧 + a11y 確認 |
| ドキュメント | outputs/phase-09/token-audit.md | 使用 `--ubm-color-*` トークン一覧 + AC-5 grep + `verify-design-tokens` gate + AC-6 / AC-7 機械検証 |
| メタ | artifacts.json | Phase 9 を completed に同期 |

## 完了条件

- [ ] `outputs/phase-09/main.md` に typecheck / lint / focused vitest（3 spec 限定）のコマンドと PASS 条件が書かれている
- [ ] `outputs/phase-09/token-audit.md` に使用 `--ubm-color-*` トークン一覧（before=text-secondary / after=accent-ink / delete=warn / arrow=text-muted）がある
- [ ] AC-5 の grep コマンド（HEX / `bg-[#` / `text-[#`）と期待結果（0 件=PASS）がある
- [ ] CI gate `verify-design-tokens`（`pnpm verify:tokens`）との対応が記されている
- [ ] 新規トークン追加が原則不要である旨が記録されている
- [ ] AC-6（新規 primitive ゼロ）/ AC-7（apps/api・packages/shared diff ゼロ）/ AC-9（a11y）の確認コマンドがある
- [ ] artifacts.json の Phase 9 ステータスが completed に整合している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-09/{main,token-audit}.md` が配置済み
- [ ] AC-4/5/6/7/9 が具体コマンド付きの機械検証手順として定義されている
- [ ] token-audit の対象が対象 3 コンポーネント + `globals.css` の `.admin-state-diff` ブロックを含む
- [ ] artifacts.json の Phase 9 ステータスが completed に整合している

## 次Phase

- 次: Phase 10（最終レビュー）
- 引き継ぎ事項: 品質保証 全 PASS（型/lint/focused vitest/token/diff/a11y）/ token-audit 0 件
- ブロック条件: typecheck / lint / focused vitest / token-audit のいずれかが FAIL の場合は Phase 5 / 8 に戻る
