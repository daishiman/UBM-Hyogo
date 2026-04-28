# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| Issue | #142（CLOSED のまま運用） |

## 目的

`task-claude-code-permissions-project-local-first-comparison-001` の Phase 1〜8 で生成された比較設計成果物（4 層責務表 / project-local-first 再発判定 / 案 A・案 B・ハイブリッド比較表 / 採用方針 / apply タスクへのハンドオフ）について、ドキュメント品質を一括判定する。実コード・実 settings の書き換えは行わない（spec_only）。

## 判定項目

| 項目 | 基準 | チェック方法 |
| --- | --- | --- |
| 比較表の出典紐付け | 4 層比較表の各セルに公式 docs 引用または実機ログ参照（書き換えなしの読み取り）が紐付いている | manual review（出典欄欠落 0） |
| line budget | 各 phase ファイル 250 行以内（過剰時は references へ分離） | wc -l で phase ファイル行数を確認 |
| link 健全性 | `index.md` から phase-01〜13 / outputs / 関連タスク（apply / deny-bypass-verification）リンクが解決 | manual review |
| `artifacts.json` parity | `outputs` 配列と実ファイル一致 | outputs ディレクトリ一覧と `jq '.phases[].outputs[]' artifacts.json` を突合 |
| mirror parity | `docs/30-workflows/` 直下と `completed-tasks/` 配下の参照が双方解決する | manual review |
| secrets 漏洩 | `.env` 実値 / API token / OAuth トークンの混入 0 件 | `grep -rE "(sk-|api_key|API_KEY|CLOUDFLARE_API_TOKEN)" docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/` |
| 階層優先順位の記述整合 | 全成果物で `project.local > project > global.local > global` が同一順序で記述 | manual review |
| 他プロジェクト副作用言及 | `scripts/cf.sh` / `op run` / 他 worktree への副作用が比較表中に必ず 1 行以上ある | manual review |

## QA チェックリスト

- [ ] phase-01〜phase-13 の 13 ファイルが揃っている
- [ ] outputs/phase-1〜phase-13 の 13 ディレクトリが揃っている（`.gitkeep` のみ可）
- [ ] artifacts.json が JSON valid
- [ ] CLAUDE.md ルール（`.env` Read 禁止 / wrangler 直接禁止 / `--dangerously-skip-permissions` の取り扱い注意）に違反する記述なし
- [ ] NON_VISUAL 宣言が一貫（screenshots 不要の根拠が明記）
- [ ] ソース MD `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` の §4 / §5 / §6 / §8 / §9 と Phase 1〜8 出力の対応が trace できる
- [ ] 比較表に「fresh 環境シナリオ C」「他プロジェクト副作用シナリオ D」が反映されている
- [ ] 採用案（A / B / ハイブリッド）の選定理由が 1 段落以上記述されている

## 主成果物

- `outputs/phase-9/main.md`（QA 結果サマリ。PASS/FAIL 判定および FAIL 時のループバック先 Phase を記載）

## 完了条件

- [ ] skill 準拠の完了条件を満たす
- [ ] 全 QA 項目 PASS、または FAIL 時は Phase 8 にループバック
- [ ] 比較表に出典が 100% 紐付き、未引用セルがない

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実 settings / shell alias / `~/.claude/settings.json` の書き換えは禁止）

## 参照資料

- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`
- Phase 1〜8: `outputs/phase-1/` 〜 `outputs/phase-8/` を参照する
- Phase 5: `outputs/phase-5/` を参照する
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 統合テスト連携

本タスクは docs-only / NON_VISUAL / spec_only のため、統合テストは `task-claude-code-permissions-apply-001` で実施する。ここでは手順、証跡名、リンク整合を固定する。
