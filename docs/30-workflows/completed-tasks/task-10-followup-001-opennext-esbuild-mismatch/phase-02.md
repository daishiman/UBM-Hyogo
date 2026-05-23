# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 2 |
| 状態 | spec_created |

## 目的

esbuild の単一化方針と `scripts/cf.sh` のフォールバック設計を確定する。

## 設計1: `pnpm.overrides` の追加

### 変更対象

- `package.json` (top-level)

### 差分方針

```jsonc
{
  // ... existing fields ...
  "pnpm": {
    "overrides": {
      "esbuild": "0.25.4"
    }
  }
}
```

### 採用理由

- `@opennextjs/aws` の host esbuild が 0.25.4 である事実に対し、workspace 全体を 0.25.4 に合わせる
- vite 5.4.21 / vitest 2.1.9 / wrangler 4.85.0 / tsx 4.21.0 は 0.25.x 系で互換動作する想定（Phase 4 で smoke 検証）
- 単一 version pin により `@esbuild/<platform>` binary も自動的に 0.25.4 に揃う

### 影響範囲

| パッケージ | 元 range | 強制値 | 想定影響 |
| --- | --- | --- | --- |
| vite@5.4.21 | esbuild@0.21.5 | 0.25.4 | dev/build 動作確認が必要（Phase 4） |
| vitest@2.1.9 | esbuild@^0.21.3 | 0.25.4 | unit test 実行で確認 |
| wrangler@4.85.0 | 実測 `esbuild@0.27.3` 系 | 0.25.4 | 要確認。既存範囲内とは扱わず、`scripts/cf.sh` wrapper の syntax/version smoke で確認 |
| tsx@4.21.0 | esbuild@~0.27.0 | 0.25.4 | 要確認。tsx 経由スクリプトの smoke 確認が必須 |
| @opennextjs/aws | esbuild@0.25.4 | 0.25.4 | 一致（本来の正解値） |

### 代替案

- `"esbuild": "^0.25.0"` レンジ指定 → tsx の 0.27 要求と衝突する可能性。strict pin が安全
- `"esbuild": ">=0.25.0 <0.26.0"` → 同上、strict pin が予測可能

## 設計2: `scripts/cf.sh` フォールバック強化

### 変更対象

- `scripts/cf.sh`（既存の `set_tsx_esbuild_binary_path` と並列に `set_opennext_esbuild_binary_path` を追加。`build:cloudflare` 系起動時のみ有効化）

### 差分方針（擬似コード）

```bash
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

### 起動条件

- `cf.sh` の sub-command として `build:web`（新設、`bash scripts/cf.sh build:web` で `pnpm --filter @ubm-hyogo/web build:cloudflare` を呼ぶ）を追加する案を Phase 3 でレビュー
- ただし overrides のみで AC-1 が PASS する場合、cf.sh への追加は不要。**overrides 単独で解消するかを Phase 5 で先に検証し、解消する場合は本セクションをスコープアウトする**
- fallback を採用する場合は、`apps/web/package.json#build:cloudflare` を `bash ../../scripts/cf.sh build:web` 等へ接続し、PR / CI / 開発者が叩く標準コマンドを分岐させない。`bash scripts/cf.sh build:web` だけの PASS は AC-1 PASS としない

### 採用判断

- 第一手: overrides のみで `pnpm install` → `build:cloudflare` を試す
- 第二手（overrides で解消しない場合のみ）: `scripts/cf.sh` フォールバック追加

## 設計3: lockfile 再生成戦略

- `mise exec -- pnpm install`（`--force` ではなく通常の install）で lockfile を更新する
- 差分が膨らんだ場合、`pnpm install --frozen-lockfile` を CI 側で fail させない確認が必要
- 想定 lockfile 差分: `esbuild` / `@esbuild/<platform>` 系エントリのみ

## 設計4: テスト戦略の概要（詳細は Phase 4）

| 検証項目 | コマンド | 期待 |
| --- | --- | --- |
| typecheck 回帰なし | `mise exec -- pnpm typecheck` | green |
| lint 回帰なし | `mise exec -- pnpm lint` | green |
| unit test 回帰なし（vitest） | `mise exec -- pnpm test` | green（既存通過範囲） |
| web build 回復 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0 |
| api build 回帰なし | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | exit 0 |
| wrangler ラッパー回帰なし | `bash -n scripts/cf.sh` + `bash scripts/cf.sh --version` | shell syntax OK、wrapper 経由で version 表示 |

## 設計5: ドキュメント設計

- `scripts/cf.sh` ヘッダコメントに「esbuild 単一化方針（`pnpm.overrides`）と再発時の確認手順」を追記
- `docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md`（既存なら追記、なければ新規）に短い troubleshooting note を追加
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md` に lesson 追加
- `.claude/skills/aiworkflow-requirements/{indexes/quick-reference.md,indexes/resource-map.md,references/task-workflow-active.md,LOGS/_legacy.md,changelog/20260511-task-10-followup-001-opennext-esbuild-mismatch.md}` に same-wave sync を反映

## 完了条件

- [ ] overrides の追加内容（pin バージョン）が決定している
- [ ] 影響範囲表が完成している
- [ ] cf.sh フォールバックの起動条件が決定している
- [ ] lockfile 再生成戦略が決定している
- [ ] ドキュメント追記先が確定している

## 成果物

- `outputs/phase-02/main.md`

## 実行タスク

- `pnpm.overrides` の採用条件と fallback 採用条件を確定する
- `apps/web/package.json#build:cloudflare` を標準受入経路として維持する設計に揃える
- aiworkflow-requirements same-wave sync 対象を Phase 12 に引き渡す

## 統合テスト連携

Phase 4 / Phase 11 の `build:cloudflare`、tsx smoke、`scripts/cf.sh` wrapper smoke で設計の妥当性を検証する。

## 参照資料

- Phase 1 の根本原因セクション
- `package.json` / `pnpm-workspace.yaml`
- `scripts/cf.sh`
- https://pnpm.io/package_json#pnpmoverrides
