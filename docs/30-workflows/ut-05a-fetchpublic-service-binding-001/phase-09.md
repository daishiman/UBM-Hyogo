# Phase 9: 品質保証 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 9 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

Phase 11 の実 staging / production deploy 実行を行う前提として、ローカル品質ゲート
（typecheck / lint / unit test / `build:cloudflare` / artifacts validator）が全て
通ることを確認する。`apps/web` `fetchPublic` の service-binding 化と HTTP fallback の
共存に regression がないことを静的に担保する。

## 実行タスク

1. `mise exec -- pnpm typecheck` を実行（`apps/web` の `env.API_SERVICE` 型整合を含む）
2. `mise exec -- pnpm lint` を実行
3. `mise exec -- pnpm --filter web test` を実行（`fetchPublic` の HTTP fallback 経路 unit test）
4. `mise exec -- pnpm --filter web build:cloudflare` を実行し、`@opennextjs/cloudflare`
   build artifact が service-binding を含む `wrangler.toml` 設定で生成されることを確認
5. `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-05a-fetchpublic-service-binding-001`
   を実行して artifacts parity を確認
6. coverage-guard / staged-task-dir-guard hook が main 取り込み済み worktree 上で
   PASS することを確認（spec_created 段階では merge skip 規則が効くこと）

## 参照資料

- CLAUDE.md「よく使うコマンド」セクション
- `apps/web/src/lib/fetch/public.ts`（service-binding + HTTP fallback の正本）
- `apps/web/src/lib/auth.ts` `fetchSessionResolve`（service-binding pattern の参照実装）
- `apps/web/wrangler.toml`（`[[env.staging.services]]` / `[[env.production.services]]`）
- `.claude/skills/task-specification-creator/scripts/validate-phase-output.js`

## 統合テスト連携

- validator は Phase 11 runtime evidence の実測 PASS ではなく、仕様書構造の gate として扱う
- 実 staging / production curl は Phase 11 で explicit user instruction 後に実行する
- `apps/web` test は HTTP fallback 経路（`env.API_SERVICE` undefined ブランチ）を必ずカバーする

## 実行手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test
mise exec -- pnpm --filter web build:cloudflare
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-05a-fetchpublic-service-binding-001
```

## 多角的チェック観点

- spec_created 段階では evidence 実体不足（staging-curl.log 等）は許容、artifacts parity だけは PASS であること
- typecheck failure は `env.API_SERVICE` の型定義（`Service` / `Fetcher` binding）漏れが原因でないか確認
- lint failure は service-binding 経路で `await` / Response stream の取扱が原因でないか確認
- build:cloudflare failure は wrangler.toml の services 設定と本体実装の binding 名が
  一致しているか（`API_SERVICE`）を確認

## サブタスク管理

- [ ] typecheck 結果を outputs/phase-09/typecheck.log に保存
- [ ] lint 結果を outputs/phase-09/lint.log に保存
- [ ] unit test 結果を outputs/phase-09/web-test.log に保存
- [ ] build:cloudflare 結果を outputs/phase-09/build-cloudflare.log に保存
- [ ] validator 出力を outputs/phase-09/validator.log に保存
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- `outputs/phase-09/main.md`
- `outputs/phase-09/typecheck.log`
- `outputs/phase-09/lint.log`
- `outputs/phase-09/web-test.log`
- `outputs/phase-09/build-cloudflare.log`
- `outputs/phase-09/validator.log`

## 完了条件

- typecheck / lint / unit test / build:cloudflare が exit 0
- artifacts parity が PASS
- spec_created 状態を逸脱した「Phase 11 PASS 化」が起きていない
- coverage-guard / staged-task-dir-guard hook が誤検知していない

## タスク100%実行確認

- [ ] ローカル gate が通っている
- [ ] artifacts parity が PASS
- [ ] HTTP fallback の unit coverage が staging で reglession しないことを確認

## 次 Phase への引き渡し

Phase 10 へ、ローカル QA 結果（log 一式）と build:cloudflare の artifact 検証結果を渡す。
