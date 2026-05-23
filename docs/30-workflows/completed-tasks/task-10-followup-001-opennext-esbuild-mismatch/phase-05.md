# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 5 |
| 状態 | spec_created |

## 目的

確定設計に基づき、最小差分で `build:cloudflare` を回復させる手順を明文化する。後続実行者はこの順序通りに作業すれば AC-1〜AC-8 を満たせる。

## 変更対象ファイル一覧

| パス | 変更種別 | 関連 Phase |
| --- | --- | --- |
| `package.json` | 編集（`pnpm.overrides.esbuild` 追加） | 5 |
| `pnpm-lock.yaml` | 自動再生成 | 5 |
| `scripts/cf.sh` | 編集（必要時のみフォールバック追加） | 5 |

## 主要変更の具体内容

### 変更1: `package.json` overrides

```jsonc
{
  // ... existing fields ...
  "devDependencies": { /* unchanged */ },
  "dependencies": { /* unchanged */ },
  "pnpm": {
    "overrides": {
      "esbuild": "0.25.4"
    }
  }
}
```

**位置**: top-level の末尾セクション。既存 `pnpm` キーが無いことを確認すること（`grep -n '"pnpm"' package.json` が 0 件のはず）。

### 変更2: `scripts/cf.sh`（条件付き）

overrides 適用 + `pnpm install` 後の `build:cloudflare` が PASS した場合、本変更は**スキップ**する。

PASS しない場合のみ次の関数を追加（既存 `set_tsx_esbuild_binary_path` の直下に挿入）:

```bash
# OpenNext (aws) 同梱 esbuild との不整合に対するフォールバック
set_opennext_esbuild_binary_path() {
  local on_esbuild_parent="$REPO_ROOT/node_modules/@opennextjs/aws/node_modules/@esbuild"
  for p in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
    local candidate="$on_esbuild_parent/$p/bin/esbuild"
    if [ -f "$candidate" ]; then
      export ESBUILD_BINARY_PATH="$candidate"
      return 0
    fi
  done
  return 1
}
```

呼び出しは Phase 2 設計 2 の `build:web` サブコマンド追加時のみ。本タスクで `cf.sh` に build:web を追加するかは overrides の効果を見て Phase 6 で決める。

## 実装手順（順序厳守）

### Step 1: ベースライン取得（read-only）

```bash
set -o pipefail
TASK_DIR="docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch"
mkdir -p "$TASK_DIR/outputs/phase-11/evidence"

# 修正前の状態を記録
mise exec -- pnpm why esbuild 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/before-pnpm-why-esbuild.log"
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/before-build-cloudflare.log" || true
```

### Step 2: `package.json` 編集

`package.json` の末尾、最後の `}` の直前に `pnpm.overrides` セクションを追加する（Edit ツールで `"dependencies": { ... }` の閉じ括弧の直後にカンマ付きで挿入）。

### Step 3: lockfile 再生成

```bash
mise exec -- pnpm install
```

完走後、`git status` で `pnpm-lock.yaml` が変更されていることを確認。

### Step 4: 検証 A — esbuild 単一化

```bash
mise exec -- pnpm why esbuild 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/after-pnpm-why-esbuild.log"
find node_modules -path "*/@esbuild/darwin-arm64/package.json" -exec sh -c 'echo "{}:"; grep "\"version\"" {}' \; | tee "$TASK_DIR/outputs/phase-11/evidence/esbuild-versions.log"
```

**期待**: すべて 0.25.4。

### Step 5: 検証 B — `build:cloudflare` 回復

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/after-build-cloudflare.log"
```

**期待**: exit 0、"Host version" エラーが出ない。

#### 失敗時のフォールバック

Step 5 が失敗した場合のみ、Step 6-7 を実施:

### Step 6（条件付き）: `scripts/cf.sh` フォールバック追加

`scripts/cf.sh` に `set_opennext_esbuild_binary_path` を追加（前述）。さらに `cf.sh` に `build:web` サブコマンドを追加し、`apps/web/package.json#build:cloudflare` を fallback 経路へ接続する。標準 `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が PASS しない状態では完了不可。

```bash
# サブコマンド例（cf.sh 内の dispatch ロジックに追加）
case "$1" in
  build:web)
    shift
    set_opennext_esbuild_binary_path
    exec mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare "$@"
    ;;
  # ... existing ...
esac
```

### Step 7（条件付き）: フォールバック経由で再検証

```bash
bash scripts/cf.sh build:web 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/fallback-build-cloudflare.log"
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/after-build-cloudflare.log"
```

### Step 8: 回帰検証（必須）

Phase 4 のテストカテゴリ C-E を順次実行:

```bash
mise exec -- pnpm typecheck 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/lint.log"
mise exec -- pnpm test 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/test.log"
mise exec -- pnpm skill:logs:render 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/tsx-smoke.log"
bash -n scripts/cf.sh 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/cf-sh-syntax.log"
bash scripts/cf.sh --version 2>&1 | tee "$TASK_DIR/outputs/phase-11/evidence/wrangler-version.log"
```

### Step 9: 差分レビュー

```bash
git diff --stat package.json pnpm-lock.yaml scripts/cf.sh
git diff package.json
```

無関係な drift がないこと、esbuild 関連エントリのみが変わっていることを目視確認。

## 入出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | 現状の `package.json` / `pnpm-lock.yaml` / `scripts/cf.sh` |
| 出力 | 編集後の上記ファイル群 + outputs/phase-11/evidence/*.log |
| 副作用 | `node_modules` 内の esbuild が 0.25.4 に統一される。`pnpm install` 完了後の disk usage が一時的に増減 |

## ローカル実行・検証コマンド（DoD）

```bash
# 必須 (AC-1)
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

# 必須 (AC-2)
mise exec -- pnpm why esbuild

# 必須 (AC-3)
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 必須 (AC-4)
bash -n scripts/cf.sh
bash scripts/cf.sh --version
```

## 完了条件 (DoD)

- [ ] `package.json` に `pnpm.overrides.esbuild = "0.25.4"` が追加されている
- [ ] `pnpm install` が成功し `pnpm-lock.yaml` が再生成されている
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0
- [ ] OpenNext host と platform binary の mismatch pair が 0 件（単一 version でない場合は scope override の理由を Phase 11 / Phase 12 に記録）
- [ ] `typecheck` / `lint` / `test` が green
- [ ] tsx 経由スクリプト smoke が PASS
- [ ] lockfile 差分が esbuild 関連のみ
- [ ] Step 6-7 を実施した場合、`scripts/cf.sh` の差分が `set_opennext_esbuild_binary_path` 関数追加と `build:web` サブコマンド追加に限定され、`apps/web/package.json#build:cloudflare` が fallback 経路へ接続されている

## 成果物

- 編集済み `package.json` / `pnpm-lock.yaml` / (条件付き) `scripts/cf.sh`
- `outputs/phase-05/main.md` に実装サマリ
- `outputs/phase-11/evidence/*.log` 一式

## 実行タスク

- baseline evidence を workflow-local `outputs/phase-11/evidence/` に取得する
- `package.json` / `pnpm-lock.yaml` を最小差分で更新する
- fallback 採用時は `scripts/cf.sh build:web` と `apps/web/package.json#build:cloudflare` を接続する
- 回帰検証と差分レビューを実施する

## 統合テスト連携

実装後は Phase 11 の `after-build-cloudflare.log`、`after-pnpm-why-esbuild.log`、`esbuild-versions.log`、`typecheck.log`、`lint.log`、`test.log`、`tsx-smoke.log`、`cf-sh-syntax.log`、`wrangler-version.log` で AC-1〜AC-5 を確認する。

## 参照資料

- Phase 2 設計
- Phase 4 テスト戦略
- `scripts/cf.sh`（既存実装）
