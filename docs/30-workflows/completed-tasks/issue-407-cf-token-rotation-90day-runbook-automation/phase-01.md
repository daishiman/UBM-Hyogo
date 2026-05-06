# Phase 1: 要件定義 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: 本タスクは (a) `docs/30-workflows/operations/` 配下に runbook と実施記録テンプレを新規作成し、(b) `.github/workflows/cf-token-rotation-reminder.yml` を新規作成する副作用を持つ。yaml workflow は GitHub Actions schedule trigger により実 GitHub Issue を自動起票するため運用システムへの副作用が継続的に発生する。CONST_004 に従い docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 1 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| github_issue | #407 (CLOSED) |
| 想定実行者 | 人間オペレーター + Claude Code（user approval ゲート併用） |

## 目的

長命 Cloudflare API Token の 90 日 rotation を、(a) 手順違反を起こしにくい runbook、(b) 期日通知を取りこぼさない自動 Issue 起票 workflow の 2 軸で確立する。Wave 1（runbook）と Wave 2（自動化）を本サイクル内で完結させ、初回 rotation 期日（U-FIX-CF-ACCT-01 で投入された最小 scope Token の発行から 90 日）を逃さない運用基盤にする。

ビジネス価値:

- 漏洩時の blast radius を 90 日に短縮
- staging-first / 24h 並行 / rollback の 3 段ガードで rotation 失敗の業務影響をゼロ化
- Wave 2 自動化で「rotation 期日を忘れる」ヒューマンエラーを構造的に排除
- 実施記録（実施日 / 失効日 / 検証結果。Token 値 / Token ID / scope 値は記録しない）の蓄積により、四半期 rotation の運用負荷とインシデント傾向を観測可能にする

## 入力

| 種別 | 値 |
| --- | --- |
| 上流タスク | U-FIX-CF-ACCT-01（最小 scope Cloudflare API Token が production に投入済みであること） |
| 内容ソース | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md` |
| 関連知見 | `docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md`（D1 health DB token rotation SOP） |
| Secrets 正本 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| インフラ正本 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |
| 1Password vault | Cloudflare API Token Item（既存）。expiry 90 日 reminder 設定対象 |
| GitHub Variables | `CF_TOKEN_ISSUED_AT`（Wave 2 自動化で参照する発行日メタ。Phase 2 で導入を確定） |
| GitHub Secrets | `CLOUDFLARE_API_TOKEN`（既存。staging/production env 別） |
| CLI ラッパー | `scripts/cf.sh`（CLAUDE.md「Cloudflare 系 CLI 実行ルール」） |

## 出力（成果物）

本タスクの最終成果物は Phase 5 以降の実装で作成されるが、Phase 1 では以下のパスと役割を確定する。

| # | 種別 | パス | Wave |
| --- | --- | --- | --- |
| 1 | runbook 本文 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | 1 |
| 2 | 実施記録テンプレ + 蓄積ファイル | `docs/30-workflows/operations/cf-token-rotation-log.md` | 1 |
| 3 | 自動 Issue 起票 workflow | `.github/workflows/cf-token-rotation-reminder.yml` | 2 |
| 4 | secrets 正本への参照リンク追記（任意） | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 1 |

仕様書側 outputs:

- `outputs/phase-01/main.md` — 本 Phase の確定事項
- `outputs/phase-NN/main.md` — Phase 2-13 の各成果物

## 機能要件

### Wave 1 — runbook

1. runbook が以下章立てを完備すること。
   1. 概要 / 90 日選定根拠
   2. 用語と前提（最小 scope Token / staging-first / 24h 並行 / 旧 Token 無効化 → 削除の 2 段階）
   3. 事前確認チェックリスト（`bash scripts/cf.sh whoami`、1Password expiry reminder、現行 Token 残期間、staging Workers / D1 健全性）
   4. staging rotation 手順（新 Token 発行 → `gh secret set --env staging CLOUDFLARE_API_TOKEN` → staging smoke → 24h 観察 → 旧 staging Token Dashboard で無効化）
   5. production rotation 手順（staging 全 PASS を承認ゲートで確認 → 新 Token 発行 → `gh secret set --env production CLOUDFLARE_API_TOKEN` → 24h 並行運用 → production smoke → 旧 production Token 無効化 → 24h 後に削除）
   6. rollback 手順（旧 Token Dashboard 再有効化 → `gh secret set` で再注入 → 新 Token 失効）
   7. 1Password expiry reminder 設定手順（参照ベースの記述のみ。Token 値非掲載）
   8. 実施記録手順（`cf-token-rotation-log.md` への追記、テンプレ項目）
   9. 既知の落とし穴（24h 並行中の deploy 衝突 / wrangler キャッシュ / GitHub Environments の required reviewers との順序）
2. runbook が「staging 失敗時は production rotation を実施しない」ゲートを文中で明示すること。
3. runbook 中に Cloudflare API Token 値、Token ID、scope の具体値が現れないこと（参照とプレースホルダのみ）。
4. 実施記録テンプレに以下フィールドが含まれること: 実施日、operator、staging 新 Token 発行時刻、staging smoke PASS 時刻、production 新 Token 発行時刻、24h 並行終了時刻、旧 Token 無効化時刻、旧 Token 削除時刻、検証結果サマリ、関連 PR / Issue。Token 値 / ID は含めない。

### Wave 2 — 自動化（`.github/workflows/cf-token-rotation-reminder.yml`）

1. `schedule:` トリガーが日次 cron（UTC 例: `0 0 * * *`）で発火すること。
2. `workflow_dispatch:` を備え、`dry_run: true|false` 入力で動作分岐できること。
3. `permissions:` が `issues: write` / `contents: read` の最小権限に限定されていること。
4. 発行日メタ取得元として GitHub Variables（`vars.CF_TOKEN_ISSUED_AT`、ISO 8601）を採用し、85 日経過判定を `bash`（または GitHub Actions 標準アクション）で計算すること。
5. 85 日以上経過 かつ 同一 rotation サイクルの未 close Issue が存在しない場合のみ、`gh issue create` 相当 step が Issue を起票すること。重複起票防止のため `gh issue list --search "in:title cf-token-rotation"` 等で既存確認する。
6. 起票 Issue の本文に以下を含むこと: runbook 相対リンク、前回実施記録（`cf-token-rotation-log.md`）リンク、現在の経過日数、推奨実施期日、CODEOWNERS（`@daishiman`）アサイン。
7. `dry_run: true` 時は Issue を起票せず本文プレビューを `$GITHUB_STEP_SUMMARY` に出力すること。

## 非機能要件

| 観点 | 要求 |
| --- | --- |
| 安全性 | runbook / 実施記録 / workflow yaml / step ログに Token 値・Token ID・scope 詳細が現れない |
| 再現性 | 全 CLI 操作は `bash scripts/cf.sh` 経由（CLAUDE.md ルール）。`wrangler` 直接呼び出し禁止 |
| 最小権限 | workflow `permissions:` は `issues: write` / `contents: read` のみ。`secrets:` は不要（rotation 自動化はしない方針 — Wave 2 は通知のみ） |
| 監査性 | 実施記録 (`cf-token-rotation-log.md`) は append-only に運用。過去履歴の改変を行わない |
| 操作の明示性 | production rotation は user approval gate（G2）で停止。dry-run 経由を Wave 2 に常設 |
| アクセシビリティ | runbook は markdown 標準構造（見出し階層、表、コードブロック言語明示）に従う |
| Free-tier 遵守 | GitHub Actions schedule の月次稼働時間を free-tier 内に収める（日次 1 回 < 1 分想定） |

## 制約条件

1. **scope creep 禁止**: 「Token 値の自動発行」「scope 設計の自動化」「rotation 全自動化」は本タスク scope 外（U-FIX-CF-ACCT-01-DERIV-03 の Scope Out に整合）。Wave 2 は通知（Issue 起票）に限定する。
2. **Token 値非掲載**: Cloudflare API Token 値 / Token ID / scope 値を runbook / 実施記録 / workflow yaml / コミットメッセージ / PR 説明に書かない（CLAUDE.md「ローカル `.env` の運用ルール」と整合）。
3. **直接 wrangler 呼び出し禁止**: 全コマンドは `bash scripts/cf.sh` 経由。
4. **CONST_007 遵守**: Wave 1 と Wave 2 を本タスクで完結させ、後続 wave へ先送りしない。`workflow yaml の dry-run 動作確認` も Phase 11 で実測する。
5. **OIDC 化との非干渉**: 本 runbook は long-lived API Token 前提。OIDC 化（DERIV-01）後は本 runbook を改訂対象とする旨を runbook 末尾に明記する。
6. **CONST_005 必須項目**: 変更対象ファイル一覧、yaml 構造、入出力、テスト方針、ローカル実行コマンド、DoD を Phase 02 / 03 で具体化する。

## 関係者・承認ゲート

| ゲート | 承認者 | タイミング |
| --- | --- | --- |
| G1: workflow yaml 投入 | user | `.github/workflows/cf-token-rotation-reminder.yml` を main に merge する PR レビュー前 |
| G2: production rotation 実行（runbook 運用時） | user | runbook の production 章「新 Token 発行」直前。本仕様書では G2 が runbook 内に存在することを定義のみ行う |
| G3: workflow dry-run 実測 | user | Phase 11 で `workflow_dispatch` dry-run を打つ直前 |
| G4: 仕様書 PR 作成 | user | Phase 13 PR 作成直前 |

## DoD（index.md AC を Phase 1 チェックリストへ展開）

### Wave 1

- [ ] runbook の章立て 9 項目が Phase 2 設計で確定している
- [ ] 実施記録テンプレ項目（10 項目以上、Token 値非含有）が Phase 2 で確定している
- [ ] 1Password expiry reminder 設定手順が「参照のみ」の形で runbook 章立てに含まれている
- [ ] runbook / 実施記録テンプレに Token 値・ID・scope 値の混入箇所がないことを Phase 3 レビュー観点に組み込んでいる

### Wave 2

- [ ] `cf-token-rotation-reminder.yml` の `on:` / `permissions:` / `jobs:` 構造が Phase 2 で確定している
- [ ] 85 日経過判定ロジック（input: `vars.CF_TOKEN_ISSUED_AT` / 計算: `date -d` または GitHub Actions 標準）が Phase 2 で確定している
- [ ] 重複起票防止ロジック（`gh issue list --search`）が Phase 2 で確定している
- [ ] dry-run モードの分岐が Phase 2 で確定している
- [ ] CODEOWNERS への自動 assignee 設定が Phase 2 で確定している

### 共通

- [ ] 仕様書冒頭に `[実装区分: 実装仕様書]` が記載されている
- [ ] 機密値（Token 値 / ID / scope 値）非掲載が Phase 1〜13 を通じて貫徹されている
- [ ] `outputs/phase-01/main.md` を作成

## 参照資料

- `docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/index.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `scripts/cf.sh`
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール / `.env` 運用ルール / governance）

## 多角的チェック観点

- secret 取り扱い不変条件: 仕様書全体を grep して Token 値らしき文字列が現れないこと
- governance: `.github/workflows/**` は CODEOWNERS 対象 path であり、CODEOWNERS に owner が明示されていること（既存設定で吸収できる前提）
- 90 日選定根拠が「経験則」と明示され、後続 wave で短縮 / 延長判断ができる構造になっていること
- 24h 並行運用の根拠（検知前失効リスク vs blast radius のトレードオフ）が runbook で参照可能になっていること

## サブタスク管理

- [ ] 内容ソース（unassigned-task DERIV-03）と実差分を比較し、本仕様書で扱う章立てを抽出
- [ ] runbook / 実施記録 / workflow yaml の 3 成果物パスを確定
- [ ] G1〜G4 の approval gate を Phase 5 / 11 で参照可能に列挙
- [ ] `outputs/phase-01/main.md` を作成

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] 上記 DoD の全項目に取得手段（runbook 章立て / yaml 構造 / 実施記録テンプレ）が紐付いている
- [ ] approval gate の場所と実行コマンドが文書化されている
- [ ] 機密値非掲載のチェック観点が Phase 3 レビュー項目に渡せる粒度で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] Wave 1 / Wave 2 を本サイクル内で完結する設計（CONST_007）になっている
- [ ] 本 Phase で commit / push / PR / Token 発行 / secret 投入を実行していない

## 次 Phase への引き渡し

Phase 2 へ以下を渡す:

- runbook 章立て 9 項目
- 実施記録テンプレ 10+ 項目
- workflow yaml の `on:` / `permissions:` / `jobs:` 構造設計の制約
- 85 日経過判定ロジックの input 源（`vars.CF_TOKEN_ISSUED_AT`）
- 機密値非掲載 invariant
- approval gate G1〜G4

## 実行タスク

- [ ] phase-01 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 統合テスト連携

- Phase 11 で workflow yaml の dry-run 実測（`workflow_dispatch` 経由）と runbook の手動机上トレースを行う。
