# UT-GOV-002-IMPL: pr-target safety gate implementation

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-GOV-002-IMPL |
| 種別 | implementation |
| 優先度 | high |
| visualEvidence | VISUAL |
| 上流 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` |

## スコープ

### 含む

- `.github/workflows/pr-target-safety-gate.yml` の追加または既存 triage workflow の境界調整
- `pull_request_target` を label / metadata 操作に限定
- untrusted build / test を `pull_request` workflow に分離
- GitHub Actions UI と branch protection job 名同期のスクリーンショット保存

### 含まない

- secrets rotate
- OIDC 化
- security review の最終署名

## 苦戦ポイント

- required status checks の job 名同期
- fork PR からの実行経路の再現
- `workflow_run` を採用しない設計の維持

## リスクと対策

| リスク | 対策 |
| --- | --- |
| safety gate 導入で既存 triage が壊れる | 単一コミット粒度で revert できる差分にする |
| secrets が triage job へ流れる | root `permissions: {}` と secrets 参照 grep を必須化 |
| PR head checkout が混入する | `pull_request_target` 内の checkout `ref` を yq で検査 |

## 検証方法

- `actionlint .github/workflows/*.yml`
- `yq '.permissions, .jobs[].permissions' .github/workflows/pr-target-safety-gate.yml`
- fork PR / labeled trigger / scheduled trigger の smoke
- GitHub Actions UI の実行ログスクリーンショット

## 参照

- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-2/design.md`
- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-5/runbook.md`
- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-4/test-matrix.md`
