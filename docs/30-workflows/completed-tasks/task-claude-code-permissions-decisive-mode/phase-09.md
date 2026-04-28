# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | pending |

## 目的

ドキュメント品質を一括判定する。

## 判定項目

| 項目 | 基準 | チェック方法 |
| --- | --- | --- |
| line budget | 各 phase ファイル 250 行以内（過剰時は references へ分離） | `wc -l docs/30-workflows/task-claude-code-permissions-decisive-mode/phase-*.md` |
| link 健全性 | `index.md` から全 phase / outputs リンクが解決 | manual review |
| `artifacts.json` parity | `outputs` 配列と実ファイル一致 | `ls outputs/phase-*/` と `jq '.phases[].outputs[]' artifacts.json` を突合 |
| secrets 漏洩 | API token / `.env` 実値の混入 0 件 | `grep -rE "(sk-|api_key|API_KEY)" .` |
| 階層優先順位の記述整合 | 全成果物で同一順序 | manual review |

## QA チェックリスト

- [ ] phase-01〜phase-13 の 13 ファイルが揃っている
- [ ] outputs/phase-1〜phase-13 の 13 ディレクトリが揃っている（`.gitkeep` のみ可）
- [ ] artifacts.json が JSON valid
- [ ] CLAUDE.md ルール（`.env` Read 禁止 / wrangler 直接禁止）に違反する記述なし
- [ ] NON_VISUAL 宣言が一貫（screenshots 不要の根拠が明記）

## 主成果物

- `outputs/phase-9/main.md`（QA 結果）

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 全 QA 項目 PASS、または FAIL 時は Phase 8 にループバック

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 5: `outputs/phase-5/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

