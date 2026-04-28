# task-claude-code-permissions-decisive-mode — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-decisive-mode |
| ディレクトリ | docs/30-workflows/task-claude-code-permissions-decisive-mode |
| Wave | - |
| 実行種別 | spec_created |
| 作成日 | 2026-04-28 |
| 担当 | dev-environment / tooling |
| 状態 | spec_created |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Claude Code 起動時に **Bypass Permissions Mode が消える / 戻ってしまう** 問題を、`settings` 階層の整合化と起動エイリアスの強化、および permissions whitelist の整備によって恒久解決する。
本タスクは **設計のみ（spec_created）** であり、実装と検証は別タスクで実行する。実装可能仕様としての承認は、`--dangerously-skip-permissions` と `permissions.deny` の相互作用を実機または公式仕様で確認するまで保留する。

## 背景

3 層の `settings` ファイルで `defaultMode` の値が不一致（acceptEdits vs bypassPermissions）であり、Claude Code が起動初期化中に上位層の値で permission prompt を提示することがある。再起動・session 切替時に bypass が解除されるという観測症状を、構造的に解消する。

| 階層 | パス（例） | 現状の `defaultMode` |
| --- | --- | --- |
| グローバル | `~/.claude/settings.json:318` | `acceptEdits` |
| グローバル(local) | `~/.claude/settings.local.json:61` | `bypassPermissions` |
| プロジェクト | `<project>/.claude/settings.json:130` | `bypassPermissions` |

## スコープ

### 含む（本タスクで設計する範囲）

- **E-1**: settings 3 層の `defaultMode` 統一（または委譲ルールの設計）
- **E-2**: `cc` エイリアスへの `--dangerously-skip-permissions` 併用案の安全性評価
- **E-3**: `permissions.allow` / `permissions.deny` whitelist の整理（bypass 時の実効性は blocker として検証）
- 階層優先順位ドキュメントの追記方針（`docs/00-getting-started-manual/claude-code-config.md`）
- 手動テストシナリオ（起動直後 / reload 後 / 別プロジェクトでの cc 起動）

### 含まない（別タスクで実装）

- 実際の `~/.claude/settings.json` / `~/.zshrc` への書き込み
- グローバル設定変更後の他プロジェクトでの実機動作確認
- Claude Code SDK のソース変更
- CI / pre-commit hook の追加変更
- secrets 管理（`.env` / 1Password）の改修

## 受入条件 (AC)

- AC-1: 統一後の 3 層 `settings.json` 完全形（差分形式）が phase-02 成果物として揃っている
- AC-2: `cc` エイリアス書き換え diff（before / after）が phase-02 成果物として揃っている
- AC-3: `permissions.allow` / `permissions.deny` の whitelist 設計が phase-02 成果物として揃っている
- AC-4: 階層優先順位（global → global.local → project → project.local）と「どの値が最終値になるか」を明記した方針メモが phase-12 で `docs/00-getting-started-manual/claude-code-config.md` への追記対象として確定する
- AC-5: 手動テストシナリオ（cc 起動 → モード表示確認 / 再起動 → モード維持確認 / 別プロジェクト起動 → 影響範囲確認）が phase-04 / phase-11 に揃っている
- AC-6: 他プロジェクトへの波及範囲レビューが phase-03 で済んでいる
- AC-7: NON_VISUAL タスクのため Phase 11 はスクリーンショット不要、`manual-smoke-log.md` を主証跡とする
- AC-8: Phase 12 は 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が揃う

## 重要な不変条件

- 平文 `.env` をコミットしない（CLAUDE.md ルール準拠）
- `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）— 本タスクは無関係だが破らない
- グローバル `~/.claude/settings.json` を変更する設計は **他プロジェクトに波及する**ため、影響範囲を Phase 3 で必ず確定する

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-1/main.md（3層ダンプ + 要件） |
| 2 | 設計 | phase-02.md | pending | outputs/phase-2/{main,settings-diff,alias-diff,whitelist-design}.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-3/{main,impact-analysis}.md |
| 4 | テスト設計 | phase-04.md | pending | outputs/phase-4/{main,test-scenarios}.md |
| 5 | 実装 | phase-05.md | pending | outputs/phase-5/{main,runbook}.md |
| 6 | テスト拡充 | phase-06.md | pending | outputs/phase-6/main.md |
| 7 | カバレッジ確認 | phase-07.md | pending | outputs/phase-7/main.md |
| 8 | リファクタリング | phase-08.md | pending | outputs/phase-8/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-9/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/{main,final-review-result}.md |
| 11 | 手動テスト | phase-11.md | pending | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/* 6 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/{main,pr-template}.md |

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `~/.claude/settings.json` | グローバル設定の現状確認（実値非読込） |
| 必須 | `~/.claude/settings.local.json` | グローバル local 設定の現状確認 |
| 必須 | `<project>/.claude/settings.json` | プロジェクト設定の現状確認 |
| 必須 | `~/.zshrc` または `~/.config/zsh/conf.d/<n>-claude.zsh` | `cc` エイリアス定義 |
| 必須 | `docs/00-getting-started-manual/claude-code-config.md` | Phase 12 で階層優先順位を追記する正本 |
| 参考 | `CLAUDE.md`（プロジェクトルート） | 権限モード / settings 参照記述 |

## 完了判定

- Phase 1〜12 は仕様実行時に完了判定し、Phase 13 はユーザー承認まで `blocked`
- AC-1〜AC-8 が Phase 7 / 10 でトレースされる
- Phase 12 が 6 成果物を揃え、`artifacts.json` / `outputs/artifacts.json` の parity が取れている
- 本仕様書は `spec_created` 状態であり、実装は別タスクで実行する旨が記録されている

## 関連リンク

- 上位 README: `../README.md`（存在すれば）
- Skill: `.claude/skills/task-specification-creator/`
- 参照実例: `docs/30-workflows/02-application-implementation/02b-parallel-meeting-tag-queue-and-schema-diff-repository/`
