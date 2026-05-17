# Phase 8: リファクタ

## メタ情報

- phase: 8 / refactor
- prev: phase-7-coverage
- next: phase-9-qa

## 目的

Phase 5 実装と Phase 6 test 追加を見直し、可読性・保守性・redaction 健全性を担保する。

## チェック観点

### コード可読性

- workflow YAML の env block インデント・コメントが他 step と整合している
- shell gate の grep pattern が将来の secret 追加で誤検知しない（`CLOUDFLARE_API_TOKEN_*` 形式の scoped name を白リストで拡張可能な構造）

### Redaction 健全性

```bash
# 仕様書・skeleton ドキュメントに token 値が混入していないか
bash scripts/redaction-check.sh docs/30-workflows/issue-718-legacy-cf-token-revocation/

# 期待: exit 0、検出 0 件
```

### 不要差分の除去

- `.github/workflows/*.yml` の差分が rename のみで、空白・行末・順序などの不要変更が混入していない
- `workflow-env-scope.test.sh` の追加セクションが既存セクションと重複していない

### ドキュメント整合

- 各 phase 文書間のクロスリンクが切れていない
- `index.md` の Phase 表とファイル名が一致

## 実行コマンド

```bash
git diff --stat origin/dev...HEAD -- .github/workflows/ scripts/__tests__/
git diff -w origin/dev...HEAD -- .github/workflows/web-cd.yml | head -40
bash scripts/redaction-check.sh docs/30-workflows/issue-718-legacy-cf-token-revocation/
```

## 成果物

- `outputs/phase-8/refactor-checklist.md`
- `outputs/phase-8/redaction-check-result.md`

## 完了条件

- [ ] redaction check exit 0
- [ ] 不要差分なし
- [ ] ドキュメント間リンク切れなし

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成

## 次Phase

phase-9-qa.md
