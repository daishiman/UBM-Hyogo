# Phase 5: 実装手順

## 5.1 変更対象ファイル一覧

| # | path | 変更種別 | 挿入内容 |
|---|------|---------|---------|
| 1 | .github/workflows/backend-ci.yml | 編集 | top-level permissions 追加 |
| 2 | .github/workflows/d1-migration-verify.yml | 編集 | 同上 |
| 3 | .github/workflows/e2e-tests.yml | 編集 | 同上 |
| 4 | .github/workflows/lighthouse.yml | 編集 | 同上 |
| 5 | .github/workflows/playwright-smoke.yml | 編集 | 同上 |
| 6 | .github/workflows/playwright-visual-baseline-update.yml | 編集 | 同上 |
| 7 | .github/workflows/playwright-visual-full.yml | 編集 | 同上 |
| 8 | .github/workflows/validate-build.yml | 編集 | 同上 |
| 9 | .github/workflows/verify-design-tokens.yml | 編集 | 同上 |
| 10 | .github/workflows/verify-esbuild.yml | 編集 | 同上 |
| 11 | .github/workflows/verify-primitive-adoption.yml | 編集 | 同上 |
| 12 | .github/workflows/web-cd.yml | 編集 | 同上 |

## 5.2 共通挿入パターン

各 workflow の `on:` ブロック終了直後・`jobs:` の直前に以下 3 行を挿入する。空行で囲うこと。

```yaml

permissions:
  contents: read

```

## 5.3 挿入位置（実コード行番号ベース）

行番号は仕様書作成時点（2026-05-25）の HEAD。実装時は `grep -n "^jobs:" path` で再確認すること。

| workflow | `jobs:` 行 | 挿入位置（その直前） |
|----------|------------|---------------------|
| backend-ci.yml | 13 | 12 行目に空行 + permissions ブロック挿入 |
| d1-migration-verify.yml | 12 | 11 行目に挿入 |
| e2e-tests.yml | 12 | 11 行目 |
| lighthouse.yml | 11 | 10 行目 |
| playwright-smoke.yml | 35 | 34 行目 |
| playwright-visual-baseline-update.yml | 11 | 10 行目 |
| playwright-visual-full.yml | 12 | 11 行目 |
| validate-build.yml | 13 | 12 行目 |
| verify-design-tokens.yml | 20 | 19 行目 |
| verify-esbuild.yml | 8 | 7 行目 |
| verify-primitive-adoption.yml | 9 | 8 行目 |
| web-cd.yml | 13 | 12 行目 |

## 5.4 編集手順（推奨: 1 件ずつ Edit）

1. `grep -n "^on:\|^jobs:" path` で位置を再確認。
2. Edit ツールで `^jobs:` 直前に `\npermissions:\n  contents: read\n\n` を挿入。
3. `awk '/^jobs:/{exit} /^permissions:/{print "OK"}' path` で挿入確認。
4. 既存 job-level `permissions:` ブロックを誤って削除していないことを `git diff path` で確認。

## 5.5 グループ B 注意点

### backend-ci.yml
- `:19-21` の `permissions: { deployments: write, ... }` は job-level。変更禁止。
- `:85-87` の同種 job-level 宣言も変更禁止。
- top に追加するのは `contents: read` のみ。

### playwright-visual-baseline-update.yml
- `:15-` の job-level `contents: write` / `pull-requests: write` は維持（baseline push に必要）。
- top に `contents: read` を追加するだけで、job-level が write へ上書きする。

### web-cd.yml
- `:19-`, `:69-`, `:161-` の job-level 宣言を維持。
- top に `contents: read` 追加。

## 5.6 ロールバック手順

```bash
git checkout dev -- .github/workflows/<file>.yml
```

per-file で切り戻し可能。
