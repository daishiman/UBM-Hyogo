# UT-GOV-002-SEC: security review apply

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-GOV-002-SEC |
| 種別 | review-only |
| 優先度 | high |
| visualEvidence | NON_VISUAL |
| 上流 | `UT-GOV-002-IMPL` 完了後 |

## スコープ

### 含む

- 後続実装タスクの workflow 差分に対する pwn request 非該当レビュー
- AC-1〜AC-5 の実 workflow 突き合わせ
- review 記録の Markdown 化

### 含まない

- workflow 実装変更
- secrets rotate
- OIDC 化評価

## 苦戦ポイント

- 設計証跡 PASS と実走 PASS の区別
- `pull_request_target` 内の indirect code execution 検出
- `workflow_run` や artifact bridge が後から混入した場合の再判定

## リスクと対策

| リスク | 対策 |
| --- | --- |
| IMPL 後に AC-4 根拠が劣化 | review で MAJOR 判定し、IMPL へ差し戻す |
| self-review が形式化する | GitHub Security Lab の pwn request 観点に沿って項目別に記録 |
| 実装と仕様のズレ | `outputs/phase-9/quality-gate.md` と実 YAML を同時参照 |

## 検証方法

- `pull_request_target` workflow の checkout / install / build / eval grep
- `permissions` と `persist-credentials` の yq 検査
- fork PR dry-run ログとの照合

## 参照

- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md`
- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-9/quality-gate.md`
- `docs/30-workflows/unassigned-task/UT-GOV-002-IMPL-pr-target-safety-gate.md`
