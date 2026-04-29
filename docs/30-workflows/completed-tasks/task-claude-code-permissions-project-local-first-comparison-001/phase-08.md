# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 |
| 下流 | Phase 9 (品質保証) |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| 状態 | pending |

## 目的

設計成果物（比較表 / rollback 手順 / ハンドオフメモ）の表現を整理し、重複削除・用語統一・参照整合を行う。コード変更は無し。

## 真の論点

- 4 層責務表（Section 1）と 3 案 × 5 軸表（Section 3）で「影響半径」の説明が重複しないこと
- rollback 手順（Section 4）と apply タスク向けハンドオフ（Section 6）で同じコマンドを 2 度書かないこと
- 用語「`defaultMode` / `bypassPermissions` / `--dangerously-skip-permissions` / `scripts/cf.sh` / `op run`」をソース MD と完全一致させる

## リファクタリング対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 「影響半径」の説明 | Section 1 と Section 3 に重複 | Section 1 を正本とし、Section 3 から参照リンクのみ | 単一情報源原則 |
| rollback 手順 | Section 4 と Section 6 で同じコマンドを再掲 | Section 4 を正本、Section 6 は「Section 4 を参照」のみ | DRY |
| 「他プロジェクト副作用」記述 | Section 3 比較表セルと Section 5 一覧で表記揺れ（`scripts/cf.sh` vs `cf.sh`） | `scripts/cf.sh` に統一、`op run --env-file=.env` も完全形に統一 | 用語統一 |
| Phase 3 シナリオ A〜D 表記 | A/B/C/D と「シナリオ A」「シナリオ B」が混在 | 「シナリオ A」「シナリオ B」「シナリオ C」「シナリオ D」に統一 | 用語統一 |
| 採用案ラベル | 「案 A」「ケース A」「Option A」が混在 | 「案 A」「案 B」「ハイブリッド」に統一（ソース MD 表記） | 用語統一 |
| ハンドオフ箇条書き | Phase 4 章立てと Phase 5 `comparison.md` Section 6 で重複 | Section 6 を正本、Phase 4 仕様書からは参照のみ | DRY |

## navigation drift 確認

- `index.md` Phase 表 → `phase-NN.md` → `outputs/phase-N/*.md` の 3 段リンクが全て生きていること
- `artifacts.json` の `outputs` 配列と実ファイル名が一致
- 関連タスク参照（`task-claude-code-permissions-decisive-mode` / `task-claude-code-permissions-apply-001` / `task-claude-code-permissions-deny-bypass-verification-001`）のリンクが全 Phase 仕様書で同一表記

## 用語統一チェックリスト

- [ ] `defaultMode`（settings キー名）
- [ ] `bypassPermissions`（mode 値）
- [ ] `--dangerously-skip-permissions`（CLI フラグ）
- [ ] `scripts/cf.sh`（Cloudflare CLI ラッパー）
- [ ] `op run --env-file=.env`（1Password 注入経路）
- [ ] `~/.claude/settings.json` / `~/.claude/settings.local.json`（global / global.local）
- [ ] `<project>/.claude/settings.json` / `<project>/.claude/settings.local.json`（project / project.local）
- [ ] タスク ID `task-claude-code-permissions-project-local-first-comparison-001`

## 主成果物

- `outputs/phase-8/main.md`（リファクタリング記録）

## 完了条件

- [ ] 重複削減後の navigation map が `outputs/phase-8/main.md` に記載されている
- [ ] 用語統一チェックリストが全件 ✅ になっている
- [ ] リンク切れ 0 件
- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実書き換えは行わない）

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する
- Phase 2: `outputs/phase-2/` を参照する
- Phase 5: `outputs/phase-5/` を参照する
- Phase 6: `outputs/phase-6/` を参照する
- Phase 7: `outputs/phase-7/` を参照する
- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`
- 関連タスク: `task-claude-code-permissions-decisive-mode` / `task-claude-code-permissions-apply-001` / `task-claude-code-permissions-deny-bypass-verification-001`
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物/実行手順

- `artifacts.json` の該当 Phase outputs を正本とする
- `outputs/phase-8/main.md` を作成し、重複削減、用語統一、リンク整合の結果を記録する

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは `task-claude-code-permissions-apply-001` で実行する。ここでは表現整理・用語統一・リンク整合を固定する。
