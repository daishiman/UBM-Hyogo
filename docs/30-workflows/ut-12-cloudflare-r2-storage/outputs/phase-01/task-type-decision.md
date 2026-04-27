# Phase 1 成果物: タスクタイプ判定 (task-type-decision.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 / Cloudflare R2 ストレージ設定 |
| Phase | 1 |
| 作成日 | 2026-04-27 |
| 判定区分 | spec_created / docs-only |

## 1. 判定結果

**タスク種別: `spec_created`（docs-only）**

本タスクは Cloudflare R2 ストレージの設定方針・runbook・binding 規約・CORS / Token 戦略・モニタリング方針を文書化するのみで、実バケット作成・実 Token 発行・実コード変更は一切行わない。

## 2. 判定根拠

| # | 根拠 | 詳細 |
| --- | --- | --- |
| R-1 | GitHub Issue #15 が CLOSED 状態 | 仕様書として正式化する目的で再オープンせず docs-only タスクで完結 |
| R-2 | 着手前提が「ファイルアップロード機能の計画策定済み」 | MVP では未計画のため、本タスクでは「将来着手時に止まらない設計」整備に限定 |
| R-3 | 実バケット作成は無料枠を消費する | 不要なリソース作成を避けるため、実環境適用は将来タスクへ委譲 |
| R-4 | 実 Token 発行は GitHub Secrets 登録が前提 | 04 タスクの secret sync が完了したタイミングで初めて実行する設計 |
| R-5 | apps/api のコード変更を伴わない | 不変条件 5（apps/web からの R2 直接アクセス禁止）の境界を文書側で確定するに留める |
| R-6 | 上流タスク（01b / 04）の完了が前提 | 本タスクは仕様策定のみで完結し、実適用は上流完了後の将来タスクで実行 |

## 3. spec_created の境界

### 本タスクで完結する事項

- 全 Phase の outputs/phase-XX/* ドキュメント作成
- artifacts.json の更新
- system-spec / topic-map / quick-reference / lessons-learned の同期（Phase 12）
- implementation-guide.md の作成（Phase 12）
- unassigned-task-detection.md の生成（Phase 12）

### 本タスクで完結しない事項（将来タスク委譲）

- 実 R2 バケット (`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`) の作成
- 実 API Token (`CLOUDFLARE_R2_TOKEN`) の発行
- 実 CORS JSON の Cloudflare 適用
- 実 smoke test (PUT/GET) の実行
- `apps/api/wrangler.toml` への実差分コミット（Phase 5 runbook を再生する将来タスクで実行）
- UT-16 完了後の AllowedOrigins 実値差し替え

## 4. AC の状態定義（spec_created の境界）

| AC | 本タスクで完結する形 | 実環境状態（将来） |
| --- | --- | --- |
| AC-1 | 命名規約と作成 runbook を Phase 5 で文書化 | 未作成 |
| AC-2 | wrangler.toml 追記差分を Phase 2 / 8 で文書化 | 未適用 |
| AC-3 | 専用 Token 採用方針と Secret 名を Phase 2 / 5 で文書化 | 未発行 |
| AC-4 | smoke test コマンド手順を Phase 5 / 11 で文書化 | 未実行 |
| AC-5 | CORS JSON 設計と適用手順を Phase 2 / 5 で文書化 | 未適用 |
| AC-6 | モニタリング方針 + UT-17 連携 TODO を Phase 2 / 12 で文書化 | 未設定 |
| AC-7 | binding-name-registry.md を Phase 5 で生成 | 生成済み（docs として） |
| AC-8 | プライベート方針 + UT-17 連携を Phase 2 / 5 で文書化 | 未適用 |

## 5. spec_created タスクの完了基準

以下を満たした時点で本タスクは完了とする。

- [x] 全 Phase の outputs が作成されている
- [x] artifacts.json が `phases[].state = completed` に更新されている
- [x] 機密情報（Account ID / 実 Token / 実 origin）が成果物に直書きされていない
- [x] 将来タスクが Phase 5 runbook を再生して実環境を構築できる粒度で記述されている
- [x] system-spec / topic-map / quick-reference / lessons-learned が同期されている（Phase 12）

## 6. 関連参照

- `index.md` 「状態定義（spec_created の境界）」セクション
- `requirements.md` セクション 3
- `.claude/skills/task-specification-creator/references/spec-update-workflow.md`
