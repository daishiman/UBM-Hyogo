# Phase 12 — ドキュメント同期

## 必須タスク（6 件 / strict 7）

| # | タスク | 出力 |
| - | ------ | ---- |
| 1 | 実装ガイド（Part1 中学生レベル / Part2 開発者向け） | `outputs/phase-12/implementation-guide.md` |
| 2 | システム仕様書更新サマリ | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 4 | 未タスク検出レポート（0 件でも出力必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | スキルフィードバックレポート | `outputs/phase-12/skill-feedback-report.md` |
| 6 | Phase 12 本体 + compliance check（canonical 9 headings） | `outputs/phase-12/main.md` + `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## システム仕様書更新（Task 2）

### Step 1-A 完了タスク記録

`docs/00-getting-started-manual/specs/00-overview.md` の「完了タスク」セクションに以下追記:

> - `login-ui-balance-and-runtime-fix`（2026-05-26）: `/login` の入力フィールド / Google ブランドアイコン / magic-link 404 / プロトタイプ 404 を 1 サイクルで解消。production code の `process.env.INTERNAL_API_BASE_URL` 直参照を `getAuthEnv()` / `getPublicFetchEnv()` 経由へ統一し、grep gate で固定。

### Step 1-B 実装状況テーブル

該当行を `implemented_local_runtime_pending` として登録。local code / focused route specs / grep gate は同一 wave、staging deploy・visual screenshot・PR は user-gated。

### Step 1-C 関連タスク

`apps/web` env 抽象化に関わる関連タスク（`task-02 wrangler-env-injection` 等）の「関連タスク」表に当タスク行を追記。

### Step 2 新規 interface 追加判定

- 既存 `getAuthEnv()` / `getPublicFetchEnv()` を使用。新規 public interface 追加なし
- 新規 public interface 追加なし → **Step 2 簡易更新で十分**（specs ファイルへの大規模追記不要）

## 未タスク検出（Task 4）

詳細は `outputs/phase-12/unassigned-task-detection.md`。
本タスク scope 外として明示した項目:

- `127.0.0.1:8888` 系拡張機能ログのアプリ側対処（不要、ドキュメント明記のみ）
- `favicon.ico 404` の修正（今回のログインフォーム / magic-link / prototype 表示とは独立。未タスク化しない）
- pre-push hook への `verify-no-process-env-internal-api.sh` 追加（今回は script 追加まで実施、hook wiring は既存 gate 方針に委譲）

これら 3 件は unassigned-task-detection の候補として列挙し、判定（採用 / 却下）を記録する。

## スキルフィードバック（Task 5）

`outputs/phase-12/skill-feedback-report.md` に記載。
今回の苦戦点候補:

- detached HEAD 起点での worktree 立ち上げ（branch checkout 必要）
- `apps/web` ランタイム env 直参照の root cause を staging console error から逆引きする手順
