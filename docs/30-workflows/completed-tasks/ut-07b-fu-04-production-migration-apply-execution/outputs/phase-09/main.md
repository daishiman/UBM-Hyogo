# Phase 9: ステージング検証（parity 確認） — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

UT-07B-FU-03 runbook で staging への apply は先行済みである想定。Phase 9 では staging に対して apply 済みであること、staging schema が `0008_schema_alias_hardening` 反映後の状態であることを再確認し、staging-to-production parity を確立する。

## 実行タスク

1. staging applied state 再確認:
   ```bash
   bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
   ```
   期待: `0008_schema_alias_hardening` が **既適用** 一覧に存在する。
2. staging post-check（Phase 7 と同じ hardening columns check を staging で実行）:
   ```bash
   bash scripts/d1/postcheck.sh ubm-hyogo-db-staging --env staging
   ```
   期待: `schema_diff_queue.backfill_cursor` / `backfill_status` が存在。
3. staging が未適用だった場合は本タスクのスコープ外（FU-03 runbook が staging を未対応で完結しているケース）として、ユーザーに切替判定を仰ぐ。

## staging-to-production parity チェック

| 観点 | parity 期待 |
| --- | --- |
| applied migration 一覧 | staging / production ともに `0008_schema_alias_hardening` を含む |
| `schema_diff_queue` 追加カラム | 両 env で同名カラムが存在 |

production already-applied verification 完了後（Phase 11）に再度この parity チェックを行い、Phase 12 system spec に「staging/production parity OK」を記録する。

## evidence

- `outputs/phase-09/main.md` に staging applied state 再確認の summary を redacted で記録
- staging post-check 結果は本 Phase 内で要約のみ（実 log は FU-03 側 evidence を参照）
- production との比較表は Phase 11 evidence と Phase 12 system spec で完結させる

## 参照資料

- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md（staging evidence の正本があればそこから引用）
- apps/api/migrations/0008_schema_alias_hardening.sql
- scripts/cf.sh

## 多角的チェック観点

- staging と production を取り違えていないか
- staging が未適用ケースを examination だけでなく実行判断に流せる設計か
- evidence は redacted のみ記録されているか

## サブタスク管理

- [ ] staging applied state 再確認手順を spec 化
- [ ] hardening columns staging 実行手順を spec 化
- [ ] parity チェック表を作成
- [ ] outputs/phase-09/main.md を作成

## 成果物

- outputs/phase-09/main.md

## 完了条件

- staging applied state 再確認手順と parity チェック設計が確定

## タスク100%実行確認

- [ ] staging / production の取り違えがない
- [ ] secret 値を含めていない
- [ ] evidence redaction 要件が明示

## 次 Phase への引き渡し

Phase 10 へ、production 切替準備を渡す。
## 統合テスト連携

staging parity は本サイクルでは static contract として扱う。production runtime verification と混同しない。
