# Phase 9 — 品質保証

## 目的

Phase 5 〜 8 の成果物を CI gate と同等の観点で検証し、PR 提出前のローカル fail-fast を担保する。本 PR scope は UI レイヤーのみのため、API / D1 / Cloudflare 側の検証は対象外。

## 必須コマンド

```bash
# 1) 依存固定
mise exec -- pnpm install --force

# 2) 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# 3) lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4) test 全体（web パッケージ）
mise exec -- pnpm --filter @ubm-hyogo/web test

# 5) coverage（変更ファイル focus）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- src/components/public src/components/feedback

# 6) build（Cloudflare Workers bundle・OKLch / design token gate を兼ねる）
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## design-token gate

```bash
# HEX 直書き 0 件（scope 限定）
grep -rEn "#[0-9a-fA-F]{3,8}" apps/web/src/components/public apps/web/src/components/feedback apps/web/src/styles/legacy-public.css

# Tailwind 任意色 0 件
grep -rEn "bg-\[#|text-\[#|border-\[#" apps/web/src/components/public apps/web/src/components/feedback

# OKLch inline 0 件
grep -rEn "oklch\(" apps/web/src/components/public apps/web/src/components/feedback apps/web/src/styles/legacy-public.css
```

`mise exec -- pnpm --filter @ubm-hyogo/web build` が成功すれば Workers bundle 側の token trace も通過する。CI gate `verify-design-tokens`（task-18）と整合。

## test 接尾辞ルール（不変条件 8）

```bash
# 新規 *.test.{ts,tsx} が無いこと
find apps/web/src -type f \( -name "*.test.ts" -o -name "*.test.tsx" \)
# 期待: 0 件
```

lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` と整合。

## 回帰 grep（PR 提出前 fail-fast）

```bash
# MemberTable live import 0 件
grep -rEn "from .*MemberTable|import.*MemberTable" apps/web/src apps/web/app
# 期待: 0 件

# density="list" 経路で MemberTable へ流れ込まない
grep -rEn "MemberTable" apps/web/app/(public)/members/page.tsx
# 期待: 0 件
```

## line budget 確認

| ファイル | 目安行数（参考） |
| --- | --- |
| phase-5-implementation.md | 600-900 行 |
| phase-6-test-additions.md | 300-500 行 |
| phase-7-coverage.md | 200-300 行 |
| phase-8-refactor.md | 200-300 行 |
| phase-9-qa.md | 200-300 行 |

```bash
wc -l docs/30-workflows/members-list-prototype-alignment/phase-{5,6,7,8,9}-*.md
```

各仕様書が極端に短く（DoD のみ等）または極端に長く（無関係章を含む）なっていないか確認する。

## mirror parity

N/A。本タスクは `.claude/skills/` 配下の skill mirror に触れず、UBM-Hyogo / AIWorkflowOrchestrator 間の mirror parity 検証は不要（メモリ `aiworkflow スキルは2リポジトリで分岐フォーク` の方針に従う）。

## 不変条件チェック（CLAUDE.md より該当項）

| 不変条件 | 本 PR での確認 |
| --- | --- |
| 1. 実フォーム schema をコードに固定しすぎない | UI 配線のみ・schema 変更なし |
| 2. consent キーの統一 | 触らず |
| 3. responseEmail を system field | 触らず |
| 4. Google Form schema 外の admin-managed data 分離 | 触らず |
| 5. D1 直接アクセス禁止（apps/web） | apps/web 内のみ・API 経由維持 |
| 6. GAS prototype を本番昇格させない | 該当なし |
| 7. MVP は Google Form 再回答が本人更新経路 | 該当なし |
| 8. 新規 test は `*.spec.{ts,tsx}` のみ | 上記 grep で確認 |
| 9. admin form input は FormField 経由 | 該当なし（public 側） |
| 10. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | 該当なし（public 側） |

## DoD

- 必須コマンド 1〜6 が exit 0
- design-token gate の 3 つの grep が全て 0 件
- test 接尾辞ルール grep が 0 件
- 回帰 grep（MemberTable live import）が 0 件
- coverage 既存閾値を下回らず、Phase 7 の目標値を満たす
- `wc -l` で各 phase ファイルが目安行数の range に収まる
- 不変条件チェック表で「触らず / 該当なし / 維持」以外の項目を新規発生させていない
