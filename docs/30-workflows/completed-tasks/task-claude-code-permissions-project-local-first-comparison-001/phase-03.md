# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー（Phase 4 への Go/No-Go 判定 + 影響分析） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4 (テスト設計) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した 4 層責務表ドラフトと 5 評価軸を Phase 4 へ進める前にレビューゲートを通す。**特に project-local-first（案 B）の再発防止可否**（ソース MD Phase 2）と、案 A 採用時の他プロジェクト副作用（影響分析）を本 Phase で確定する。

## レビュー観点

### R-1: 4 層責務表の整合性

| 確認項目 | 判定基準 |
| --- | --- |
| 4 層の優先順位仮説が Anthropic 公式 docs と一致 | 公式 docs を引用 or リンク化 |
| 各層の「想定利用者 / 変更頻度 / git 管理可否」がブレなく記述 | 表内で重複・矛盾がない |
| 担当キー（`defaultMode` / `permissions.*`）の置き場所が層責務に従っている | project の `permissions` を global に持ち上げない方針が守られている |

### R-2: project-local-first の再発防止可否（ソース MD Phase 2）

| 確認項目 | 判定基準 |
| --- | --- |
| 公式 docs で `defaultMode` 未指定時の組み込み default が文書化されているか | 引用 or 「未文書化のため実機観測」と明記 |
| fresh プロジェクト（`.claude/settings.local.json` 未配置）で起動時 prompt 復帰が起きるか | 実機観測ログ or 公式仕様で 1 結論を出す |
| `.claude/settings.local.json` を git ignore する運用が新規 worktree で正しく作用するか | `scripts/new-worktree.sh` の挙動と整合確認 |
| 結論: 「project-local-first 単独では新規プロジェクトで再発する」が真か偽か | YES/NO のいずれかで明記 |

### R-3: 案 A 採用時の影響分析（影響範囲レビュー）

| 確認項目 | 判定基準 |
| --- | --- |
| `~/dev` 配下で `defaultMode` を明示しているリポジトリ件数 | `grep -r "defaultMode" ~/dev/**/.claude/settings.json` の件数を記録（値は記録しない） |
| `scripts/cf.sh` 経由 Cloudflare CLI 運用への副作用 | global `permissions.deny` に `Bash(wrangler *)` が混入しないか / `op run` 注入の権限評価が変わらないか |
| 他 worktree の権限評価への副作用 | global の `defaultMode` 変更が他 worktree の最終値に反映されるかをシナリオ A〜D で確認 |
| `cc` alias に `--dangerously-skip-permissions` を追加する shell 経路の影響 | shell 全体に波及するため、`cc` を呼ぶプロジェクトを列挙 |

### R-4: シナリオ A〜D 対応（ソース MD Phase 3 / 6 検証手順）

| シナリオ | 状況 | 案 A の最終 `defaultMode` | 案 B の最終 `defaultMode` | 許容可否 |
| --- | --- | --- | --- | --- |
| A | 全層配置済み | bypass | bypass | 案 A / 案 B 共に変化なし |
| B | project.local のみ配置 | bypass | bypass | 同上 |
| C | global / project のみ配置（fresh 環境） | bypass（global 経由） | acceptEdits or unset | **採否の分かれ目** |
| D | global のみ配置 | bypass | acceptEdits or unset | 同上 |

### R-5: ハイブリッド案フォールバック条件

案 B が R-2 で「再発する」と判定された場合、ハイブリッド案（B を default、A を fresh 環境補強の fallback）を採用候補に格上げする。**判定は本 Phase で実施**。

## レビューチェックリスト

- [ ] R-1 の 4 層責務表の整合性が PASS
- [ ] R-2 の再発判定が 1 結論として記録（公式仕様引用 or 実機ログ）
- [ ] R-3 の他プロジェクト副作用が件数 + 一覧として明文化
- [ ] R-4 のシナリオ A〜D 対応が比較表で表現可能な粒度で記録
- [ ] 案 A / 案 B / ハイブリッドの暫定優劣が記録されている（最終決定は Phase 5 で確定）
- [ ] Phase 4 着手の Go/No-Go 判定が明示されている

## 既知の落とし穴

| パターン | 防止策 |
| --- | --- |
| グローバル設定変更が他プロジェクトに silent 波及 | R-3 で `~/dev` 配下を grep し列挙必須 |
| 公式 docs で `defaultMode` 未指定時の挙動が未文書化 | 実機 fresh プロジェクトで観測し、結果を出典として記載 |
| `.claude/settings.local.json` の git ignore 運用と `scripts/new-worktree.sh` の不整合 | new-worktree 実行後の fresh 状態をシナリオ C として明記 |
| `--dangerously-skip-permissions` 使用時に `permissions.deny` が無効化されているリスク | `task-claude-code-permissions-deny-bypass-verification-001` の結果を待つ。未着なら本タスクの採用案から alias 強化を除外 |

## 主成果物

- `outputs/phase-3/main.md`（レビュー結論 + 暫定採用候補）
- `outputs/phase-3/impact-analysis.md`（他プロジェクトへの波及範囲・件数・一覧）

## ゲート条件

- 全 R-1〜R-5 が PASS、または「許容可能なリスクとして記録」と判定された場合のみ Phase 4 へ進む
- いずれか NG の場合は Phase 2 にループバック
- `--dangerously-skip-permissions` の deny 実効性が未確認の場合、案 A をハイブリッド fallback に降格する

## Skill 準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`
- Phase 1: `outputs/phase-1/`
- Phase 2: `outputs/phase-2/`
- ソース MD `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` §4 Phase 2 / §6 検証手順
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## Blocker

- `--dangerously-skip-permissions` 使用時に `permissions.deny` が実効するか未確認の場合、案 A を default 採用候補から外す。
- 公式 docs で `defaultMode` 未指定時の挙動が未文書化かつ実機観測ログも未取得の場合、Phase 4 へは進めない。
- global settings 変更案は、他プロジェクト影響レビュー（R-3）が完了するまで採用しない。

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。
- [ ] R-2 の再発判定が 1 結論として記載されている。
- [ ] `impact-analysis.md` に他プロジェクト副作用の件数 + 一覧が記載されている。
- [ ] Phase 4 への Go/No-Go が明示されている。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスク（`task-claude-code-permissions-apply-001`）で実行する。ここでは手順、証跡名、リンク整合を固定する。
