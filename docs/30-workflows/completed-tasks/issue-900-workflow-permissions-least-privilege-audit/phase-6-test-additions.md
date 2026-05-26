# Phase 6: テスト追加

## 6.1 方針

YAML 設定のみの変更のため、新規 vitest / playwright テストは追加しない。代わりに **静的検証スクリプト** を `scripts/` に追加して回帰防止する。

## 6.2 追加ファイル

### `scripts/verify-workflow-top-level-permissions.sh`（新規）

```bash
#!/usr/bin/env bash
# 全 workflow が top-level `permissions:` を宣言していることを検証する
# Exit 0: PASS / Exit 1: FAIL
set -euo pipefail

missing=()
for workflow in .github/workflows/*.yml; do
  if ! awk '/^jobs:/{exit} /^permissions:/{found=1; exit} END{exit found ? 0 : 1}' "$workflow"; then
    missing+=("$workflow")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "Missing top-level permissions:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "All workflows declare top-level permissions"
```

実行権限: `chmod +x scripts/verify-workflow-top-level-permissions.sh`

## 6.3 CI への組み込み（オプション・本サイクル内）

`.github/workflows/ci.yml` の actionlint step 直後に下記を追加することで回帰防止する:

```yaml
      - name: Verify top-level workflow permissions
        run: bash scripts/verify-workflow-top-level-permissions.sh
```

この追加は本仕様書スコープ内で実施する（CONST_007: 1 サイクル内完了）。

## 6.4 検証コマンド

```bash
bash scripts/verify-workflow-top-level-permissions.sh
# 期待: "All workflows declare top-level permissions"
```
