# Phase 9: アクセシビリティ・Regression

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 種別 | a11y / 回帰 |
| 入力 | Phase 4-8 成果物 |
| 出力 | a11y spec 結果、lighthouse smoke 結果、visual smoke 結果 |

## a11y 検証

| 観点 | 検証方法 |
| --- | --- |
| label-for ↔ input-id 紐付け | Phase 5 で追加した spec で検証 |
| `aria-invalid` / `aria-describedby` | error props 渡し時の DOM 検証 spec |
| `role="alert"` for error | error message の role attribute 検証 |
| keyboard navigation | Pagination のキー操作 spec（任意） |

## visual smoke / lighthouse smoke

- `playwright-smoke / visual (chromium, 4 screens)` を実行し、admin panel の差分を確認
- `lighthouserc.json` 設定で a11y / best-practices スコアの維持を確認

```bash
mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json
mise exec -- pnpm --filter @ubm/web test:visual    # 既存 visual smoke
```

## coverage 検証（再掲）

```bash
bash scripts/coverage-guard.sh    # exit 0 必須
```

## 完了条件

- [ ] a11y spec 全 pass
- [ ] visual smoke baseline 更新が必要な場合は意図的差分のみ
- [ ] lighthouse a11y スコアが既存値を下回らない
- [ ] coverage Statements/Branches/Functions/Lines >=80%

## 次Phase

→ Phase 10（governance / branch protection）
