# Phase 12 — skill-feedback-report

## Status

completed

## 概要

本ファイルは task-specification-creator skill / aiworkflow-requirements skill / 関連テンプレートに対する改善観点のフィードバックを記録する。再監査で、旧 docs only として作成した workflow に後から code wave が入った場合の narrative 同期漏れを検出したため、High 改善として記録する。

---

## 1. テンプレート観点

| 観点 | 気づき | 推奨アクション |
| --- | --- | --- |
| Phase 12 出力構成 | implementation タスクでは `system-spec-update-summary.md` の Step 2 が大半 N/A になる。テンプレに「N/A 判定の根拠明記」が暗黙ルール化されているため、新規ユーザーが省略しがち | テンプレ comment に「N/A の場合も判定根拠の明記必須」を追記 |
| `unassigned-task-detection` | テンプレ既定が「0 件可」の解釈を許す表現になっている | 「最低 3 candidate / current/baseline 分離」をテンプレ既定文言に格上げ（本タスクで採用した運用） |
| `documentation-changelog` | workflow-local と global skill sync の境界がテンプレ上で明示されていない | 2 ブロック構成（A/B）をテンプレ標準に格上げ |
| `pr-template` | Claude Code 生成フッタが必須かどうかテンプレ上で曖昧 | 必須として固定（本タスクで採用） |
| code wave 後の再分類 | `旧分類` の文言が残ったまま実コード差分が入ると Phase 12 の N/A 判定が破綻する | `phase-12-documentation-guide.md` に「code wave が入った場合は artifacts / phase本文 / outputs / system spec を同時に implementation へ戻す」ルールを追加済み |

## 2. ワークフロー観点

| 観点 | 気づき | 推奨アクション |
| --- | --- | --- |
| Phase 1-3 の前提読み込み | Phase 12 執筆時に Phase 1-3 を全文読まないと整合性が取れない | task-specification-creator の Phase 12 ランブック先頭に「Phase 1-3 必読」を明記 |
| Phase 11 manual smoke の implementation スキップ | NON_VISUAL かつ implementation の場合 Phase 11 が事実上 noop になる | Phase 11 テンプレに「implementation / NON_VISUAL のとき何をもって完了とするか」のガイダンス追記 |
| MINOR 指摘の Phase 12 トレース | Phase 3 の MINOR 指摘 M-01〜M-04 が Phase 12 で必ず言及されているか機械的に確認する仕組みがない | Phase 12 compliance check に「Phase 3 MINOR 指摘 → Phase 12 言及箇所の対応表」を必須項目化 |
| Phase 13 の承認待ちステータス管理 | `user_approval_required=true` の Phase 13 で AI が誤って commit / push しないためのガード文言がテンプレに薄い | Phase 13 main.md テンプレに「未承認で commit / push / PR を作らない」の明示を必須化 |

## 3. ドキュメント観点

| 観点 | 気づき | 推奨アクション |
| --- | --- | --- |
| 中学生レベル説明 | implementation-guide Part 1 の「専門用語の言い換え」（例: バインディング → 接続口）は author 任意で揺れる | skill SKILL.md に「用語言い換え対応表」のミニマム例を 5〜10 個固定例示 |
| global skill sync の proposed 扱い | 本タスクのように「直接編集しない / proposed として残す」運用は便利だが、後続タスクが proposed を拾い忘れるリスクあり | proposed 一覧を集約する「pending-skill-sync.md」の集合場所をリポジトリ内に新設検討 |
| `artifacts.json` ↔ outputs 突合 | 突合結果（compliance check）を Phase 12 で初めて行うため、Phase 1〜11 で先に欠落していると後段で手戻る | 各 Phase 完了時にも軽量な突合チェックを推奨 |

## 4. 改善優先度サマリ

| 優先度 | 件数 | 例 |
| --- | --- | --- |
| High | 2 | テンプレへの「N/A 根拠明記」「unassigned-task 最低 3 件」格上げ |
| Medium | 4 | documentation-changelog 2 ブロック構成、Phase 12 MINOR トレース必須化、Phase 13 承認ガード明示、Phase 1-3 必読明記 |
| Low | 4 | 用語言い換え対応表、pending-skill-sync 集合場所、Phase 11 implementation ガイド、軽量 compliance check |

---

## 5. ブロッカー

なし。検出した skill feedback は `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` へ反映済み。
