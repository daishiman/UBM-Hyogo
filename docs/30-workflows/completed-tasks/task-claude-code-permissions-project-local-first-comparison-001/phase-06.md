# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 |
| 下流 | Phase 7 (カバレッジ確認) |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| 状態 | pending |

## 目的

Phase 4 の主シナリオ（TC-01〜TC-04）に対し、比較表の **fail path / 回帰 guard 相当** として「新 worktree 再発検出」「global 副作用検出」のシナリオを追加する。
本タスクは spec_only / docs-only のため、実機書き換えは禁止し、読み取り or 公式仕様引用のみで成立する手順に限定する。

## 真の論点

- 案 B（project-local-first）採用時、新 worktree 作成直後に prompt が復帰することを **必ず観測できる手順** が必要
- 案 A（global）採用時、`~/dev` 配下の他リポジトリで `defaultMode` が変化していないことを grep で検出できる手順が必要
- ハイブリッド採用時、fallback 発動条件（global が効くシナリオ）の境界を 1 件以上記述する

## 追加シナリオ

### TC-F-01: 新 worktree での prompt 復帰検出（案 B / ハイブリッドの fail path）

| 項目 | 内容 |
| --- | --- |
| 操作 | `bash scripts/new-worktree.sh feat/dummy-comparison-test` で worktree を 1 件作成（書き換え対象は当該 worktree の local のみ） |
| 期待 | 新 worktree の `<project>/.claude/settings.local.json` 未配置状態で `defaultMode` が default に戻り prompt 復帰することを観測 |
| 失敗時挙動 | prompt が復帰しない場合、project-local-first の前提が誤り → 比較表の再発判定を再評価 |

### TC-F-02: 案 A 採用時の他プロジェクト副作用検出

| 項目 | 内容 |
| --- | --- |
| 操作 | `grep -rn '"defaultMode"' ~/dev/**/.claude/settings.json 2>/dev/null` で `defaultMode` 明示プロジェクトを全件列挙 |
| 期待 | 列挙結果と比較表の「他プロジェクト副作用一覧」が一致。case A 採用後の最終値変化が表で説明されている |
| 失敗時挙動 | grep に表に無い entry が出現 → 比較表の他プロジェクト副作用一覧を更新 |

### TC-R-01: global / global.local 不整合の回帰 guard

| 項目 | 内容 |
| --- | --- |
| 操作 | `cat ~/.claude/settings.json | jq '.defaultMode'` と `ls -la ~/.claude/settings.local.json 2>/dev/null` を順に実行（読み取りのみ） |
| 期待 | 比較表の「fresh 環境挙動」列の前提が現状値と矛盾しない |
| 失敗時挙動 | global.local が想定外に存在 / 想定値と異なる → 採用方針の前提を再確認 |

### TC-R-02: deny 検証タスク結果到着後の比較表更新 guard

| 項目 | 内容 |
| --- | --- |
| 操作 | `task-claude-code-permissions-deny-bypass-verification-001` の成果物パスを参照 |
| 期待 | 結果が ACCEPT / REJECT / CONDITIONAL のいずれであっても、比較表の「deny 実効性」軸（保留 → 確定）に反映される手順が Phase 6 に明記されている |
| 失敗時挙動 | 結果到着後に比較表が更新されない運用負債が残る |

## 回帰 guard

- `scripts/cf.sh` / `op run` 経路が settings 変更後も無影響であること（`wrangler` 直接実行を導入しない）を比較表の他プロジェクト副作用一覧でガード
- `mise install` / Node version 切替後も alias / settings の挙動が変化しないこと（apply タスクで実機検証する旨をハンドオフ）

## 主成果物

- `outputs/phase-6/main.md`

## 完了条件

- [ ] TC-F-01 / TC-F-02 / TC-R-01 / TC-R-02 が `outputs/phase-6/main.md` に明記されている
- [ ] 比較表（Phase 5 `comparison.md`）の対応箇所への参照リンクがある
- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実書き換えは行わない）

## 参照資料

- Phase 5: `outputs/phase-5/` を参照する
- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` §6 / §7
- 関連タスク: `task-claude-code-permissions-decisive-mode`（前提）
- 関連タスク: `task-claude-code-permissions-apply-001`（後続ハンドオフ先）
- 関連タスク: `task-claude-code-permissions-deny-bypass-verification-001`（並行・deny 軸を追記する契機）
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物/実行手順

- `artifacts.json` の該当 Phase outputs を正本とする
- `outputs/phase-6/main.md` を作成し、TC-F-01 / TC-F-02 / TC-R-01 / TC-R-02 を記録する

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは `task-claude-code-permissions-apply-001` で実行する。ここでは fail path / 回帰 guard の手順、証跡名、リンク整合を固定する。
