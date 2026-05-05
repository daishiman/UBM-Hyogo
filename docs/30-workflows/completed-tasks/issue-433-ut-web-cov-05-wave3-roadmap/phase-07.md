# Phase 7: NON_VISUAL backlog 集約

## 目的

NON_VISUAL coverage task で integration / e2e に委譲すべき箇所を集約し、Phase 6 の gap マッピング表から確定版 `gap-mapping-resolved.md` を生成する。

## 集約方針

- Phase 4 inventory の `BACKLOG_INTEGRATION` ラベル行を全件取り込む
- Auth.js cookie session 経由の動線（login → admin / login → me）は `e2e` 委譲
- D1 binding 経由の API ルート結合は `integration` 委譲
- 純粋関数 / 非分岐 utility は `unit` で残せる場合は `unit` 維持
- 起動時にしか実行されない bootstrap / config は `manual-smoke` 委譲
- import されていない / dead code 候補は `obsolete-removal`

## 出力: non-visual-backlog.md

```
| layer | file/area | source-task | description | delegation-target | rationale |
```

Phase 6 の `gap-mapping.md` は immutable evidence として後編集しない。本 Phase では `outputs/phase-07/gap-mapping-resolved.md` を生成し、Phase 6 行との 1:1 対応を `source-row-id` で担保する。

## 変更対象ファイル一覧（CONST_005）

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| outputs/phase-07/gap-mapping-resolved.md | 新規 | Phase 6 gap mapping に `source-row-id` と確定 `delegation-target` を付与 |
| outputs/phase-07/non-visual-backlog.md | 新規 | 集約表 |

## 入力 / 出力 / 副作用

- 入力: `outputs/phase-04/wave2-backlog-inventory.md`、`outputs/phase-06/gap-mapping.md`
- 出力: `outputs/phase-07/main.md`、`non-visual-backlog.md`、`gap-mapping-resolved.md`
- 副作用: なし

## テスト方針

- Phase 6 `gap-mapping.md` と Phase 7 `gap-mapping-resolved.md` が `source-row-id` で 1:1 対応している
- 全 `BACKLOG_INTEGRATION` 行が non-visual-backlog.md に取り込まれている
- delegation-target enum 値のみが使われている

## ローカル実行・検証コマンド

```bash
! grep -q 'TBD' docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-07/gap-mapping-resolved.md
grep -E '\b(unit|integration|e2e|manual-smoke|obsolete-removal)\b' \
  docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-07/non-visual-backlog.md > /dev/null
```

## 完了条件 / DoD

- [ ] gap-mapping-resolved.md の `TBD` 残ゼロ
- [ ] non-visual-backlog.md が outputs に存在
- [ ] delegation-target が enum 値のみ

## 出力

- outputs/phase-07/main.md
- outputs/phase-07/non-visual-backlog.md
- outputs/phase-07/gap-mapping-resolved.md

## 参照資料

- outputs/phase-02/glossary.md（delegation-target enum）
- outputs/phase-04/wave2-backlog-inventory.md
- outputs/phase-06/gap-mapping.md

## メタ情報

- Phase: 7
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- NON_VISUAL backlog を集約し、resolved mapping を作成する。

## 成果物/実行手順

- `outputs/phase-07/main.md`、`non-visual-backlog.md`、`gap-mapping-resolved.md` を作成する。

## 統合テスト連携

- NON_VISUAL。`source-row-id` の 1:1 対応と delegation-target enum を確認する。
