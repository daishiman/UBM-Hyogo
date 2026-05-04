# Phase 9: roadmap markdown 統合

## 目的

phase-04〜08 の成果物を統合し、最終成果物 `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` を生成する。AC-1 / AC-2 / AC-3 がリポジトリ実体としても満たされる状態にする。

## roadmap 章立て（必須）

```
# UT coverage 2026-05 wave-3 roadmap

1. 背景と目的（wave-2 完了 → wave-3 ブリッジ）
2. 用語と評価軸（layer / gap-class / delegation-target / scoring rubric）
3. 現行 coverage 数値（layer 別 line/branch/function、wave-2 touched 列付）
4. layer × file gap マッピング表
5. NON_VISUAL backlog 集約（integration / e2e 委譲箇所）
6. wave-3 候補タスクリスト（5〜10 件、優先度・規模見積つき）
7. 採用基準と除外基準
8. 参照（元 unassigned-task spec / wave-2 タスク群 / aiworkflow-requirements）
```

各章は対応する outputs ファイルから内容を転記し、相互リンクを保つ。

## ドラフト先・最終配置

| ステップ | パス | 役割 |
| --- | --- | --- |
| ドラフト | outputs/phase-09/wave-3-roadmap-draft.md | 内部レビュー用ドラフト |
| 最終配置 | docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md | リポジトリ正本 |

最終配置ファイルはドラフトと完全同一内容（見出しと相対リンク先のみ修正可）とする。

## 変更対象ファイル一覧（CONST_005）

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md | 新規 | 最終成果物 |
| outputs/phase-09/wave-3-roadmap-draft.md | 新規 | ドラフト |

## 入力 / 出力 / 副作用

- 入力: phase-04 〜 phase-08 の主要成果物
- 出力: roadmap-draft + 最終配置ファイル + `outputs/phase-09/main.md`
- 副作用: `docs/30-workflows/ut-coverage-2026-05-wave/` 配下に新規 markdown が追加される

## テスト方針

- 章立て 8 セクションが正しい順で存在（grep）
- AC-1 / AC-2 / AC-3 に対応するセクション（3 / 4 / 6）が空でない
- 元 unassigned-task spec へのリンクが「参照」セクションに存在
- 相対リンクが `link check`（Phase 11）で 200 / OK

## ローカル実行・検証コマンド

```bash
final=docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md
draft=docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-09/wave-3-roadmap-draft.md
test -f "$final" && test -f "$draft"
for h in '背景と目的' '用語と評価軸' '現行 coverage 数値' 'gap マッピング' 'NON_VISUAL backlog' 'wave-3 候補タスクリスト' '採用基準' '参照'; do
  grep -q "$h" "$final" || echo "MISSING heading: $h"
done
```

## 完了条件 / DoD

- [ ] `wave-3-roadmap.md` が `docs/30-workflows/ut-coverage-2026-05-wave/` に配置
- [ ] 8 章立てがすべて存在
- [ ] AC-1 / AC-2 / AC-3 の出力が章 3 / 4 / 6 に転記済み
- [ ] 元 unassigned-task spec が「参照」章でリンクされている

## 出力

- outputs/phase-09/main.md
- outputs/phase-09/wave-3-roadmap-draft.md
- docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md（リポジトリ実体）

## 参照資料

- outputs/phase-04 〜 phase-08 の主要 markdown（gap mapping は Phase 7 の `gap-mapping-resolved.md` を正とする）
- docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md

## メタ情報

- Phase: 9
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- roadmap draft と final markdown を統合する。

## 成果物/実行手順

- `outputs/phase-09/main.md`、`wave-3-roadmap-draft.md`、final `wave-3-roadmap.md` を作成する。

## 統合テスト連携

- NON_VISUAL。見出しと相対リンクを Phase 11 で確認する。
