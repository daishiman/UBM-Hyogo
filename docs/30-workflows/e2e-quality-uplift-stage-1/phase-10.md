# Phase 10: 最終レビュー

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. レビュー観点（4-condition gate 再適用）

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | GO | 1a / 1b ともに top-5 critical の最重大 regression を捕捉 |
| 実現性 | GO | spec 編集のみで完結、production code 変更ゼロ |
| 整合性 | GO | INV-3 / INV-PUB / INV-API-ONLY / INV-PROTO すべて遵守 |
| 運用性 | GO | CI 増加 < 6s、flaky 抑制策あり、Stage 2 への引継ぎ明確 |

## 2. 完了条件最終チェック

| 項目 | 状態 |
|------|------|
| index.md 受け入れ条件 7 件 | 8/8 充足（AC-1a-03 は vacuous 受容） |
| Phase 1 リスク 3 件 | 受容 / 抑制策確定 |
| Phase 3 R-1..R-4 | R-3 解消 / R-1, R-2, R-4 観測完了 |
| Phase 4 入口 Q1-Q3 | 解消済 |

## 3. ドキュメント整合

| ファイル | 状態 |
|---------|------|
| `index.md` | Phase 1-13 status を done に更新（Phase 13 完了時） |
| `phase-1.md..phase-13.md` | 全揃い |
| 関連 `docs/00-getting-started-manual/specs/*.md` | 改修不要 |

## 4. solo dev チェック

| 項目 | 値 |
|------|----|
| reviewer | n/a（required reviewers 0） |
| 自己レビュー | 本 phase で完了 |
| 追加 governance path 影響 | なし |

## 5. 残課題（Stage 2 以降へ）

| ID | 内容 | 提案 stage |
|----|------|-----------|
| F-1 | `LEAK_PROBE_EMAIL` の fixture seed 拡張（vacuous test 解消） | Stage 2 |
| F-2 | `mockMeWithPending` の global util 化（複数 spec 跨ぎが増えた場合） | Stage 2 / 3 |
| F-3 | `signSession` TODO_PLACEHOLDER の実 Auth.js 署名化 | 別 workflow |
| F-4 | `/@/` probe を全 public route に展開する横展開 | Stage 2 |

## 6. Phase 11 入口条件

- [ ] §1 4 観点 すべて GO
- [ ] §2 完了条件すべて充足
- [ ] §5 残課題が phase-12 未タスクへ転送されている

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 10
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

