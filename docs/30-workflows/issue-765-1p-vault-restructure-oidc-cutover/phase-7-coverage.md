# Phase 7: カバレッジ確認

## メタ情報

- phase: 7 / coverage
- prev: phase-6-test-additions
- next: phase-8-refactor

## 目的

カバレッジ AC の適用可否を判定し、適用外である根拠を記録する。

## 実行タスク

1. application code coverage が対象外である理由を記録する
2. shell gate / redaction check / manual smoke の代替 coverage を定義する
3. Phase 12 compliance に coverage exemption を接続する

## 入力

- Phase 5 で確定した変更対象ファイル一覧
- Phase 6 で実行した grep gate / redaction-check 結果

## 出力

- `outputs/phase-7/coverage-ac-exemption.md`

## 要件

### 判定

本タスクは以下の理由により **coverage AC 適用外** とする（index.md `coverage_ac: 適用外` と整合）:

1. 変更対象は `.env.example` / `docs/runbooks/*.md` / `.claude/skills/.../deployment-secrets-management.md` / `scripts/verify-onepassword-op-uri-canonical.sh` のみ
2. application code（`apps/api/src`、`apps/web/src`、`packages/*/src`）への変更は 0 行
3. vitest/jest が走る対象ファイルへの変更がないため、Statements/Branches/Functions/Lines は変動しない
4. 新規追加 bash script は CI 内 shell gate（grep）であり、application coverage 集計の対象外

### 代替検証（grep gate のカバー範囲）

`scripts/verify-onepassword-op-uri-canonical.sh` の走査対象範囲を明示する:

| 対象 | カバー | 除外理由 |
|------|--------|----------|
| `.env.example` / `apps/*/wrangler.toml` / `apps/web/.dev.vars.example` | ✅ | runtime secrets injection 経路 |
| `docs/runbooks/**` | ✅ | operator manual の参照経路 |
| `.claude/skills/**` | ✅ | inventory の正本 |
| `docs/30-workflows/completed-tasks/**` | ❌（除外） | 履歴 evidence は immutable・現行参照対象外 |
| `docs/30-workflows/issue-765-.../outputs/**` | ❌（除外） | 本 task 自身の evidence 自己参照を抑止 |
| `node_modules/**` / `.git/**` | ❌（除外） | 生成物 / VCS 内部 |

### 既存 coverage 値の non-regression 確認（任意）

```bash
mise exec -- pnpm --filter "@ubm-hyogo/api" test:cov --run 2>&1 | tail -20
mise exec -- pnpm --filter "@ubm-hyogo/web" test:cov --run 2>&1 | tail -20
```

期待: 本 task 差分起因の coverage 低下は構造的に発生しない。値の変動があれば原因切り分けを記録するが、AC 判定は変えない。

## ローカル実行・検証コマンド

```bash
bash scripts/verify-onepassword-op-uri-canonical.sh
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 受入基準

- [ ] coverage AC 適用外の判定と根拠が `outputs/phase-7/coverage-ac-exemption.md` に記録
- [ ] grep gate のカバー範囲表が同ファイルに記録
- [ ] Phase 6 結果と整合

## 依存タスク

- Phase 6 完了

## 参照資料

- `phase-4-test-plan.md`
- `phase-6-test-additions.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`

## 統合テスト連携

- line coverage の代替として shell gate と manual smoke evidence を採用する
- runtime smoke は user approval 後まで `pending_user_approval` として扱う

## 成果物

- `outputs/phase-7/coverage-ac-exemption.md`

## 完了条件

- [ ] AC 適用外判定と根拠 4 点が明文化
- [ ] カバー範囲表が明文化

## タスク100%実行確認【必須】

- [ ] 成果物 1 ファイル作成
- [ ] 実値・token 値・vault URI 値が一切記載されていない

## 次Phase

phase-8-refactor.md
