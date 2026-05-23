# Phase 09 outputs / main

## secret hygiene

### 禁止
- token 値の echo/cat/printenv
- evidence への env dump
- private token URL

### 検証
```bash
grep -rE "ghp_[A-Za-z0-9]{36,}|cf_[A-Za-z0-9]+|CLOUDFLARE_API_TOKEN=" \
  outputs/phase-11/evidence/ \
  | tee outputs/phase-11/evidence/secret-hygiene-grep.log
# 期待 0 行
```

検知時: ファイル削除 + token rotate + 再 grep。

## coverage 閾値

- vitest coverage 閾値（既存 `vitest.config.ts`）を下げない
- A/B 採用後も baseline 維持

```bash
grep -E "All files\s+\|" outputs/phase-11/evidence/ab-{N}-run-3.log
```

## 品質 gate

| gate | 失敗時 |
| --- | --- |
| secret grep 0 件 | 削除 + rotate |
| 133/133 PASS | N 不採用 |
| 0 EADDRNOTAVAIL | N 不採用 |
| coverage 維持 | N 不採用 |
| apps/api/src 不変 | 作業中断 |
| apps/api/migrations 不変 | 作業中断 |

## 編集可能ファイル

`apps/api/package.json#scripts.test:coverage` のみ（A/B 採用時）。

## 次フェーズ

Phase 10 最終レビュー。
