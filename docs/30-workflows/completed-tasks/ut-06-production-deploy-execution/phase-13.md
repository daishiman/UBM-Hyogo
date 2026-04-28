# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-27 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |

> **重要: このフェーズはユーザーの明示的な承認なしに実行してはならない。**
> PR 作成・マージ操作・本番関連ファイルの push を行う前に、必ずユーザーに確認を取ること。
> Phase 5 で実行した本番デプロイ実績を含む PR となるため、レビュー・マージ承認は通常以上に慎重に行う。

## 目的

Phase 1〜12 の成果物（タスク仕様書 13 Phase + outputs + 上流 runbook 統合 + 正本仕様反映）をまとめて PR を作成し、ユーザー承認を得てマージする。
本タスクは implementation タスクであり、Phase 5 で本番への実デプロイを既に実施した記録を含むため、PR 本文にデプロイ実績（実施日・コミット SHA・本番 URL の参照先・smoke test 結果）を簡潔に明示する。

## 実行タスク

- ユーザー承認ゲートを通過する（承認確認）
- local-check-result を確認する
- change-summary を作成する
- PR を作成する
- CI 確認と承認後のマージ手順を記録する
- artifacts.json の全 Phase を completed に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/deploy-execution-log.md | 本番デプロイ実績 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | smoke test 結果 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-07/ac-matrix.md | AC 完了トレース |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | PR タイトル・説明の根拠 |
| 参考 | CLAUDE.md | ブランチ戦略・PR レビュー人数 |

## 実行手順

### ステップ 1: ユーザー承認ゲート（必須）

**このステップはユーザーの明示的な承認なしに進めてはならない。**

1. Phase 10 の GO 判定が確認されていることを確認する
2. Phase 11 の smoke test が全件 PASS であることを確認する
3. Phase 12 の compliance-check が全 PASS であることを確認する
4. change-summary をユーザーに提示して承認を依頼する
5. ユーザーの明示的な承認を得た後にステップ 2 へ進む

### ステップ 2: local-check-result の確認

- `git status` で変更ファイルを確認する
- documentation-changelog と実際の変更ファイルが一致していることを確認する
- 機密情報（database_id 実値・本番 URL の認証情報・API トークン）がコミット対象に含まれていないことを確認する
- phase-*.md が全 13 ファイル存在することを確認する
- index.md の Phase 一覧状態が更新されていることを確認する

### ステップ 3: PR の作成

- feature ブランチが正しいこと（`feat/wt-12` 等）を確認する
- 変更ファイルをステージングする（`git add` は対象パスを明示）
- コミットメッセージを作成する（HEREDOC 形式）
- PR を作成する（Issue #8 は CLOSED のため `Refs #8` を使用）

## 承認ゲート（ユーザー承認必須）【必須】

| ゲート項目 | 確認内容 | 承認状態 |
| --- | --- | --- |
| Phase 10 GO 判定確認 | outputs/phase-10/go-nogo.md が GO であること | 要確認 |
| Phase 11 smoke test 全 PASS | outputs/phase-11/smoke-test-result.md が PASS であること | 要確認 |
| Phase 12 compliance-check | 全項目 PASS であること | 要確認 |
| change-summary レビュー | ユーザーが変更内容（仕様書整備 + 本番デプロイ実績記録）を把握していること | **ユーザー承認待ち** |
| 機密情報の非混入確認 | database_id 実値・本番 URL の認証情報・API トークンが含まれていないこと | 要確認 |
| Issue #8 取り扱い確認 | Issue #8 は CLOSED のままであり、PR では `Refs #8` を使うことの承認 | 要確認 |
| PR 作成実行 | **ユーザーの明示的な指示があった場合のみ実行** | **承認待ち** |

## local-check-result【必須】

PR 作成前に以下のコマンドで変更ファイルを確認する。

```bash
# 変更ファイルの確認
git status

# ステージング予定ファイルの確認
git diff --name-only

# 機密情報の混入チェック（database_id 実値が含まれていないか）
grep -r "database_id" \
  docs/30-workflows/ut-06-production-deploy-execution/ \
  --include="*.md" | grep -v "placeholder\|dummy\|<.*>"

# 本番 URL の認証情報・API トークン混入チェック
grep -rE "(CLOUDFLARE_API_TOKEN|Bearer [A-Za-z0-9]+)" \
  docs/30-workflows/ut-06-production-deploy-execution/

# Phase ファイル数の確認（13 ファイル必須）
ls docs/30-workflows/ut-06-production-deploy-execution/phase-*.md | wc -l
```

| チェック項目 | 期待値 | 状態 |
| --- | --- | --- |
| 変更ファイルが documentation-changelog と一致 | 一致 | pending |
| 機密情報（実 database_id・API トークン・認証情報）が含まれていない | 含まれていない | pending |
| phase-*.md が全 13 ファイル存在する | 13 ファイル | pending |
| index.md の Phase 一覧状態が更新されている | 全 Phase completed | pending |
| artifacts.json の全 Phase が completed | 13 件全て completed | pending |

## change-summary【必須】

### 変更概要

本 PR は UT-06 (本番デプロイ実行) タスクの仕様書整備と、Phase 5 で実施した本番初回デプロイの実績記録を含むものです。
OpenNext Workers（`apps/web`）/ Workers（`apps/api`）/ D1 の本番環境への初回デプロイ手順・実績・ロールバック runbook を文書化し、aiworkflow-requirements の deployment-cloudflare.md / deployment-core.md および 02-serial / 04-serial / 05b-parallel の runbook に統合します。

### 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
| --- | --- | --- |
| `docs/30-workflows/ut-06-production-deploy-execution/index.md` | 新規 / 更新 | タスク仕様書インデックス |
| `docs/30-workflows/ut-06-production-deploy-execution/phase-01.md` 〜 `phase-13.md` | 新規 | Phase 1〜13 の仕様書 |
| `docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-01/` 〜 `phase-13/` | 新規 | Phase 別成果物 |
| `docs/30-workflows/ut-06-production-deploy-execution/artifacts.json` | 新規 | 機械可読サマリー |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 更新 | 本番デプロイ実績追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | 更新 | go-live 完了記録追記 |
| `docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md` | 更新 | 本番 wrangler.toml 構造の統合 |
| `docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md` | 更新 | 本番 Secrets 配置確認結果統合 |
| `docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md` | 更新 | handoff 完了印追加 |

### 影響範囲

- 仕様書 + 正本仕様（aiworkflow-requirements / 上流 runbook）の更新
- 本番環境（OpenNext Workers / API Workers / D1）に対する Phase 5 の実デプロイ実績記録（実施日・コミット SHA・wrangler ver・本番 URL は参照先のみ記載）
- UT-08（モニタリング）/ UT-09（Sheets→D1 同期）/ 02-application-implementation 全体のクリティカルパス解放
- 後続タスク（UT-08 / UT-09 / カスタムドメイン DNS 移管 / 定期 D1 バックアップ自動化）への引き継ぎ記録

### 受入条件 AC-1〜AC-8 充足状況

| AC | 充足状態 | エビデンス |
| --- | --- | --- |
| AC-1: Web 本番 URL が 200 OK | TBD | Phase 12 documentation-changelog / outputs/phase-11/smoke-test-result.md から転記 |
| AC-2: API Workers `/health` が healthy | TBD | Phase 12 documentation-changelog / outputs/phase-11/smoke-test-result.md から転記 |
| AC-3: D1 migrations list に履歴記録 | TBD | Phase 12 documentation-changelog / outputs/phase-05/deploy-execution-log.md から転記 |
| AC-4: Workers→D1 binding 疎通 | TBD | Phase 12 documentation-changelog / outputs/phase-11/smoke-test-result.md から転記 |
| AC-5: smoke test 全件 PASS | TBD | Phase 12 documentation-changelog / outputs/phase-11/smoke-test-result.md から転記 |
| AC-6: deploy-execution-log.md に実績記録 | TBD | Phase 12 documentation-changelog / outputs/phase-05/deploy-execution-log.md から転記 |
| AC-7: D1 export バックアップ取得・保管場所記録 | TBD | Phase 12 documentation-changelog / outputs/phase-05/d1-backup-evidence.md から転記 |
| AC-8: ロールバック runbook 整備 | TBD | Phase 12 documentation-changelog / outputs/phase-02/rollback-runbook.md + outputs/phase-06/abnormal-case-matrix.md から転記 |

## Issue #8 取り扱い【必須】

**Issue #8 は既に CLOSED 状態のため、PR 本文では `Refs #8` で参照する（`Closes` は使用しない）。**

理由:
- Issue #8 は完了処理されており、PR で `Closes #8` を使うと既に閉じた Issue を再度 close しようとする操作になる
- 本タスクは「Issue 完了後の後追い仕様化 + 本番デプロイ実績記録」であるため、参照のみで十分
- 再オープンが必要と判断される場合（例: スコープ変更で別 Issue を起票したい場合）は、PR 作成前に別途ユーザーと相談する

## PR 作成手順

ユーザー承認後に以下のコマンドを実行する。

```bash
# feature ブランチの確認（既に feat/wt-12 等で作業している前提）
git status
git branch --show-current

# 変更ファイルのステージング（対象パスを明示）
git add docs/30-workflows/ut-06-production-deploy-execution/
git add .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
git add .claude/skills/aiworkflow-requirements/references/deployment-core.md
git add docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md
git add docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md
git add docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md

# コミット（HEREDOC 形式）
git commit -m "$(cat <<'EOF'
docs(ut-06): 本番デプロイ実行タスク仕様書と go-live 実績を追加

- Phase 1〜13 の仕様書を作成（implementation タスク）
- 本番初回デプロイ実績を outputs/phase-05 に記録
- aiworkflow-requirements (deployment-cloudflare / deployment-core) に go-live 記録を反映
- 02-serial / 04-serial / 05b-parallel runbook に本番設定・handoff 完了印を統合
- 後続タスク（UT-08 / UT-09 / DNS 移管 / 定期 D1 バックアップ自動化）への引き継ぎを記録

Refs #8

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# PR 作成
gh pr create \
  --title "docs(ut-06): 本番デプロイ実行タスク仕様書と go-live 実績" \
  --body "$(cat <<'EOF'
## 概要

UT-06 (本番デプロイ実行) タスクの仕様書整備と Phase 5 で実施した本番初回デプロイの実績記録です。

## 変更内容

- Phase 1〜13 の仕様書を作成（implementation タスク）
- 本番初回デプロイ実績（OpenNext Workers / API Workers / D1）を outputs/phase-05 に記録
- aiworkflow-requirements (deployment-cloudflare / deployment-core) に go-live 実績を反映
- 02-serial / 04-serial / 05b-parallel runbook に本番設定・Secrets 配置確認・handoff 完了印を統合
- 後続タスク（UT-08 モニタリング / UT-09 Sheets→D1 同期 / カスタムドメイン DNS 移管 / 定期 D1 バックアップ自動化）への引き継ぎを記録

## 受入条件

- AC-1〜AC-8 を全件充足（outputs/phase-07/ac-matrix.md でトレース）
- 本番 URL は参照先のみ記載（実値・認証情報は非記載）
- 機密情報（database_id 実値・API トークン）の非混入を local-check-result で確認

## Issue 紐付け

Refs #8

> Issue #8 は既に CLOSED のため `Refs` で参照のみ。再オープンが必要な場合は別途判断します。

## レビュー観点

- documentation-changelog（outputs/phase-12/documentation-changelog.md）と変更ファイル一覧の一致
- 上流 runbook 統合（02-serial / 04-serial / 05b-parallel）の整合性
- 機密情報の非混入

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --base main \
  --head "$(git branch --show-current)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本番デプロイ実績を PR 本文の根拠として使用 |
| Phase 7 | ac-matrix.md を AC 充足トレースの根拠として使用 |
| Phase 10 | GO 判定を PR 作成の前提条件として使用 |
| Phase 11 | smoke-test-result.md を AC-1 / AC-2 / AC-4 / AC-5 充足のエビデンスとして使用 |
| Phase 12 | documentation-changelog から変更ファイルを特定 |

## 多角的チェック観点（AIが判断）

- 価値性: PR が UT-06 の go-live 実績と仕様書整備の両方を一括で記録し、後続タスクのクリティカルパスを解放できるか。
- 実現性: 本番デプロイ実績を含む PR の機密情報混入リスクが local-check-result で適切に検出されるか。
- 整合性: change-summary が Phase 12 の documentation-changelog と完全一致しているか・Issue #8 の取り扱い（Refs）が正しいか。
- 運用性: PR レビュアー（CLAUDE.md のブランチ戦略に従い main へは 2 名レビュー）が変更意図と本番影響を理解できる説明になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート | 13 | pending | **承認なし禁止** |
| 2 | local-check-result 確認 | 13 | pending | 機密情報混入チェック・Phase ファイル数・index 状態 |
| 3 | change-summary 作成 | 13 | pending | ユーザーへの提示用 |
| 4 | feature ブランチ確認 | 13 | pending | 既存 feat/wt-12 ブランチで実施 |
| 5 | コミット作成 | 13 | pending | ユーザー承認後のみ・HEREDOC 形式 |
| 6 | PR 作成 | 13 | pending | ユーザー承認後のみ・`Refs #8` を使用 |
| 7 | CI 確認 | 13 | pending | PR 作成後 |
| 8 | artifacts.json 全 Phase completed 化 | 13 | pending | 全 13 Phase の状態を completed に更新 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR | https://github.com/daishiman/UBM-Hyogo/pull/TBD | UT-06 仕様書 + go-live 実績 PR |
| メタ | artifacts.json | 全 Phase completed に更新 |

## 完了条件

- ユーザー承認ゲートを通過している
- local-check-result の全チェック項目が PASS である
- PR が作成されて Issue #8 に `Refs #8` で参照されている（`Closes` は使用しない）
- artifacts.json の全 Phase 状態が completed である

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift・機密情報混入・Issue 状態の取り違え）も検証済み
- 次 Phase への引き継ぎ事項を記述（なし：最終 Phase）
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項: PR マージ後、UT-08（モニタリング）/ UT-09（Sheets→D1 同期）担当者に本番環境稼働を通知する。カスタムドメイン DNS 移管・定期 D1 バックアップ自動化は別途 UT 起票候補として運用担当に申し送り。
- ブロック条件: ユーザー承認がない場合は PR 作成・push を一切実行しない。
