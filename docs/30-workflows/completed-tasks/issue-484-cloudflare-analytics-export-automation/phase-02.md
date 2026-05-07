# Phase 2: アーキテクチャ設計

## 目的
fetch script / GitHub Actions workflow / redaction check / retention rotation の責務分離を確定する。

## コンポーネント構成

```
GitHub Actions cron (毎月1日 02:00 UTC)
   │
   ├─ checkout main
   ├─ pnpm install (Node 24 / pnpm 10)
   ├─ scripts/fetch-cloudflare-analytics.ts
   │     ├─ env: CLOUDFLARE_ANALYTICS_API_TOKEN (Secret)
   │     ├─ env: CLOUDFLARE_ZONE_TAG (Secret or Variable)
   │     ├─ Cloudflare GraphQL Analytics API (aggregate-only query)
   │     ├─ atomic write to tmp → rename to long-term-evidence/
   │     └─ rotateArchive(retention=12)
   ├─ scripts/redaction-check-analytics.sh (新出力JSONを対象に grep)
   │     └─ exit 1 if forbidden token detected → workflow fail
   └─ git commit + push (workflow 内で main に直接 push しない。代わりに PR branch を作って PR 作成)
```

## 責務分離

| コンポーネント | 責務 | 非責務 |
| --- | --- | --- |
| `fetch-cloudflare-analytics.ts` | GraphQL fetch / JSON 整形 / atomic write / archive rotation | redaction の grep 検証（unit test レベルでは行うが、CI gate は別 script） |
| `redaction-check-analytics.sh` | 出力 JSON の禁止語句 grep | fetch / write |
| GitHub Actions workflow | trigger / env 注入 / 順序制御 / commit / PR 作成 | ロジック自体を持たない（薄い orchestration layer） |
| Vitest unit test | fetch script の各関数の入出力契約検証 | 実 API 通信 |

## データフロー
1. cron trigger → workflow 起動
2. workflow が secrets を env に注入し fetch script 実行
3. fetch script が GraphQL に POST → JSON parse → schema validate
4. tmp file に書き込み → rename で atomic に長期保存先へ移動
5. rotateArchive で 13 件目以降を `archive/YYYY-MM/` へ rename
6. workflow が redaction-check shell を実行
7. fail なら workflow fail で停止（commit しない）
8. pass なら PR branch 作成 → push → PR 作成

## 設計上の判断

| 判断 | 理由 |
| --- | --- |
| script を `scripts/` 配下に置く（`apps/api` ではない） | ops 用途で web/api ランタイム外。Workers binding に依存しない |
| TypeScript で記述（shell ではなく） | unit test 可能性、型安全、既存 monorepo の tooling 流用 |
| atomic write（tmp → rename） | partial output 防止（CONST-2 派生要求） |
| commit せず PR 経由 | main に直接 push しない既存ブランチ戦略を尊重 |
| schedule cron は `0 2 1 * *` | 月初 UTC 02:00（無料枠リセット直後を避ける） |

## 成果物
- 本ファイル（アーキテクチャ設計）
- `outputs/phase-2/phase-2.md`

## 完了条件
- コンポーネント図と責務分離表が確定
- データフロー 8 ステップが文書化されている

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Long-term Analytics Evidence
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` scheduled workflow / PR branch operation
