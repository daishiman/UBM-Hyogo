# Phase 11: 検証 / Evidence

## 目的

NON_VISUAL タスクとしての完了証拠を、仕様契約 completeness / build grep / 単体テスト実行ログ / staging deploy 結果 / Sentry dashboard event（補助）に分けて定義する。本 cycle では local implementation diff と focused local evidence が揃ったため、状態語彙は **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING** に固定する。

OpenNext build grep、runtime deploy、dashboard event は user approval 後の別 evidence として扱う。

## evidence_type

`curl_and_build_grep_with_sentry_dashboard_aux`

- 主 evidence: spec completeness / build grep / 単体テスト実行ログ / deploy log / curl HTTP status
- 補助 evidence: Sentry dashboard screenshot 1 枚（runtime tag 確認用、visualEvidence 判定には用いない）

## evidence ファイル一覧

```
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
outputs/phase-11/evidence/
  typecheck.log                  # tsc --noEmit
  lint.log                       # eslint
  test.log                       # sentry-capture.test.ts / instrumentation.test.ts の vitest 出力
  build.log                      # pnpm --filter @ubm-hyogo/web build の stdout/stderr
  grep-gate.log                  # G-1 / G-1b / G-2..G-5
  staging-deploy.log             # bash scripts/cf.sh deploy --env staging（runtime 実行後）
  staging-curl.log               # curl -w "%{http_code}" https://<staging>/ /members（runtime 実行後）
  sentry-dashboard.png           # 補助: Sentry dashboard で server / browser 双方 event 確認（runtime 実行後）
```

## AC × evidence マトリクス

| AC | 検証コマンド / 操作 | evidence ファイル | 期待 | 状態語彙 |
| --- | --- | --- | --- | --- |
| AC-1 | `rg "@sentry/nextjs" apps/web/src/instrumentation.ts` | `grep-gate.log` | 0 件 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-2 | `rg "@sentry/cloudflare" apps/web/src/instrumentation-client.ts` | `grep-gate.log` | 0 件 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-3 | `find apps/web -maxdepth 2 -name 'sentry.*.config.*'` | `grep-gate.log` | 0 件 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-4 | `pnpm --filter @ubm-hyogo/web build && rg 'requestIdleCallback|@sentry/nextjs|replayIntegration|captureRouterTransitionStart' apps/web/.open-next/worker.js` | `build.log` + `grep-gate.log` | build 成功 + grep 0 件 | runtime pending until build approved/executed |
| AC-5 | `pnpm --filter @ubm-hyogo/web test apps/web/src/lib/__tests__/sentry-capture.test.ts` | `test.log` | T-01〜T-06 PASS | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-6 | `pnpm --filter @ubm-hyogo/web test apps/web/src/__tests__/instrumentation.test.ts apps/web/src/__tests__/instrumentation-client.test.ts` | `test.log` | T-02 / T-07 / T-08 / T-09 PASS（server/client init guard） | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-7 | staging deploy + `curl -w "%{http_code}" https://<staging>/` + Sentry dashboard 確認 | `staging-deploy.log` + `staging-curl.log` + `sentry-dashboard.png` | RSC 200 + dashboard event 1 件以上（server + browser） | runtime pending（user approval 後） |
| AC-8 | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit && pnpm --filter @ubm-hyogo/web lint` | `typecheck.log` + `lint.log` | 両方 exit 0 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| AC-9 | export 確認: `rg "export (async )?function (captureException\|captureMessage\|register)|export type \\{ CaptureContext \\}|export type CaptureContext" apps/web/src/lib/sentry apps/web/src/instrumentation.ts` | `grep-gate.log` / `test.log` | export 4 件存在 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 状態語彙の定義

- **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**: 実装 diff が入り、canonical local PASS 5 点が揃い、staging dashboard runtime evidence が user approval 後に残っている状態。
- **PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED**: staging Workers ランタイム上で実 build が動作し、Sentry event が server / browser 双方で受信された状態。

> 本 cycle では local implementation evidence を取得済みのため **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**。`PASS` 単独表記や runtime verified 表記は禁止する。

## 検証コマンド一括スクリプト（実装後）

```bash
set -e
mkdir -p outputs/phase-11/evidence
cd /path/to/repo

mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit \
  | tee outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm --filter @ubm-hyogo/web lint \
  | tee outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/sentry-capture.test.ts src/__tests__/instrumentation.test.ts \
  | tee outputs/phase-11/evidence/test.log
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \
  | tee outputs/phase-11/evidence/build.log

{
  mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'requestIdleCallback' apps/web/.open-next/ || echo "G-1: 0 hits"
  mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/nextjs|replayIntegration|captureRouterTransitionStart' apps/web/.open-next/worker.js || echo "G-1b: 0 hits"
  mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/nextjs' apps/web/src/instrumentation.ts || echo "G-2: 0 hits"
  mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/cloudflare' apps/web/src/instrumentation-client.ts || echo "G-3: 0 hits"
  find apps/web -maxdepth 2 -name 'sentry.*.config.*'
  mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'process\.env\.SENTRY_DSN(_WEB)?' apps/web/src -g '!src/lib/env.ts' -g '!src/__tests__/**' || echo "G-5: 0 hits"
} | tee outputs/phase-11/evidence/grep-gate.log

# user approval 後の runtime evidence
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging 2>&1 \
  | tee outputs/phase-11/evidence/staging-deploy.log
curl -s -o /dev/null -w "GET / => %{http_code}\n" https://<staging>/ \
  | tee outputs/phase-11/evidence/staging-curl.log
curl -s -o /dev/null -w "GET /members => %{http_code}\n" https://<staging>/members \
  | tee -a outputs/phase-11/evidence/staging-curl.log
```

## NON_VISUAL 判定の根拠

- 主 evidence は curl HTTP status / build grep / vitest 出力 / deploy log であり、UI 視覚要素を判定対象としない。
- Sentry dashboard screenshot は runtime tag が server / browser 双方で記録されたことの補助確認であり、UI レイアウト評価ではない。
- 19 routes の visual regression は task-05 staging smoke および別 design-tokens タスクの責務。

## 実行タスク（チェックリスト）

- [x] evidence ディレクトリを `outputs/phase-11/evidence/` に作成
- [x] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` を配置
- [x] AC × evidence マトリクスを index.md AC-1〜AC-9 と 1:1 対応
- [x] local implementation diff と evidence に合わせて `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と記録し、staging runtime verified と混同しない
- [ ] Sentry dashboard screenshot は user approval 後の runtime evidence として保存

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | Phase 5 grep gate、Phase 10 deploy 手順、index.md AC-1〜AC-9 |
| 出力 | evidence ファイル一覧、AC × evidence マトリクス、状態語彙判定 |

## 参照資料

- index.md AC-1〜AC-9
- 元タスク §10 DoD
- Phase 5「grep gate G-1〜G-5」, Phase 10 deploy runbook

## 成果物

- 本 phase-11.md
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/evidence/*.log`（実装後）

## 完了条件（DoD）

- [x] AC × evidence マトリクスが index.md AC-1〜AC-9 と 1:1 一致
- [x] `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と runtime verified の境界が明記
- [x] 検証コマンド一括スクリプトが実行可能な形式
- [x] NON_VISUAL 判定の根拠が記述

## 統合テスト連携

- Phase 1〜10 のテスト・grep・deploy 設計は、本 Phase の `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` に集約する。
- 現段階は local implementation complete のため typecheck / tests / static grep を実測 evidence とし、OpenNext build grep と staging runtime は `manual-smoke-log.md` / `link-checklist.md` で user approval 後の境界を明示する。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 11
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
