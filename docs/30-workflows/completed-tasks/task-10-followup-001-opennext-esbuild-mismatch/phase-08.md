# Phase 8: DRY 化 / 重複解消確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 8 |
| 状態 | spec_created |

## 目的

本タスクで導入する設定・ドキュメントが既存資産と重複していないかを点検し、重複がある場合は統合先を明示する。

## 重複候補チェック

### 1. `pnpm.overrides` の他箇所定義

- `package.json` 内 `pnpm` キーが他に存在しないことを確認: `grep -n '"pnpm"' package.json`
- workspace 内子 `package.json`（`apps/*/package.json`, `packages/*/package.json`）に overrides が無いことを確認

### 2. `ESBUILD_BINARY_PATH` 設定の重複

- 既存 `scripts/cf.sh` には `ESBUILD_PARENT`（wrangler 同梱版）と `set_tsx_esbuild_binary_path`（tsx 同梱版）が存在
- 本タスクで `set_opennext_esbuild_binary_path` を追加する場合、3 経路の呼び分けが重複ロジックにならないよう次の設計とする:
  - 共通ヘルパ `_set_esbuild_binary_path_from()` を追加し、parent dir を引数で受け取って候補探索する
  - 既存の `ESBUILD_PARENT` と `set_tsx_esbuild_binary_path` も同一ヘルパに集約する

#### 共通ヘルパ案

```bash
_set_esbuild_binary_path_from() {
  local parent="$1"
  for p in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
    local candidate="$parent/$p/bin/esbuild"
    if [ -f "$candidate" ]; then
      export ESBUILD_BINARY_PATH="$candidate"
      return 0
    fi
  done
  return 1
}
```

`set_tsx_esbuild_binary_path` / `set_opennext_esbuild_binary_path` / wrangler デフォルトすべてをこのヘルパ呼び出しに置換する。

ただし、Phase 5 Step 5 で overrides 単独で `build:cloudflare` が PASS する場合、cf.sh への追加は**実施しない**。その場合本 Phase の DRY 化は適用不要。

### 3. troubleshooting note の重複

- 既存 `docs/00-getting-started-manual/` 配下に Cloudflare CLI 関連の troubleshooting note が存在するか確認
  - `find docs/00-getting-started-manual -name "*troubleshoot*"` 等で grep
- 既存があれば追記、なければ新規作成

### 4. aiworkflow lesson の重複

- `.claude/skills/aiworkflow-requirements/lessons-learned/` と `references/` 配下に過去の esbuild 関連 lesson があるか確認
  - 既存 lesson に追記するか新規エントリにするかを判断
- `.claude/skills/aiworkflow-requirements/LOGS/` 配下も同様に確認

## DRY 化判断

| 項目 | 重複あり | 統合する | 統合しない場合の理由 |
| --- | --- | --- | --- |
| package.json pnpm キー | No | 不要 | - |
| cf.sh esbuild 解決 | Yes（潜在的） | overrides で解消する場合は不要、フォールバック追加時のみ統合 | - |
| troubleshooting note | 要確認 | 既存に追記 | 新規分離する積極的理由なし |
| lessons-learned | 要確認 | 既存と無関係なら新規追記 | - |

## 完了条件

- [ ] `pnpm.overrides` の重複確認結果が記載されている
- [ ] cf.sh の DRY 化方針が記載されている（フォールバック追加時のみ適用）
- [ ] troubleshooting note / lesson の追加 vs 統合判断が記載されている

## 成果物

- `outputs/phase-08/main.md`

## 実行タスク

- `pnpm.overrides`、`ESBUILD_BINARY_PATH`、troubleshooting note、lesson fragment の重複を確認する
- fallback 採用時のみ cf.sh helper を共通化する
- 既存 lesson と新規 lesson の役割分担を確定する

## 統合テスト連携

DRY 化の結果は Phase 11 の wrapper smoke と Phase 12 の documentation changelog / artifact inventory で確認する。

## 参照資料

- Phase 5 実装ランブック
- 既存 `scripts/cf.sh`
- `.claude/skills/aiworkflow-requirements/references/`
