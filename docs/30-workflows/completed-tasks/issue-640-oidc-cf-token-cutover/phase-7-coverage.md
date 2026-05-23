# Phase 7: カバレッジ確認

> [実装区分: 実装仕様書]

## 1. coverage 対象範囲（明示）

本タスクは shell script + yaml 改修のため、line coverage の数値計測は適用外。代わりに **branch / path coverage を grep evidence で記録**する。

### 7.1 `scripts/redaction-check.sh` の分岐網羅

| 分岐 | カバー TC |
|---|---|
| `--log <file>` 指定 + ファイル存在 | TC-01〜04 |
| `--log <file>` 指定 + ファイル不在 | TC-05 |
| `--log` 未指定（stdin） | TC-06 |
| `--account-id` 指定あり | TC-02 |
| `--account-id` 未指定 + env なし | TC-F03 |
| 未知の引数 | エラーケース（追加 TC-07 で網羅） |

全分岐: **6/6 カバー** → branch coverage 100%

### 7.2 `web-cd.yml` の env 階層パターン

| パターン | 検証 TC |
|---|---|
| job-level env なし | TC-W01 |
| deploy step env あり | TC-W02 |
| build step env なし | TC-W04 |

## 2. 既存 CI への coverage 影響

- `apps/api` / `apps/web` の coverage は変更なし（コード変更が CI/CD layer のみ）
- 既存 coverage gate（`backend-ci.yml` の coverage check）に影響なし

## 3. 証跡

```bash
# 変更行の確認
git diff dev...HEAD -- .github/workflows/web-cd.yml | grep -E '^[+-]'
git diff dev...HEAD -- scripts/redaction-check.sh
```

`outputs/phase-7/coverage-evidence.md` に上記の出力を保存する。

## 4. DoD

- [ ] redaction-check.sh の全分岐をテストでカバー
- [ ] workflow yaml の env 階層パターンを TC で網羅
- [ ] 既存 coverage gate の green 維持
