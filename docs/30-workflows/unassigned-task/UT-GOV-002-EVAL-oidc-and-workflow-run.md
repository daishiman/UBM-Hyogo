# UT-GOV-002-EVAL: OIDC and workflow_run evaluation

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-GOV-002-EVAL |
| 種別 | evaluation / spike |
| 優先度 | medium |
| visualEvidence | NON_VISUAL |
| 上流 | UT-GOV-002 design decision log |

## スコープ

### 含む

- OIDC 化の費用対効果評価
- `workflow_run` 採用時の追加攻撃面レビュー
- Cloudflare audience 検証が必要になる条件整理

### 含まない

- OIDC 本実装
- `workflow_run` workflow の追加
- deploy 権限の grant

## 苦戦ポイント

- `workflow_run` が secrets 橋渡しにならない境界設計
- Cloudflare 側 audience 検証の追加要件
- secrets 方式より OIDC が本当に攻撃面を下げるかの判断

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 評価タスクが実装タスクへ膨らむ | decision matrix だけを成果物にする |
| `workflow_run` 採用前提で設計が進む | 採用可否を明示的な GO / NO-GO で止める |
| 優先度が低く見積もられる | `workflow_run` 採用が浮上した時点で high に再分類 |

## 検証方法

- コスト / 攻撃面削減効果 / 実装負荷の decision matrix
- GitHub Actions event chain の脅威モデル表
- Cloudflare OIDC audience 検証の要否判定

## 参照

- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md`
- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-9/quality-gate.md`
- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-12/unassigned-task-detection.md`
