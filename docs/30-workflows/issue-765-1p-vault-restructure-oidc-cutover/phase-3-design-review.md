# Phase 3: 設計レビュー

## メタ情報

- phase: 3 / design-review
- prev: phase-2-design
- next: phase-4-test-plan

## 目的

Phase 2 設計に対し、セキュリティ・整合性・rollback の観点で多角的レビューを行い、Gate-A の Go/No-Go を確定する。

## 実行タスク

1. canonical path と legacy deprecation の設計をレビューする
2. redaction / rollback / user-gate 条件を点検する
3. Gate-A の Go/No-Go 判断を記録する

## 入力

- Phase 2 vault 構成設計 / migration table / file diff plan / rollback design

## 出力

- `outputs/phase-3/review-checklist.md`
- `outputs/phase-3/go-no-go-decision.md`

## レビュー観点

### Security

| 観点 | 判定基準 |
|------|---------|
| scope 最小化 | canonical item の scope（staging Edit / production Edit / local-dev Read-only / WAF 専用）が least privilege を満たしている |
| 環境分離 | staging / production / local-dev の token が物理的に別 item で blast radius が分離されている |
| evidence redaction | 設計書・migration table に token 値・URI hash・suffix が混入していない |
| local 誤投入防止 | LocalDev item が Read-only scope に限定され、誤って production deploy で参照されても破壊操作が起きない |

### 整合性

| 観点 | 判定基準 |
|------|---------|
| ut-27 整合 | canonical path が ut-27 で宣言されている path と一致 |
| aiworkflow current contract | `deployment-secrets-management.md` / `quick-reference.md` が `CLOUDFLARE_API_TOKEN` direct-token contract を current としている間は Phase 11 mutation を blocked にする |
| deployment-secrets-management.md 整合 | inventory 更新案が既存 GitHub Secrets 命名（`CF_TOKEN_*` family）と矛盾しない |
| `apps/web` 不変条件整合 | `getEnv()` 経由のみアクセス、env 変数名は変更しない |
| `scripts/cf.sh` ラッパー整合 | op:// path 変更が `op run --env-file=.env` のラップを壊さない |

### 運用 / rollback

| 観点 | 判定基準 |
|------|---------|
| deprecation window | 14 日 active / 14 日 archive / 30 日後 delete の段階が明文化 |
| rollback feasibility | 各シナリオ（deploy fail / local fail / WAF fail）の rollback 手順が即時実行可能 |
| user-gated mutation 境界 | 1Password mutation / `.env` commit / PR push がすべて Phase 13 user 承認後にのみ実行される |
| 履歴 doc 影響 | ut-15 / ut-06 / 03-serial historical doc は inventory のみ更新（書き換えで履歴を破壊しない） |

## NO-GO 条件（再掲・gate 重複明記ルール）

- **NG-1**: 前提 Issue #762 / #763 / #718 のいずれかが re-open
- **NG-2**: canonical item naming が既存 GitHub Secrets 命名と命名衝突
- **NG-3**: deprecation window の rollback 手順が未文書
- **NG-4**: 設計書・migration table に token 実値・URI hash が混入
- **NG-5**: LocalDev item の scope が Read-only でない（誤投入リスク）

## 多角的チェック（AIが判断）

- 1Password vault 名 `UBM-Hyogo` が実在しない場合のフェイルセーフ（Phase 11 で `op vault list` 事前確認）
- canonical item field 名が `op://` URI 仕様（`vault/item/field`）の予約語と衝突しないこと
- `.env.example` は既存 env 名 `CLOUDFLARE_API_TOKEN` を維持し、staging / production の op:// path 切替コメントだけを追加すること（新 env 名を増やさない）
- `apps/web` env validator (`getEnv()` zod schema) との互換性（env 名追加が型エラーを起こさないか）

## Gate-A pass 条件

1. NG-1〜NG-5 のいずれにも該当しない
2. Security / 整合性 / 運用 3 区分すべてに pass 判定
3. 多角的チェック 4 項目が evidence 化されている
4. spec/docs close-out は aiworkflow current contract が `blocked_by_oidc_support` でも GO 可能。ただし Phase 11 mutation と runtime smoke は Gate-B まで blocked と明記すること
5. `outputs/phase-3/go-no-go-decision.md` に GO 判定と reviewer / 日時が記録

## 参照資料

- `phase-2-design.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`

## 統合テスト連携

- Gate-A は設計レビュー gate。実行検証は Phase 6 grep gate と Phase 11 manual smoke に委譲する
- runtime evidence の未取得を PASS と混同しない

## 成果物

- `outputs/phase-3/review-checklist.md`
- `outputs/phase-3/go-no-go-decision.md`

## 完了条件

- [ ] レビュー観点 3 区分すべてに pass/fail 判定が記録
- [ ] NG-1〜NG-5 のいずれかが該当する場合、Phase 4 へ進まない判断が記録
- [ ] GO 判定時、Phase 4 への前進条件が明文化

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成
- [ ] Phase 2 設計への FB が反映されている

## 次Phase

phase-4-test-plan.md
