# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL タスクのため UI スクリーンショットは取得しない。代わりに、
**(a) runbook の机上トレース**と**(b) 仕様書間の link 整合確認**を主証跡として残す。
**実 Claude Code 起動 / 実機検証は本タスクの spec_created スコープ外**であり、別途承認後に実施する。

## 手動テスト構成

### MT-1: runbook 机上トレース（dry walkthrough）

Phase 5 runbook の Section 1〜7 を「実行はせず読み下し、各ステップの前提が直前ステップで満たされるか」
を確認する。

| Section | 確認観点 | 結果列 |
| --- | --- | --- |
| 1. 前提環境 | OS / shell / claude コマンドの前提が明確 | OK / NG |
| 2. 安全宣言 | `/tmp/cc-deny-verify-*` 限定が明示 | OK / NG |
| 3. 環境構築 | bare.git / work / settings 配置の順序が破綻しない | OK / NG |
| 4. settings 配置 | 検証 settings の最小内容が明示 | OK / NG |
| 5. 起動と試行 | TC-VERIFY-01〜04 が runbook から辿れる | OK / NG |
| 6. ログテンプレ | 列定義が一意で観測値が記入できる | OK / NG |
| 7. 終了処理 | cleanup 漏れがない | OK / NG |

### MT-2: 仕様書間 link 整合（link-checklist.md）

| 起点 | 参照先 | 期待 |
| --- | --- | --- |
| index.md | Phase 1〜13 ファイル | 全リンクが存在 |
| phase-01〜13 | artifacts.json | 一致 |
| Phase 12 system-spec-update-summary | 上流 R-2 main.md | 実在 |
| Phase 12 implementation-guide | Phase 5 runbook | 実在 |
| 全 phase | apply-001（下流） | 存在しなければ「未作成」と明記 |

### MT-3: 機密情報非混入確認（manual-smoke-log.md）

```bash
# 実行コマンド（Phase 11 実施時に証跡として残す）
grep -rEi "(api[_-]?token|sk-[a-zA-Z0-9]{10,}|ANTHROPIC_API_KEY=|OPENAI_API_KEY=)" \
  docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/ \
  || echo "no leak detected"
```

期待: `no leak detected`

### MT-4: verification-log テンプレート完備（verification-log.md）

検証実施時に記入する空テンプレートを完成させる。**本 Phase では実値は記入しない**。

| 列 | 例 |
| --- | --- |
| TC | TC-VERIFY-01 |
| 時刻 | YYYY-MM-DD HH:MM:SS |
| claude --version | （実施時に記入） |
| 依頼内容 | git push --dry-run --force origin main |
| 観測結果 | blocked / 実行 / prompt |
| 補足 | （実施時に記入） |

## 視覚証跡の代替

NON_VISUAL のため `screenshots/` は作成しない。代替証跡:

- `outputs/phase-11/manual-smoke-log.md`（MT-1 / MT-3 結果）
- `outputs/phase-11/verification-log.md`（MT-4 空テンプレート）
- `outputs/phase-11/link-checklist.md`（MT-2 結果）

## 完了判定

| 項目 | 期待 |
| --- | --- |
| MT-1 全 Section | OK |
| MT-2 link 整合 | 切れ 0、未作成は明記 |
| MT-3 機密検査 | no leak |
| MT-4 テンプレ | 列が一意で完成 |

## 主成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/verification-log.md`（空テンプレート）
- `outputs/phase-11/link-checklist.md`

## スコープ外

- 実 Claude Code 起動
- 実機検証実施
- スクリーンショット取得（NON_VISUAL）

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/`
- Phase 5: `outputs/phase-5/runbook.md`
- Phase 4: `outputs/phase-4/test-scenarios.md`
- Phase 6: `outputs/phase-6/main.md`
- Phase 7: `outputs/phase-7/main.md`
- Phase 8: `outputs/phase-8/main.md`
- Phase 9: `outputs/phase-9/main.md`
- Phase 10: `outputs/phase-10/final-review-result.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] MT-1〜MT-4 が成果物に揃う
- [ ] `screenshots/` が作成されていない
- [ ] verification-log.md が空テンプレートとして整備されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
