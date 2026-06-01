# Phase 12 — ドキュメント整合 / 概要（main）

> 本ワークフロー: `issue-264-cron-schedule-free-tier-guard`
> 実装区分: 実装仕様書（implementation spec） / NON_VISUAL / `workflow_state = implemented_local_evidence_captured` / base = `dev`
> 本サイクルで guard test を実装済み。runtime deploy・commit/PR は user-gated（未実行）。

## 1. 再スコープ要約（中学生にも分かる一言）

「フォーム回答を自動取得する“目覚まし時計（cron）”が、Cloudflare 無料プランの上限である
**3 本**をうっかり超えないよう、**自動で見張るテスト**を作る」ための実装仕様書。

原 issue #264 は「Google **Sheets**→D1 同期の cron `0 */6 * * *` を staging で 6h / 1h / 5min の
3 段階に変えて 24h 実測し、最適間隔を ADR で確定する」だった。最新コードを確認した結果、
この前提は obsolete（陳腐化）していたため、現行 Forms ベース構成に最適化して
「**デプロイ済み 3-cron スケジュールの free-tier 回帰ガード（新規 spec test）＋ ADR / 無料枠予算**」へ
再定義した。

## 2. obsolete 判定（原 issue 前提 → 現行コード）

| 観点 | issue #264 の前提 | 現行コード（2026-05-31） | 出典 | 判定 |
| --- | --- | --- | --- | --- |
| 同期元 | Google **Sheets** API | Google **Forms** API へ完全移行 | `apps/api/src/jobs/sync-forms-responses.ts` | obsolete |
| 既定 cron | `0 */6 * * *`（6h） | **未デプロイ**（採用されず） | `wrangler.toml` に存在せず | obsolete |
| Sheets hourly `0 * * * *` | 稼働対象 | **手動限定に撤回**（cron 非登録） | `wrangler.toml` コメント / `index.ts` | obsolete |
| デプロイ済み cron | 未確定（実測で決定） | **確定 3 本** `["0 18 * * *","*/15 * * * *","*/5 * * * *"]` | `wrangler.toml:14,91,173` | 確定済み |
| 間隔決定理由 | quota/SLA を 24h 実測 | **free-plan account cron 上限 3 本**に収める統合 | `deployment-cloudflare.md:85-89,269` | 解析的に確定 |

**結論**: 「Sheets を 6h/1h/5min で 24h 実測」タスクは不要（obsolete）。間隔は free-plan 制約で既に確定・
デプロイ済み。残課題は「その 3-cron 制約を守る**回帰ガードが存在しない**」点であり、本ワークフローはここを
コード成果物（guard test）＋ ADR / 予算文書で埋める。

## 3. 成果物一覧（本サイクルで作る・本サイクルで guard test 実装済み）

| # | 成果物 | パス | サイクル |
| --- | --- | --- | --- |
| 1 | 回帰ガードテスト（新規） | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` | 本サイクル |
| 2 | ADR-264-01（3-cron を free-plan 上限として固定） | `outputs/phase-12/implementation-guide.md` 内 | 本サイクル（spec） |
| 3 | 無料枠予算表（解析的予算） | `outputs/phase-12/implementation-guide.md` 内 | 本サイクル（spec） |

## 4. strict 7 の役割

| # | File | 役割 |
| --- | --- | --- |
| 1 | main.md | 本ファイル。再スコープ要約・obsolete 判定・成果物一覧・境界。 |
| 2 | implementation-guide.md | 実装ガイド（最重要）。変更ファイル表・`extractCrons` 仕様・テストスケルトン・4 assertion・ADR-264-01・無料枠予算表・DoD・実行コマンド。 |
| 3 | system-spec-update-summary.md | system spec 同期サマリ（deployment-cloudflare back-link / workflow ledger / quick reference 同期済み）。 |
| 4 | documentation-changelog.md | 本ワークフローで作成した docs 一覧（新規）。 |
| 5 | unassigned-task-detection.md | 未タスク検出（本 WF 自体が U-UT01-02 の再スコープ実体）。 |
| 6 | skill-feedback-report.md | task-specification-creator / aiworkflow-requirements への feedback。 |
| 7 | phase12-task-spec-compliance-check.md | canonical 9 見出し compliance。implemented_local_evidence_captured verdict。 |

## 5. 境界（本サイクル = guard test 実装済み）

- 本サイクルで `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` を追加し、focused Vitest 16 tests PASS を取得済み。
- staging cron tail の spot-check、commit / push / PR / Issue 状態変更 /
  Cloudflare deploy / D1 apply / secret injection は **すべて user-gated**。
- issue #264 は **CLOSED のまま**（GitHub mutation なし）。
- free-tier 制約: 依存追加 0 / paid Cloudflare 機能なし / runtime deploy なし。
