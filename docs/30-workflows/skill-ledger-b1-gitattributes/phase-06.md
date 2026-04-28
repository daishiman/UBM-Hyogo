# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 (実装ランブック) |
| 下流 | Phase 7 (AC マトリクス) |
| 状態 | pending |
| user_approval_required | false |

## 目的

front matter 重複、JSON 誤適用、glob 過大化のフェイル経路を意図的に再現し、防御線が機能することを検証する。失敗パターンの観察ログを残し、Phase 12 documentation に inversely 反映する。

## 入力

- `outputs/phase-05/implementation-runbook.md`
- `outputs/phase-04/test-strategy.md`（TC-4）

## 異常系シナリオ

### FC-1 front matter 重複（誤対象追加想定）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | front matter 付き Markdown（例: `SKILL.md`）を `.gitattributes` 対象に追加してしまった想定 |
| 検証 | `git check-attr merge -- <skill>/SKILL.md` で `union` が返ることを再現 |
| 期待検出 | 2 worktree 並列 merge で `---` 行が重複し、front matter 構造が壊れる |
| 防御 | 設計時点で `SKILL.md` を除外側必須リストに固定（Phase 1 / 2） |
| ロールバック | `.gitattributes` の該当行を削除し再 commit |

### FC-2 JSON 誤適用（broad glob `**/*.json` を誤追加想定）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | `*.json merge=union` を誤追加 |
| 検証 | `git check-attr merge -- .claude/skills/**/indexes/keywords.json` で `union` が返る |
| 期待検出 | JSON 並列追記の merge で構造体が `]\n[` のように静かに壊れる（人手で気付きにくい） |
| 防御 | Phase 4 TC-2 で `keywords.json = unspecified` を必須化 |
| ロールバック | 該当行を削除し再 commit |

### FC-3 glob 過大化（`**/*.md merge=union` 誤適用想定）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | broad `**/*.md` を入れた想定 |
| 検証 | `git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/20260101-000000-main-deadbeef.md` で `union` が返る |
| 期待検出 | 現役 fragment（A-2 成果）に driver が当たり、A-2 設計と矛盾 |
| 防御 | Phase 4 TC-2-4 で現役 fragment = `unspecified` を必須化 |
| ロールバック | broad glob 行を削除し、`**/_legacy.md` 系のみに戻す |

### FC-4 行順序破壊（時系列性を要求するファイルを対象化想定）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 時系列 ledger（タイムスタンプ付き）を `_legacy.md` に取り込み対象化した想定 |
| 検証 | 並列 merge で行順序が逆転し時系列が崩れる |
| 防御 | A-2 fragment（ファイル名 timestamp）に倒し、本対象から除外する原則を Phase 1 で固定 |
| ロールバック | A-2 fragment 化に切替 |

## 実行タスク

1. FC-1〜FC-4 をローカル sandbox（`/tmp/b1-failure-sandbox`）で再現
2. 防御線（TC-2 / Phase 1 除外リスト）が fail-fast することを確認
3. 観察ログを failure-cases.md に記録
4. ロールバック手順を各 FC に紐付け

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Skill Ledger Overview | `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md` | A-2 → A-1 → A-3 → B-1 の実装順序と責務境界 |
| Skill Ledger Gitattributes Policy | `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 `merge=union` の許可・禁止・解除条件 |
| Skill Ledger Lessons Learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | skill ledger 4施策の苦戦箇所と再発防止 |


| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `outputs/phase-05/implementation-runbook.md` |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-06/failure-cases.md` | FC-1〜FC-4 / 検出方法 / 防御線 / ロールバック |

## 完了条件 (DoD)

- [ ] FC-1〜FC-4 が成果物に記述
- [ ] 各 FC に対する検出コマンドが書かれている
- [ ] 防御線（TC / Phase 1 除外リスト）への参照がある
- [ ] ロールバック手順が紐付けされている

## 苦戦箇所・注意

- **本物の repo を汚さない**: FC 再現は別 sandbox / throwaway worktree で行う。誤って main に push しないこと
- **「気付きにくさ」の言語化**: JSON 構造体破損は `cat` で見ても気付かないことがある。`jq . < file` で構文確認まで含めた検出を記録
- **rollback 手順の冗長化**: FC ごとに手順が異なるように見えるが本質は「該当行削除 + commit」。共通化して書く

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 7（AC マトリクス）
- 引き継ぎ: FC-1〜FC-4 の防御線確認結果
