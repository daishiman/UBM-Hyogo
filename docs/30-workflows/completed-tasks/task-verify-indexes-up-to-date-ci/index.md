# task-verify-indexes-up-to-date-ci — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| ディレクトリ | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 担当 | devex |
| 状態 | implementation_completed_pr_pending |
| タスク種別 | non_visual_implementation |
| visualEvidence | NON_VISUAL |
| 派生元 | task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection (C-1) |
| 関連 Issue | #137 (CLOSED) |

## 目的

GitHub Actions に `verify-indexes-up-to-date` job を新設し、`pnpm indexes:rebuild` 実行後に
`.claude/skills/aiworkflow-requirements/indexes/` へ差分が出れば fail させる **authoritative gate** を導入する。
post-merge hook 廃止後に残る「開発者が再生成を忘れた場合の drift が main に流入するリスク」を CI 側で構造的に防ぐ。

## スコープ

### 含む

- `.github/workflows/verify-indexes.yml` の新規作成（独立 workflow）
- `actions/checkout@v4` → `pnpm/action-setup@v4` → `actions/setup-node@v4` (Node 24) → `pnpm install` → `pnpm indexes:rebuild` → `git diff --exit-code` の job 構成
- drift 検出時の差分ファイル名出力（`git status --short` / `git diff --name-only`）
- `CLAUDE.md` / `doc/00-getting-started-manual/lefthook-operations.md` / aiworkflow-requirements 正本仕様への CI gate 名最小追記

### 含まない

- post-merge hook への index 再生成復活
- `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` のリファクタ
- generated index の出力仕様変更
- 既存 `ci.yml` / `backend-ci.yml` / `web-cd.yml` / `validate-build.yml` の構造改変
- 本タスク以外の skill index 検証（aiworkflow-requirements 配下のみ対象）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-git-hooks-lefthook-and-post-merge | post-merge から index 再生成を撤去した結果として本 gate が必要 |
| 下流 | （なし） | 本 gate は独立して機能する |
| 並列 | （なし） | solo 開発・Wave 外の単独 DevEx タスク |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | 元タスク指示書 |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | indexes 生成本体 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/ | drift 監視対象ディレクトリ |
| 必須 | .github/workflows/ci.yml | 既存 setup（pnpm/action-setup@v4 / setup-node@v4 / Node 24 / pnpm 10.33.2）の流用元 |
| 必須 | package.json `indexes:rebuild` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` |
| 参考 | CLAUDE.md | indexes 再生成の正規経路（`pnpm indexes:rebuild`）の正本記述 |
| 参考 | doc/00-getting-started-manual/lefthook-operations.md | post-merge 廃止の経緯 |

## 受入条件 (AC)

- AC-1: PR 作成時 / `main` push 時に `verify-indexes-up-to-date` job が自動起動し、index drift を検出する
- AC-2: drift がある場合 job が **fail** し、差分ファイル名が job ログに出力される
- AC-3: drift なし状態で false positive にならず PASS する（決定論的出力を前提）
- AC-4: post-merge hook に index 再生成を戻していない（lefthook.yml に追加されないこと）
- AC-5: 既存 CI（ci.yml / backend-ci.yml / web-cd.yml / validate-build.yml）と job 名・trigger・concurrency で衝突しない
- AC-6: workflow は `mise exec -- pnpm indexes:rebuild` 相当の Node 24 / pnpm 10.33.2 環境で実行される
- AC-7: drift 検出は `.claude/skills/aiworkflow-requirements/indexes` に限定し、`git add -N` 後の `git diff --exit-code -- <indexes>` で未追跡 index も検出する。それ以外のファイルを誤検出しない

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | phase-01.md 〜 phase-13.md | 13 phase 別仕様 |
| メタ | artifacts.json | 機械可読サマリー |
| 実装物 | .github/workflows/verify-indexes.yml | CI gate 実装本体 |

## 関連サービス・Secrets

| 区分 | 項目 | 用途 / 値 |
| --- | --- | --- |
| サービス | GitHub Actions | CI gate 実行基盤 |
| ツール | pnpm 10.33.2 | indexes:rebuild 実行 |
| ツール | Node 24.15.0 | generate-index.js 実行 |
| Secrets | （なし） | 本 gate は外部 API / Cloudflare に触れない |

## 触れる不変条件

なし（CI gate 追加のみ。CLAUDE.md 不変条件 #1〜#7 への影響なし）。

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-7 が Phase 7 / 10 で完全トレースされる
- 4 条件（価値性・実現性・整合性・運用性）PASS
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 元タスク指示書: ../task-verify-indexes-up-to-date-ci.md
- 派生元 Phase 12: ../task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md
- 共通テンプレ: ../../02-application-implementation/_templates/phase-template-app.md
