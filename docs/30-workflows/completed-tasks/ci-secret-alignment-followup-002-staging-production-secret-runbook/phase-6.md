# Phase 6: 検証手順設計（grep gate / 章立て一致）

## 目的

docs-only 成果物を read-only grep gate で検証できるようにする。

## 検証カテゴリ

| カテゴリ | 目的 | 実行コマンド | PASS 基準 |
|---------|------|------------|---------|
| G1: 章立て一致 | 3 runbook の H2 見出しが完全一致 | 下記 G1 | diff が空 |
| G2: 実値混入 0 件 | token / JWT / hex / Cloudflare token-like literal が含まれない | 下記 G2 | grep ヒット 0（`op://` 参照など許可語は除外） |
| G3: environment 名参照 | 各 runbook が正しい environment を参照 | 下記 G3 | 期待値完全一致 |
| G4: 1Password 参照のみ | secret 取得元が `op://` 形式である | 下記 G4 | `op://` 行が 1 件以上、リテラル token 0 件 |
| G5: dirty code 0 | `apps/` / `packages/` に差分なし | 下記 G5 | 差分 0 行 |
| G6: 親 index 整合 | 親 `index.md` から新規 runbook 2 本が参照され、既存 `secret-provisioning.md` と同じ family として読める | 下記 G6 | grep 2 件ヒット |

## 検証コマンド

### G1: 章立て一致
```bash
RUNBOOK_DIR=docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks
diff <(grep -E '^## ' "$RUNBOOK_DIR/secret-provisioning.md" | sed 's/（.*）//') \
     <(grep -E '^## ' "$RUNBOOK_DIR/staging-secret-provisioning.md" | sed 's/（.*）//')
diff <(grep -E '^## ' "$RUNBOOK_DIR/secret-provisioning.md" | sed 's/（.*）//') \
     <(grep -E '^## ' "$RUNBOOK_DIR/production-secret-provisioning.md" | sed 's/（.*）//')
# 期待: 両 diff が空（exit 0）
```

### G2: 実値混入 0 件
```bash
rg -n '([A-Fa-f0-9]{32,}|eyJ[A-Za-z0-9_-]+|[A-Za-z0-9_-]{40,})' \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md \
  | rg -v 'op://|CLOUDFLARE_API_TOKEN|Cloudflare API Token|secret-provisioning|deploy-production|deploy-staging|staging-runtime-smoke' \
  && echo "FAIL: secret-like literal detected" \
  || echo "OK: no secret-like literals"
# 期待: "OK: no secret-like literals"
```

### G3: environment 名参照
```bash
grep -nE -- '--env staging\b' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md
grep -nE -- '--env production\b' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md
# 期待: 各 runbook で対応する --env オプションがヒットする
# クロスチェック: staging runbook に "--env production" が出ない / 逆も
( grep -nE -- '--env production\b' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md && echo "FAIL" || echo "OK" )
( grep -nE -- '--env staging\b' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md && echo "FAIL" || echo "OK" )
```

### G4: 1Password 参照のみ
```bash
grep -nE 'op://UBM-Hyogo/Cloudflare API Token' \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md
# 期待: 各 runbook で 1 件以上ヒット
```

### G5: dirty code 0
```bash
git status --porcelain apps/ packages/
# 期待: 出力 0 行
```

### G6: 親 index 整合
```bash
grep -nE 'runbooks/(staging|production)-secret-provisioning\.md' \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md
# 期待: 2 行ヒット
```

## 検証実行順序

実装サイクルで以下の順序で実行する:
1. G5（dirty code 0）— 実装前提が崩れていないこと
2. G1（章立て一致）— template 整合
3. G2（実値混入）— セキュリティ最重要
4. G3（environment 名）— 取り違え検出
5. G4（op 参照）— 取得経路確認
6. G6（親 index）— 親整合

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 6 |
| 状態 | completed |

## 実行タスク

- G1 から G6 の検証コマンドと期待値を定義する。

## 参照資料

- `phase-11.md`

## 成果物/実行手順

- grep gate コマンド一覧。

## 統合テスト連携

- 実テストではなく Phase 11 evidence ファイルで代替する。

- 6 つの gate コマンドが全件記述されている
- 各 gate に PASS 基準が定義されている
- 実装サイクルでそのまま実行可能なコマンド形式である
