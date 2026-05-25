# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 名称 | 品質保証（一括検証 / CLAUDE.md 不変条件 / CI gate 事前確認 / secret 非記載） |
| 依存 | phase-07.md（カバレッジ確認）/ phase-08.md（リファクタリング） |
| 成果物 | 本ファイル（phase-09.md） |
| 状態 | spec_created |

## 目的

recompute 実装（migration / workflow / repository / endpoint / web helper / UI / spec 更新）を、PR 作成前に一括検証コマンドと CLAUDE.md 不変条件チェックリストで品質確定する。CI gate（`verify-pr-ready.sh` / `gate-metadata:validate` / `verify:phase12-compliance`）を local 先行実行し、PR 上の fail を防ぐ。secret 実値が evidence / artifacts に残っていないことを最終確認する。

## 一括検証コマンド

> 全コマンドは `mise exec --` 経由で Node 24 / pnpm 10 を保証する（CLAUDE.md）。package 名は `@ubm-hyogo/api` / `@ubm-hyogo/web`（`package.json` で確認済み）。

```bash
# 1. 型チェック（root → 全 workspace）
mise exec -- pnpm typecheck

# 2. リント（root → 全 workspace。web は tsc + eslint）
mise exec -- pnpm lint

# 3. targeted test（Phase 1 で固定した 4 ファイル）
mise exec -- pnpm --filter @ubm-hyogo/api test src/workflows/schemaAliasRecompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/admin/__tests__/schema.recompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/admin/__tests__/api.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx

# 4. design token gate（verify-design-tokens 相当・AC-10）
mise exec -- pnpm verify:tokens

# 5. PR 事前 gate 一括（docs-only gate pre-flight）
bash scripts/verify-pr-ready.sh
```

- `pnpm verify:tokens` = `scripts/verify-design-tokens.ts`。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を検出して fail させる（CI gate `verify-design-tokens` のローカル相当）。
- `scripts/verify-pr-ready.sh` は `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift を一括検証する（CLAUDE.md「PR作成の完全自律フロー」5）。

## CLAUDE.md 不変条件チェックリスト

| # | 不変条件 | 本タスクでの確認方法 | 担保 AC |
| --- | --- | --- | --- |
| OKLch | status バッジ含め色は OKLch 系既存 token のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` 直書きなし | `pnpm verify:tokens` pass。Phase 8 で集約した token mapping を目視確認 | AC-10 |
| #8 | 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止） | inventory の新規 test 2 本が `schema.recompute.spec.ts` / `schemaAliasRecompute.spec.ts`。lefthook `block-test-suffix` pass | AC-11 |
| #10 | web の recompute API 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由。legacy `@/lib/useAdminMutation` 新規参照なし | `SchemaDiffPanel.tsx` の import を grep。legacy import がないことを確認 | AC-9 |
| #5 | D1 直接アクセス禁止。`apps/web` から D1 binding を直接呼ばない。すべて `lib/admin/api.ts` 経由 | `apps/web` 配下に D1 binding 直参照がないことを確認。recompute は fetch helper のみ | AC-12 |
| #9 | admin form input は `FormField` 経由を標準（直接 `<input>` を増やさない） | recompute UI は **ボタン + status バッジのみ**で新規 `<input>` を追加しないため #9 は非該当（form input 増設なし）。本確認で「該当なし」を記録 | （該当なし） |
| #3 | 既存 endpoint 互換: resolve / rollback 経路を touch しない。recompute は別 path | `schema.ts` の diff が recompute 2 本の追加のみで rollback(376-434) を変更していないことを確認 | 不変条件 3 |

> #9 は recompute UI が form input を増やさない設計（ボタン + バッジのみ）のため非該当。誤って `<input>` を追加していないことだけ確認する。

## CI gate の事前確認

PR 上で fail しやすい gate を local で先行実行し、原因切り分けを Phase 9 で済ませる。失敗パターンの参照先は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`。

| gate | コマンド | 役割 / 本タスクでの確認点 |
| --- | --- | --- |
| gate-metadata:validate | `mise exec -- pnpm gate-metadata:validate` | `artifacts.json` の zod schema 検証。本 workflow の phase state / metadata が schema に適合しているか |
| verify:phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan。Phase 12 output と整合しているか |
| indexes:rebuild drift | `mise exec -- pnpm indexes:rebuild`（実行後 `git status` で drift なし） | skill indexes に drift がないこと（CI `verify-indexes-up-to-date`） |
| verify-pr-ready | `bash scripts/verify-pr-ready.sh` | 上記 3 つを一括で pre-flight |

切り分け順序（verify-pr-ready.sh 失敗時）: `gate-metadata:validate`（schema）→ `verify:phase12-compliance`（headings / evidence 表）→ `indexes:rebuild` drift。

## secret 実値非記載の確認（不変条件 9）

| 確認対象 | 基準 |
| --- | --- |
| evidence MD（`outputs/phase-11/*.md`） | Cloudflare API token / D1 binding 実値 / OAuth トークンを記載しない。SQL query 結果は値のみ（接続情報なし） |
| `artifacts.json` / `outputs/artifacts.json` | secret literal を含まない |
| spec 更新（`11-admin-management.md` / `01-api-schema.md`） | endpoint path / shape のみ。token 実値なし |
| Cloudflare CLI 実行記録 | `scripts/cf.sh` 経由（`op run` で揮発注入）。token を出力に転記しない（CLAUDE.md シークレット管理） |

確認方法: 上記ファイル群に対して既知の secret prefix（API token / webhook URL 等）が含まれないことを grep で確認する。実値が混入していればこの Phase で除去する。

## 品質保証判定基準

| 項目 | 合格条件 |
| --- | --- |
| typecheck / lint | exit 0 |
| targeted test 4 ファイル | 全 green |
| verify:tokens | pass（HEX / `bg-[#xxx]` 検出ゼロ） |
| verify-pr-ready.sh | pass |
| CLAUDE.md 不変条件 | チェックリスト全項目 OK（#9 は非該当記録） |
| secret 非記載 | grep で実値混入ゼロ |

## 完了条件 (DoD)

- [ ] 一括検証コマンド（typecheck / lint / targeted test / `verify:tokens` / `verify-pr-ready.sh`）が実 package 名・実 script 名で記載されている
- [ ] CLAUDE.md 不変条件チェックリスト（OKLch / `*.spec` / useAdminMutation / D1 直接アクセス禁止 / FormField 非該当 / endpoint 互換）が AC 紐付けで固定されている
- [ ] CI gate（gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift / verify-pr-ready）の事前確認手順と切り分け順序が記載されている
- [ ] secret 実値非記載の確認対象と基準が固定されている
- [ ] 品質保証判定基準（合格条件）が列挙されている
