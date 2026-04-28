# Phase 5: 実装 — main

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4（テスト設計） |
| 下流 | Phase 6（テスト拡充） |
| 種別 | docs-only / spec_created |
| implementation_mode | new |

## 重要前提

> 本タスクは `workflow: spec_created` のため、**実コード（settings / .zshrc の実書き換え）は本タスクでは行わない**。
> 本 Phase の成果物は **「別タスクで実行する手順書（runbook）」** のみであり、設計 deliverable に閉じる。

## 目的

別タスクで実装担当者が settings 3 層と `cc` alias を安全に書き換えられるよう、Step 1〜6 で完結する **実装ランブック** を確定する。

## 修正対象ファイル一覧

| 種別 | パス | 操作 | 担当 |
| --- | --- | --- | --- |
| 修正 | `~/.claude/settings.json` | `defaultMode` を `bypassPermissions` に統一（案 A 採用） | 別タスク |
| 修正 | `~/.claude/settings.local.json` | `defaultMode` を `bypassPermissions` に維持（既に該当の場合は変更不要） | 別タスク |
| 修正 | `<project>/.claude/settings.json` | `permissions.allow` / `deny` を Phase 2 `whitelist-design.md` 通りに更新 | 別タスク |
| 修正 | `~/.zshrc` または `~/.config/zsh/conf.d/<n>-claude.zsh` | `cc` alias に `--dangerously-skip-permissions` を追加 | 別タスク |
| 新規 | なし | - | - |

## ランブック概要（Step 1〜6）

| Step | 名称 | 主な操作 | 失敗時 |
| --- | --- | --- | --- |
| 1 | バックアップ取得 | `cp` で `.bak.<timestamp>` を作成 | 中止 |
| 2 | グローバル settings 編集 | `defaultMode` を `bypassPermissions` に統一 | Step 6 へ |
| 3 | プロジェクト settings 編集 | whitelist 反映 | Step 6 へ |
| 4 | cc alias 編集 | `--dangerously-skip-permissions` 追加 | Step 6 へ |
| 5 | 動作確認 | TC-01〜TC-05 を実施 | Step 6 へ |
| 6 | ロールバック | `.bak` から復元 | - |

詳細手順とコマンドは `runbook.md` を参照。

## 注意事項（必須）

- `.env` 実値・API token・OAuth トークンの値をランブック / 証跡に**転記しない**
- `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）— 本タスクと無関係だが破らない
- 実ファイル書き換えは **別タスク**で実施。本仕様は読込専用設計
- `~/.claude/settings.json` の編集は **他プロジェクトに波及する**ため、Phase 3 impact-analysis.md を必ず再確認

## canUseTool 適用範囲

本タスクは LLM SDK の `canUseTool` callback を使わない（settings ファイル変更タスクのため）。N/A。

## 主成果物

- `outputs/phase-5/main.md`（本ファイル）
- `outputs/phase-5/runbook.md`

## 完了条件

- [x] ランブックが Step 1〜6 で完結している
- [x] 各 Step に bash スニペットが付随している
- [x] ロールバック手順（Step 6）が記載されている
- [x] 修正対象ファイルパス一覧が明示されている
- [x] secrets 値が一切含まれていない

## 参照

- Phase 4: `outputs/phase-4/{main,test-scenarios}.md`
- Phase 2: `outputs/phase-2/{settings-diff,alias-diff,whitelist-design}.md`
- 仕様: `phase-05.md`
