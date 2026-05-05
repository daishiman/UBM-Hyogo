# UT-08A-01: public route / use-case coverage hardening

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-08A-01 |
| 検出元 | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` |
| 種別 | implementation / NON_VISUAL |
| 重要度 | High |
| 状態 | unassigned |
| 推奨割当 | 09a 着手前、または 08a 追補 PR |

## 背景

08a Phase 11 の coverage 実測で Statements 84.18% / Functions 83.37% / Lines 84.18% となり、AC-6 の Statements / Lines 85% を 0.82pt、Functions 85% を 1.63pt 下回った。Branches は 84.13% で達成済み。

主な未達要因は `apps/api/src/use-cases/public/*` 4 本と public route handler の直接テスト不足。view-model 層のテストは存在するが、use-case / route 層の null guard、D1 query assembly、mapper 呼び出し経路の観測点が薄い。

## スコープ

- `apps/api/src/use-cases/public/form-preview.ts`
- `apps/api/src/use-cases/public/public-member-profile.ts`
- `apps/api/src/use-cases/public/public-members.ts`
- `apps/api/src/use-cases/public/public-stats.ts`
- 必要に応じて `apps/api/src/routes/public/*.ts`

## 受け入れ条件

- 4 本の public use-case に最低 3 ケースずつ追加する: happy path / null-row or empty / D1 fail。
- route handler を補強する場合は 200 / 404 or empty / validation failure を明示する。
- `mise exec -- pnpm --filter @ubm-hyogo/api test` が green。
- `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` で Statements >= 85%、Branches >= 80%、Functions >= 85%、Lines >= 85% を満たす。
- 08a の Phase 11 / Phase 12 / artifacts を `partial` から完了扱いへ戻す場合は、coverage evidence を更新する。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| coverage exclude で品質改善なしに数値だけ達成する | 原則は use-case direct unit test を優先し、exclude は設計上の責務移譲が明確な場合だけ採用する |
| view-model tests と重複する | use-case では repository return / null guard / error propagation に絞り、表示 shape は view-model tests に委譲する |
| 09a/09b が 08a を green 前提に進める | 08a artifacts と Phase 12 に `partial` を残し、本タスク完了まで gate 未達を明示する |

## 参照

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-11/main.md`
- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-11/evidence/coverage-report.txt`
- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/implementation-guide.md`
- `apps/api/package.json`
