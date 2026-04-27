# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-27 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

> **🚨 重要: このフェーズは user の明示承認後のみ実施する。**  
> Phase 12 までの完了が確認できても、user からの明示的な「PR を作成してよい」という指示が無い限り、PR 作成・push・merge を一切行わない。  
> 承認なき自動 PR 作成は禁止。

## 目的

Phase 1〜12 の成果物をまとめて PR を作成し、レビュー・マージ後にタスクを正式に完了させる。docs-only タスクであるため、PR 本文は変更サマリと AC 充足状況を簡潔に示す。

## 参照資料（前提成果物）

- Phase 10: review-decision.md（PASS）
- Phase 11: main.md / manual-smoke-log.md / link-checklist.md
- Phase 12: implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-checklist.md | PR 作成前チェックリスト |
| ドキュメント | outputs/phase-13/pr-template.md | PR タイトル・本文テンプレ |
| ドキュメント | outputs/phase-13/local-check-result.md | git status / lint / typecheck の結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリ（user 提示用） |
| ドキュメント | outputs/phase-13/pr-info.md | 作成された PR の URL / 番号 |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 作成結果サマリ |
| メタ | artifacts.json | 全 Phase completed への更新 |

> 上記成果物の実体ファイルは Phase 13 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス）

- [ ] **user の明示承認を得る（承認なき進行禁止）**
- [ ] Phase 12 までの完了根拠を確認する（compliance-check 全 PASS）
- [ ] PR 作成前チェックリストを実行する（lint / typecheck / 全 phase 成果物存在）
- [ ] git status で変更ファイルを確認し機密情報の混入をチェックする
- [ ] change-summary.md を user に提示し承認を得る
- [ ] feature ブランチを作成する（既に存在する場合は確認）
- [ ] PR を作成する（gh pr create）
- [ ] CI 確認とマージ後の clean up を記録する

## 実行手順

### ステップ 1: user 承認ゲート【必須 / 自動進行禁止】

**このステップは user の明示承認なしに進めない。**

1. Phase 10 の PASS 判定が確認されていること
2. Phase 12 の compliance-check が全 PASS であること
3. change-summary.md を user に提示する
4. user の明示承認（「PR 作成してよい」「進めてよい」等）を得てからステップ 2 へ

### ステップ 2: PR 作成前チェックリスト

```bash
# 必ず mise exec 経由（CLAUDE.md 規約）
mise exec -- pnpm lint
mise exec -- pnpm typecheck

# 変更ファイル確認
git status
git diff --name-only

# 機密情報チェック（Account ID / 実 Token / 実 origin の混入確認）
grep -rE "([0-9a-f]{32}|Bearer [A-Za-z0-9_-]+)" \
  docs/30-workflows/ut-12-cloudflare-r2-storage/ \
  --include="*.md" || echo "secret 検出なし"

# 全 phase 成果物の存在確認
ls docs/30-workflows/ut-12-cloudflare-r2-storage/phase-*.md | wc -l   # 期待: 13
```

### ステップ 3: 変更サマリ作成と user 提示

- change-summary.md に以下を記録:
  - 変更概要（docs-only / spec_created）
  - 変更ファイル一覧（documentation-changelog.md からコピー）
  - AC-1〜AC-8 の充足状況
  - 影響範囲（実装コード変更なし / 02-serial 連携経路）
- user に提示し承認を得る

### ステップ 4: PR 作成

```bash
# feature ブランチ確認（既存の feat/wt-5 等を使用、または新規作成）
git status
git log --oneline -5

# 変更ファイルのステージング（具体的パス指定 / -A は使わない）
git add docs/30-workflows/ut-12-cloudflare-r2-storage/

# コミット（HEREDOC で正しくフォーマット）
git commit -m "$(cat <<'EOF'
docs(ut-12): Cloudflare R2 ストレージ設定タスク仕様書を追加

- Phase 1〜13 の仕様書を作成（docs-only / spec_created）
- R2 バケット構成・wrangler.toml バインディング・CORS ポリシー・Token スコープ判断を文書化
- 将来のファイルアップロード実装タスクの前提となる設計・runbook を整備
- NON_VISUAL タスクとして screenshots を含めず CLI 出力テキストで証跡を完結

Refs #15
EOF
)"

# PR 作成
gh pr create \
  --base main \
  --title "docs(ut-12): Cloudflare R2 ストレージ設定タスク仕様書" \
  --body "$(cat <<'EOF'
## 概要

UT-12 (Cloudflare R2 ストレージ設定) のタスク仕様書を docs-only として整備します。
GitHub Issue #15 (CLOSED) を仕様書として正式化し、将来のファイルアップロード機能実装の前提を確立します。

## 変更内容

- Phase 1〜13 の仕様書を作成（spec_created）
- R2 バケット構成 / wrangler.toml バインディング / CORS ポリシー / Token スコープ判断
- 無料枠モニタリング方針（UT-17 連携ポイントを明示）
- パブリック / プライベート選択基準（UT-17 連携を明示）
- NON_VISUAL タスクとして screenshots は含めず CLI 出力テキストで証跡を完結

## 受入条件

- AC-1〜AC-8 を全件充足見込み（Phase 10 PASS 判定 / Phase 12 compliance-check 全 PASS）
- 実装コードへの変更なし（docs-only）

## 影響範囲

- 実装コードへの影響なし
- aiworkflow-requirements skill の topic-map.md / LOGS.md への参照追記あり

Refs #15
EOF
)"
```

## 承認ゲート（user 承認必須）【必須】

| ゲート項目 | 確認内容 | 承認状態 |
| --- | --- | --- |
| Phase 10 PASS 判定確認 | outputs/phase-10/review-decision.md が PASS | 要確認 |
| Phase 12 compliance-check 全 PASS | phase12-task-spec-compliance-check.md | 要確認 |
| change-summary レビュー | user が変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入確認 | Account ID / Token / 実 origin が含まれない | 要確認 |
| PR 作成実行 | **user の明示指示があった場合のみ実行** | **承認待ち** |

## local-check-result【必須】

| チェック項目 | 期待値 | 状態 |
| --- | --- | --- |
| `pnpm lint` PASS | 0 errors | pending |
| `pnpm typecheck` PASS | 0 errors | pending |
| 全 13 phase ファイル存在 | 13 | pending |
| outputs/phase-{01..12}/ ディレクトリ存在 | 12 | pending |
| 機密情報非混入 | grep ヒットなし | pending |
| documentation-changelog と git diff 整合 | 一致 | pending |

## change-summary【必須 / user 提示用】

### 変更概要

UT-12 (Cloudflare R2 ストレージ設定) のタスク仕様書を docs-only として整備します。  
Issue #15 (CLOSED) を `spec_created` として正式化し、将来のファイルアップロード機能実装の起動コストを下げます。

### 変更ファイル一覧

| ファイル | 種別 |
| --- | --- |
| docs/30-workflows/ut-12-cloudflare-r2-storage/index.md | 新規 |
| docs/30-workflows/ut-12-cloudflare-r2-storage/artifacts.json | 新規 |
| docs/30-workflows/ut-12-cloudflare-r2-storage/phase-{01..13}.md | 新規 |
| docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-{01..12}/ | 新規（実行時生成） |
| .claude/skills/aiworkflow-requirements/references/topic-map.md | 追記（R2 anchor） |
| LOGS.md（×2 系） | 追記 |

### AC 充足状況

| AC | 状態 |
| --- | --- |
| AC-1〜AC-3 / AC-5〜AC-8 | 仕様書として充足（spec_created） |
| AC-4 (smoke test) | 手順確定 / 実行は将来実装タスク側 |

## マージ後の clean up

- merged 後にタスクワークフローを `docs/30-workflows/completed-tasks/ut-12-cloudflare-r2-storage/` へ移動するか判断
- artifacts.json の全 Phase を `completed` に更新
- ブランチ削除（local / remote 両方）
- Issue #15 のコメントに「仕様書 PR がマージされ正式化された」旨を記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | PASS 判定を PR 作成の前提として使用 |
| Phase 12 | documentation-changelog から PR 変更ファイル一覧を生成 |

## 多角的チェック観点

- 価値性: PR が Issue #15 を仕様書として正式化し、将来の実装タスクの参照基点になるか
- 実現性: docs-only 変更のみで CI が PASS するか（コード品質チェックは非該当が想定）
- 整合性: change-summary が documentation-changelog と一致しているか
- 運用性: PR レビュアー（CLAUDE.md ブランチ戦略: dev で 1 名 / main で 2 名）が変更意図を即座に把握できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | 13 | pending |
| 2 | local-check-result（lint / typecheck） | 13 | pending |
| 3 | change-summary 作成 + user 提示 | 13 | pending |
| 4 | feature ブランチ確認 / 作成 | 13 | pending |
| 5 | コミット作成 | 13 | pending |
| 6 | PR 作成（gh pr create） | 13 | pending |
| 7 | CI 確認 | 13 | pending |
| 8 | マージ後 clean up | 13 | pending |

## 完了条件（受入条件）

- [ ] user の明示承認を得てから PR を作成
- [ ] local-check-result の全項目 PASS
- [ ] PR が作成され Issue #15 に Refs / Closes で紐付く
- [ ] artifacts.json の全 Phase が `completed` に更新（マージ後）
- [ ] 機密情報の混入なし

## レビューポイント / リスク / 落とし穴

- user 承認なしに gh pr create を走らせない（[Phase 13 必須ルール]）
- `git add -A` / `git add .` を使わない（機密情報・無関係ファイル混入防止）
- コミットメッセージの HEREDOC は `<<'EOF'` で quote する（変数展開防止）
- main 直 push / force push は禁止（CLAUDE.md ブランチ戦略遵守）
- `--no-verify` / `--amend` を使わない（フックスキップ・履歴破壊防止）

## 次フェーズへの引き渡し

- 次: なし（タスク完了）
- 引き継ぎ事項: マージ後、UT-16 / UT-16 / 将来のファイルアップロード実装担当者に R2 設定仕様書の存在を通知
- ブロック条件: user 承認がない場合 / local-check FAIL の場合は PR 作成しない
