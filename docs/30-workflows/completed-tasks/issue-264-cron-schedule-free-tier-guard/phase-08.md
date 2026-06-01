# Phase 8: リファクタリング方針

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（本サイクルで guard test 実装済み） |
| 対象 | 新規 1 ファイル `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` |
| 方針 | YAGNI。単一ファイル・小関数のため大規模 refactor は不要 |

## 結論（先に要点）

本ワークフローの成果物は **単一の spec ファイル + テスト内ローカル小関数 `extractCrons`** のみ。
プロダクションコードは 0 行追加。したがって構造的なリファクタリング（モジュール分割・抽象化・DI 導入等）は
**現時点で不要**であり、過剰設計（over-engineering）を避ける。本 Phase は「将来どの条件で構造を変えるか」の
分岐基準と、テスト内で守る可読性・重複排除の最小ルールのみを定義する。

## 1. `extractCrons` の配置判断: テスト内ローカル vs 共有 util

| 選択肢 | 採否 | 判断根拠 |
| --- | --- | --- |
| **A. テスト内ローカル関数（採用）** | ✅ 現状はこれ | `extractCrons` の利用者は本 spec のみ。`src` 配下の他モジュールから import されない。YAGNI 原則で、利用者が 1 つの間は同居が最もシンプル。`src` の公開 surface を増やさず、カバレッジ分母も汚さない（Phase 7） |
| B. `src/sync/` 配下の共有 util に切り出し | ❌ 現状は不採用 | 公開モジュールが増え、カバレッジ計測対象に入る。利用者 1 つでは早すぎる抽象化 |

### util 抽出に切り替える分岐基準（将来用・申し送り）

以下の **いずれかが発生した時点で** 共有 util（例: `apps/api/src/sync/wrangler-toml.ts`）への抽出を検討する:

1. `extractCrons` 相当のロジックを **2 つ目以降の spec / スクリプトが必要**とした（例: CI の cron-lint スクリプト、別 toml セクションの構成ガード）。
2. `wrangler.toml` 以外の toml（`apps/web/wrangler.toml` 等）にも同種ガードを横展開する判断が出た。
3. 複数行 crons 記法対応（Phase 6 拡張）でパーサが肥大化し、テスト内インライン保持が可読性を損なった。

> 抽出する場合も「最小の純粋関数を 1 つ export」に留め、汎用 toml パーサ依存（新規 npm 追加）は free-tier 制約で禁止。

## 2. 可読性ルール（テスト内で守る最小限）

| 項目 | ルール |
| --- | --- |
| 定数命名 | canonical 値は `CANONICAL`、上限は `FREE_PLAN_CRON_LIMIT`、legacy 式は `LEGACY_HOURLY` と意味で命名（マジックリテラル直書きを避ける） |
| 根拠コメント | `FREE_PLAN_CRON_LIMIT = 3` の宣言行付近に **free-plan 上限の出典を 1 行参照**（例: `// Cloudflare free-plan: account あたり cron 3 本上限。deployment-cloudflare.md L85-89,269`） |
| ファイル冒頭コメント | 「issue-264 / wrangler.toml の cron を free-plan 上限に固定する回帰ガード。プロダクションコードは追加しない」を明記（Phase 5 スケルトン踏襲） |
| 環境注釈 | `// @vitest-environment node`（fs 読込のみ・jsdom/D1 不要）を先頭に置く |

## 3. 重複排除（DRY）

3 セクション（`triggers` / `env.staging.triggers` / `env.production.triggers`）に対する同型 assert は
コピペで増やさず、データ駆動で 1 箇所に集約する。

| 観点 | 方針 |
| --- | --- |
| canonical 一致（TC-1..3） | `it.each` で `[["triggers", top], ["env.staging.triggers", staging], ["env.production.triggers", production]]` を回し、各セクションを `toEqual(CANONICAL)` で検査する案を採用してよい（Phase 5 スケルトンの個別 it 3 本のままでも可。**どちらでも可だが it.each に寄せると将来セクション追加時の漏れを防げる**） |
| ≤3 本上限（TC-4） | 3 セクション配列を `for...of` か `it.each` で 1 ループ |
| legacy 不在（TC-5） | 同上、`not.toContain(LEGACY_HOURLY)` を 1 ループ |
| parity（TC-6） | `staging`/`production` を `top` と `toEqual` 比較（2 assert） |

> it.each に寄せる場合も、テスト名にセクション名を埋め込み（`TC-1 [%s].crons は canonical`）失敗時にどのセクションかが一目で分かるようにする。可読性を損なうほどの抽象化（汎用ループ生成等）はしない。

## 4. やらないこと（過剰リファクタの回避リスト）

- 汎用 TOML パーサの自作 / npm 追加（free-tier 制約・YAGNI 違反）。
- `extractCrons` の `src` 公開化（利用者 1 つでは早い）。
- 設定値の env 変数化・外部 JSON 化（canonical は spec/コードで固定する設計意図に反する）。
- 複数行 crons 記法対応の先回り実装（現行は 1 行記法。必要時に Phase 6 拡張で対応）。

## DoD（Phase 8）

- `extractCrons` をテスト内ローカルに留める判断と、util 抽出へ切り替える分岐基準（3 条件）を明記。
- 可読性ルール（定数命名 / free-plan 根拠コメント 1 行 / 冒頭コメント / env 注釈）を明記。
- 3 セクション検査の重複排除（it.each / ループ）方針を提示。
- 過剰リファクタ回避リスト（やらないこと）を明記。
