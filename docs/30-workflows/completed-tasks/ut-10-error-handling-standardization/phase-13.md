# Phase 13: PR 作成（pending_user_approval）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-27 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 依存 Phase | Phase 1, Phase 2, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 11, Phase 12 |
| 状態 | **pending_user_approval** |

## 目的

Phase 1〜12 の成果物（共通基盤実装・グローバルエラーハンドラ・開発者ガイド・正本仕様反映・close-out レポート）をまとめ、`feat(ut-10): エラーハンドリング標準化` の PR ドラフトを作成する。
本タスクは UT-09 / UT-07 / UT-08 の前提となる横断基盤であり、レビュアーが「契約」「Workers 制約」「機密情報非開示」「型同期」の 4 点を即座に把握できる本文を提供する。

> **最重要制約: ユーザーの明示的な承認なしに PR 作成・コミット・push を行ってはならない。**
> 本 Phase の成果物は `outputs/phase-13/pr-draft.md` / `outputs/phase-13/merge-checklist.md` / `outputs/phase-13/local-check-result.md` / `outputs/phase-13/change-summary.md` の 4 点であり、**実 PR は作成しない**。

## 実行タスク

- ユーザー承認ゲートを通過する（承認確認）
- pr-draft.md（PR タイトル / 本文テンプレ）を作成する
- merge-checklist.md（マージ前チェックリスト）を作成する
- local-check-result.md（ローカル検証結果サマリー）を作成する
- change-summary.md（変更内容と Phase 12 正本同期の要約）を作成する
- ブランチ戦略（feature → dev → main）を確認する
- レビュー観点をレビュアー向けに整理する
- ユーザー承認後にのみ実 PR 作成コマンドを実行する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-12/system-spec-update-summary.md | 正本仕様への影響 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | PR 説明の API 仕様根拠 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-05/file-change-list.md | 実装変更ファイル一覧 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-06/security-leak-tests.md | セキュリティ検証の根拠 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-08/refactor-summary.md | リファクタ内容 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-09/test-result-summary.md | 品質ゲート結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-11/main.md | NON_VISUAL smoke 結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/index.md | PR タイトル・スコープの根拠 |
| 必須 | CLAUDE.md | ブランチ戦略・PR レビュー人数 |
| 参考 | https://github.com/daishiman/UBM-Hyogo/issues/12 | Issue #12 |

## ユーザー承認ゲート（最重要・必須）【実行禁止条項】

**本 Phase はユーザーの明示的な承認なしに進めてはならない。**

| ゲート項目 | 確認内容 | 承認状態 |
| --- | --- | --- |
| Phase 10 GO 判定確認 | outputs/phase-10/go-nogo.md が GO であること | 要確認 |
| Phase 11 NON_VISUAL smoke 全 PASS | S-1〜S-5 すべて PASS | 要確認 |
| Phase 12 compliance-check 全 PASS | 8 チェック項目すべて PASS | 要確認 |
| 4 ファイル更新完了確認 | aiworkflow-requirements LOGS/SKILL + task-specification-creator LOGS/SKILL | 要確認 |
| pr-draft レビュー | ユーザーが PR タイトル・本文を確認 | **ユーザー承認待ち** |
| 機密情報の非混入確認 | API キー・本番 URL 実値・stack trace ログサンプル等が含まれていない | 要確認 |
| 実 PR 作成実行 | **ユーザーの明示的な指示があった場合のみ実行** | **承認待ち** |

承認が得られるまで、`gh pr create` / `git push` 等の **副作用を伴うコマンドは一切実行しない**。

## ブランチ戦略確認【必須】

CLAUDE.md に従い、以下の経路でマージする。

```
feat/ut-10-error-handling-standardization  --PR(1名レビュー)-->  dev  --PR(2名レビュー)-->  main
        (本 Phase で作成)                    (staging)                  (production)
```

| ブランチ | 環境 | レビュー人数 |
| --- | --- | --- |
| `feat/ut-10-error-handling-standardization` | ローカル | 不要 |
| `dev` | Cloudflare staging | 1 名 |
| `main` | Cloudflare production | 2 名 |

## PR タイトル案【必須】

```
feat(ut-10): エラーハンドリング標準化（ApiError / withRetry / D1 補償処理）
```

## PR 本文テンプレ【必須】

出力: `outputs/phase-13/pr-draft.md`

```markdown
## 概要

UBM 兵庫支部会メンバーサイトにおいて、API エラーレスポンス形式・Sheets リトライ戦略・D1 補償処理・構造化ログを横断標準化します。
本 PR は UT-09（Sheets→D1 同期）／ UT-07（通知）／ UT-08（モニタリング）の前提となる共通基盤を提供します。

Closes #12

## 変更ファイル一覧

### 共通基盤（@ubm-hyogo/shared）

- `packages/shared/src/errors.ts` — `ApiError` 型・UBM コード体系（UBM-1xxx / 4xxx / 5xxx / 6xxx）
- `packages/shared/src/retry.ts` — `withRetry`（指数バックオフ・jitter・isRetryable）
- `packages/shared/src/db/transaction.ts` — `withCompensation`（D1 補償処理テンプレ）
- `packages/shared/src/logging.ts` — 構造化ログフォーマット
- 各実装に対応する Vitest 単体・契約テスト

### apps/api

- `apps/api/src/middleware/error-handler.ts` — Hono `onError` ベースのグローバルエラーハンドラ
- `apps/api/docs/error-handling.md` — 開発者向け実装ガイド（中学生レベル + 技術詳細の 2 パート）

### apps/web

- `apps/web/app/lib/api-client.ts` — `ApiError` 型同期（`@ubm-hyogo/shared` から再エクスポート）

### ドキュメント / 正本仕様

- `docs/30-workflows/ut-10-error-handling-standardization/` 配下 phase-01〜phase-13 + outputs
- `.claude/skills/aiworkflow-requirements/references/error-handling.md`（新規）
- `.claude/skills/aiworkflow-requirements/references/interfaces-shared.md` / `interfaces-api.md`（更新）
- `.claude/skills/aiworkflow-requirements/references/topic-map.md`（再生成）
- `.claude/skills/aiworkflow-requirements/{LOGS.md, SKILL.md}` / `.claude/skills/task-specification-creator/{LOGS.md, SKILL.md}`

## テスト結果サマリー

- Phase 9 単体・契約テスト: 全 PASS（詳細: `outputs/phase-09/test-result-summary.md`）
- Phase 11 自動 smoke S-1〜S-5: 全 PASS
  - S-1: `apps/api` 起動 → 意図 500 → `application/problem+json` 形式で返却
  - S-2: Sheets 5xx 模擬 → `withRetry` リトライ後に構造化ログで失敗記録
  - S-3: D1 batch 部分失敗 → 補償処理発火・整合性回復
  - S-4: 構造化ログ必須フィールド・機密フィールドマスク
  - S-5: `apps/web` 側 `ApiError` 型同期 typecheck PASS

## NON_VISUAL タスクの根拠

本タスクはバックエンド・SDK 標準化のみで UI 変更を伴わないため、screenshot は作成していません（`outputs/phase-11/screenshot-plan.json` の `mode: "NON_VISUAL"` を参照）。
代替証跡として自動 smoke 実行ログ（`manual-smoke-log.md`）と既知制限リストを残しています。

## スコープ外（後続タスクへ委譲）

| 委譲先 | 内容 |
| --- | --- |
| UT-09 | Cron / Cloudflare Queues 経由の遅延リトライ実装、Sheets→D1 業務ロジック側の例外マッピング |
| UT-07 | dead letter → Slack / メール通知連携 |
| UT-08 | 構造化ログ → メトリクス取り込み・アラート定義 |
| 別途 UI 実装タスク | apps/web 側のトースト・モーダル等のエラー表示 UI |

## 既知制限（Workers 制約由来）

- Workers in-request での `setTimeout` 長時間ウェイト不可 → in-request リトライは最大 1 回まで
- D1 ネスト TX 非サポート → compensating transaction で補完
- D1 `db.batch()` 部分失敗の自動ロールバック非対応 → 同上

詳細: `outputs/phase-11/main.md` の既知制限リスト L-1〜L-8。

## レビュー観点

レビュアーには以下 4 点を中心に確認をお願いします。

1. **契約**: `ApiError` が RFC 7807 準拠で、`apps/web` の API クライアントと型整合しているか
2. **Workers 制約**: `withRetry` が in-request では bounded（最大 1 回）に制限されているか
3. **機密情報非開示**: stack trace / SQL 文 / 外部 API レスポンス本文がクライアントに漏れていないか
4. **正本仕様反映**: aiworkflow-requirements 側の `error-handling.md` / `interfaces-*.md` が PR と整合しているか
```

## merge-checklist.md【必須】

出力: `outputs/phase-13/merge-checklist.md`

| # | チェック項目 | コマンド / 確認方法 | 状態 |
| --- | --- | --- | --- |
| 1 | typecheck green | `mise exec -- pnpm typecheck` | spec_created |
| 2 | lint green | `mise exec -- pnpm lint` | spec_created |
| 3 | unit + contract test green | `mise exec -- pnpm test` | spec_created |
| 4 | build green | `mise exec -- pnpm build` | spec_created |
| 5 | link checklist green | `outputs/phase-11/link-checklist.md` 全リンク解決 | spec_created |
| 6 | mirror parity（artifacts.json 同期） | `diff` で 0 件 | spec_created |
| 7 | acceptance criteria all green | AC-1〜AC-7 全充足（Phase 7 / 10 で確認） | spec_created |
| 8 | NON_VISUAL 証跡完備 | screenshot-plan.json `mode: NON_VISUAL` + manual-smoke-log.md | spec_created |
| 9 | 4 ファイル更新完了 | aiworkflow-requirements LOGS/SKILL + task-specification-creator LOGS/SKILL | spec_created |
| 10 | 機密情報非混入 | API キー・本番 URL 実値・実 stack trace ログがリポジトリに含まれない | spec_created |
| 11 | Issue #12 リンク | PR 本文に `Closes #12` | spec_created |
| 12 | ブランチ戦略遵守 | `feat/ut-10-...` → `dev` → `main` | spec_created |

## 実 PR 作成手順【ユーザー承認後のみ】

> 以下は **承認後にのみ実行する参考コマンド**であり、本 Phase 仕様書作成段階では実行しない。

```bash
# feature ブランチ作成
git fetch origin main
git checkout -b feat/ut-10-error-handling-standardization origin/main

# ステージング（個別ファイル指定。-A は使わない）
git add packages/shared/src/errors.ts \
        packages/shared/src/retry.ts \
        packages/shared/src/db/transaction.ts \
        packages/shared/src/logging.ts \
        apps/api/src/middleware/error-handler.ts \
        apps/api/docs/error-handling.md \
        apps/web/app/lib/api-client.ts \
        docs/30-workflows/ut-10-error-handling-standardization/ \
        .claude/skills/aiworkflow-requirements/ \
        .claude/skills/task-specification-creator/

# コミット（HEREDOC でフォーマット保持）
git commit -m "$(cat <<'EOF'
feat(ut-10): エラーハンドリング標準化（ApiError / withRetry / D1 補償処理）

- @ubm-hyogo/shared に errors / retry / db/transaction / logging を追加
- apps/api に Hono onError ベースのグローバルエラーハンドラを実装
- apps/web の ApiError 型を @ubm-hyogo/shared と同期
- 開発者向け error-handling.md（2 パート構成）と正本仕様を整備

Closes #12
EOF
)"

# PR 作成（dev ブランチ向け、1 名レビュー）
gh pr create \
  --title "feat(ut-10): エラーハンドリング標準化（ApiError / withRetry / D1 補償処理）" \
  --body-file docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-13/pr-draft.md \
  --base dev \
  --head feat/ut-10-error-handling-standardization
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定の前提として PR 作成 |
| Phase 11 | NON_VISUAL smoke 結果を PR 本文「テスト結果サマリー」に引用 |
| Phase 12 | documentation-changelog を変更ファイル一覧の根拠として使用 |

## 多角的チェック観点（AIが判断）

- 価値性: PR が Issue #12 を close し、UT-09 / UT-07 / UT-08 の前提として読みやすい説明になっているか。
- 実現性: merge-checklist が CI 上で機械的に検証可能な項目で構成されているか。
- 整合性: pr-draft の変更ファイル一覧が Phase 12 の documentation-changelog と一致しているか。
- 運用性: dev → main の 2 段マージ（1 名 → 2 名レビュー）に必要な情報を本文が網羅しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート確認 | 13 | pending_user_approval | **承認なし禁止** |
| 2 | pr-draft.md 作成 | 13 | spec_created | PR 本文テンプレ |
| 3 | merge-checklist.md 作成 | 13 | spec_created | 12 項目 |
| 4 | 機密情報非混入チェック | 13 | spec_created | grep ベース確認 |
| 5 | 実 PR 作成 | 13 | pending_user_approval | **承認後のみ** |
| 6 | CI 確認 | 13 | pending_user_approval | PR 作成後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-draft.md | PR タイトル・本文テンプレ（実 PR は作成しない） |
| ドキュメント | outputs/phase-13/merge-checklist.md | マージ前チェックリスト（12 項目） |
| ドキュメント | outputs/phase-13/local-check-result.md | ローカル検証コマンドと結果サマリー |
| ドキュメント | outputs/phase-13/change-summary.md | 変更内容・正本同期・未タスク引き継ぎの要約 |
| メタ | artifacts.json | Phase 状態を pending_user_approval として記録 |

> **本 Phase では実 PR を作成しない。** 上記 4 ファイルのみが本 Phase の成果物。実 PR 作成はユーザー承認後の別アクションとして扱う。

## 完了条件

- [ ] `outputs/phase-13/pr-draft.md` が PR タイトル・本文テンプレを含めて作成されている
- [ ] `outputs/phase-13/merge-checklist.md` の 12 項目が記載されている
- [ ] `outputs/phase-13/local-check-result.md` に Phase 9〜12 の検証結果が転記されている
- [ ] `outputs/phase-13/change-summary.md` に変更範囲・正本同期・未タスク引き継ぎが記載されている
- [ ] ユーザー承認ゲートの全項目が「要確認」または「承認待ち」として明示されている
- [ ] ブランチ戦略（feature → dev → main）が pr-draft に反映されている
- [ ] レビュー観点 4 点（契約 / Workers 制約 / 機密情報非開示 / 正本仕様反映）が本文に含まれている
- [ ] artifacts.json の Phase 13 が `pending_user_approval` で記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed（実 PR 作成はユーザー承認待ちのため除外）
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述（なし：最終 Phase）
- artifacts.json の該当 phase を `pending_user_approval` として更新

## ユーザー承認待ちステータス【最終宣言】

本 Phase の状態は **pending_user_approval** である。
ユーザーが pr-draft.md および merge-checklist.md を確認し、明示的に「PR 作成を実行してよい」と指示した場合に限り、上記「実 PR 作成手順」を実行する。
それまでは PR 作成・コミット・push・GitHub 上の副作用を伴うコマンドを **一切実行しない**。

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項: PR マージ後、UT-09 / UT-07 / UT-08 の担当者に `@ubm-hyogo/shared` の `errors` / `retry` / `db/transaction` / `logging` 公開 API と `apps/api/docs/error-handling.md` の存在を通知する。
- ブロック条件: ユーザー承認がない場合は実 PR 作成を実行しない。
