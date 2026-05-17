# Phase 3: 設計レビュー

## メタ情報

- phase: 3 / design-review
- prev: phase-2-design
- next: phase-4-test-plan

## 目的

Phase 2 設計に対し、セキュリティ・運用・rollback の観点から多角的レビューを行い、Phase 4 以降の実装着手 gate を確定する。

## レビュー観点

### Security

| 観点 | 判定基準 |
|------|---------|
| least privilege | 新 secret の scope（Workers Scripts:Edit / D1:Edit）が deploy 必須最小に絞られている |
| blast radius 縮小 | staging/production secret が分離され、ある環境の漏洩が他環境に波及しない |
| evidence redaction | revocation evidence に token 値・suffix・account id が含まれない |
| rotation feasibility | rename 後の secret が 90日ローテーション SOP（`U-FIX-CF-ACCT-01-DERIV-03`）と互換 |

### 運用

| 観点 | 判定基準 |
|------|---------|
| deploy 継続性 | rename PR マージ時点で新 secret が既に投入済みであり deploy が止まらない |
| 手動 path 互換 | `bash scripts/cf.sh` 経由の手動 D1 / audit が新 token で動作することを Phase 11 で確認可能 |
| rollback | revocation 前であれば旧 secret を再投入することで即座に rollback 可能 |

### コード変更

| 観点 | 判定基準 |
|------|---------|
| diff 最小性 | workflow YAML 変更は secret 参照名 rename のみ。logic 変更なし |
| 既存 test 互換 | `workflow-env-scope.test.sh` 既存検証（step-scoped env 配置）と新 gate が両立 |
| redaction script 互換 | `scripts/redaction-check.sh` / `check-cf-rotation-reminder.sh` の grep pattern が rename 後も動作 |

## NO-GO 条件（再掲・gate 重複明記ルール）

- **NG-1**: Issue #640 staging/production evidence が green でない（→ phase-1 / phase-2 / phase-3 で重複明記）
- **NG-2**: 新 secret が GitHub Environments に未投入の状態で rename PR をマージしようとしている
- **NG-3**: Phase 1 inventory で legacy token に依存する手動 path（CI 外）が発見され、切替計画が立てられていない
- **NG-4**: redaction check で evidence に token 値混入が検出された

## 多角的チェック（AIが判断）

- secret 名が GitHub Actions の secret 文字数制限（255 文字以下）に収まること
- secret 名が GitHub の命名規約（英数字とアンダースコア、先頭非数字）を満たすこと
- `[vars]` ではなく Secrets として管理されること（非機密混入防止）
- wrangler/OpenNext 側が `env.CLOUDFLARE_API_TOKEN` を期待しているため、step env の変数名は維持されること

## 成果物

- `outputs/phase-3/review-checklist.md`
- `outputs/phase-3/go-no-go-decision.md`

## 完了条件

- [ ] レビュー観点 3 区分すべてに pass/fail 判定が記録されている
- [ ] NG-1〜NG-4 のいずれかが該当する場合、Phase 4 へ進まない判断が記録されている
- [ ] GO 判定時、Phase 4 への前進条件が明文化されている

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成
- [ ] Phase 2 設計に対する FB が反映されている

## 次Phase

phase-4-test-plan.md
