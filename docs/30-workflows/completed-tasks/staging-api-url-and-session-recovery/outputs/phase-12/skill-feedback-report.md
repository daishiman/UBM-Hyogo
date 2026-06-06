# Phase 12: スキルフィードバックレポート（skill-feedback-report）

> workflow: `staging-api-url-and-session-recovery` / implemented_local_evidence_captured。
> テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。改善点なしでも出力必須。

## サマリ

| 観点 | 件数 | 概要 |
|------|------|------|
| テンプレート改善 | 0 件（候補 0） | 既存 Phase 12 strict 7 + Part1/Part2 テンプレートで本タスクを過不足なく表現できた |
| ワークフロー改善 | 1 件（候補） | 「同一 account workers.dev loopback × service-binding transport」を web-api transport 設計の横断ガイドライン化候補 |
| ドキュメント改善 | 1 件（候補） | localhost 焼き込み grep gate の allowlist 規約（`// localhost-allow:local-fallback`）を skill reference 化候補 |

## 1. テンプレート改善

- 改善点: **なし**。
- 根拠: 本タスクは NON_VISUAL の transport / env / config 修正であり、既存テンプレート（main / implementation-guide Part1+Part2 / system-spec-update-summary の Step1-A/1-B/1-C/Step2 / changelog / unassigned / skill-feedback）で全要件を表現できた。視覚証跡は `## 視覚証跡` に NON_VISUAL 明記で対応でき、heading-only reject 回避のための「各 Part 本文 3 行以上」ガイドも既知の運用知見で充足。テンプレート側の不足は検出されなかった。

## 2. ワークフロー改善（候補 1 件）

### W-1: workers.dev loopback × service-binding transport の横断ガイドライン化

| 項目 | 内容 |
|------|------|
| 観点 | ワークフロー改善 / 設計 anti-pattern の再発防止 |
| 背景 | 同一 Cloudflare account の `*.workers.dev` への外向き plain `fetch()` は loopback 404 になる、という落とし穴を **public.ts だけ** 回避し authed / proxy / auth route を取りこぼした（task-05a の取りこぼし）。本 workflow がその残課題を完結している |
| 候補 | 「Cloudflare Workers から同一 account の別 Worker を呼ぶ server-side fetch は、必ず service-binding（`API_SERVICE`）を最優先する。HTTP fallback は local 限定（fail-closed）にする」を web-api transport 設計の横断ガイドライン（`task-specification-creator` の references / lessons）として昇格 |
| 反映タイミング | 本 waveで aiworkflow artifact inventory の lessons（L-SASR-001..004）へ反映 |
| 効果 | 新規 web→api 経路を追加する際に「transport 選択を 1 か所（`resolveApiFetch` 相当）に集約し binding 優先」を初期設計で強制でき、部分対応の取りこぼし（public のみ → authed 漏れ）を構造的に防げる |

## 3. ドキュメント改善（候補 1 件）

### D-1: localhost 焼き込み allowlist 規約の reference 化

| 項目 | 内容 |
|------|------|
| 観点 | ドキュメント / CI gate 規約の明文化 |
| 背景 | task-18 で `:8888` 検出を謳いつつ専用 gate script が実在せず、`apps/web/src` の `:8787` / `localhost` 焼き込みを検出できていなかった（S3 が CI 未検出だった構造原因） |
| 候補 | Lane C で新設する `verify-no-localhost-bake.sh` の allowlist 規約（local fallback 行に限り `// localhost-allow:local-fallback` を行末/直前行に付与・client bundle 混入は無条件 fail・test/spec/__tests__ は除外）を、grep gate 設計の reference として明文化 |
| 反映タイミング | 本 waveで `verify-no-localhost-bake.sh` と aiworkflow artifact inventory に反映 |
| 効果 | 「local fallback を 1 系統に限定し allowlist コメントで識別」という規約を再利用でき、新規 localhost リテラル混入時の誤検出/見逃しを抑える |

## 結論

- テンプレート改善は 0 件（現行テンプレートで充足）。
- ワークフロー改善 W-1 / ドキュメント改善 D-1 は aiworkflow artifact inventory と実装済み gate へ反映済み。task-specification-creator template 変更は不要。
