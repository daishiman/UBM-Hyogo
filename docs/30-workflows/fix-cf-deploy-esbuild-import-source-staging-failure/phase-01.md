# Phase 1: 現状把握

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 名称 | 現状把握 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | なし |
| 次 Phase | 2 (候補解比較・採択) |

## 目的

CI deploy 失敗の原因を「esbuild override と wrangler 内部 esbuild の version skew」に確定させ、
依存マップと CI 失敗ログを Phase 2 の意思決定材料として固定する。

## 真の論点

### 論点 1: なぜ `"import-source" is not a valid feature name` が出るのか

- `supported` は esbuild の build option（`{ "import-source": true|false, ... }`）。
- feature 名 `import-source` は **esbuild 0.25.5 で導入**（リリースノート要確認）され、0.27.x で安定。
- 現在のルート `package.json` には:

```json
"pnpm": {
  "overrides": {
    "esbuild": "0.25.4"
  }
}
```

- pnpm overrides は **transitive 依存も含めて強制**するため、wrangler 4.85.0 が内部依存する `esbuild@0.27.3` が 0.25.4 にダウングレードされる。
- 0.25.4 は `import-source` feature 名を知らないため parse error で即座に build を中断する。

### 論点 2: 「なぜ override が存在するのか」を消さずに整合する方法

- `scripts/cf.sh` のコメント:

  > OpenNext build の host/binary mismatch 再発時は root package.json の pnpm.overrides.esbuild を `@opennextjs/aws` が使用する esbuild version に合わせ、pnpm install 後に build:cloudflare を再検証する

- つまり override の存在理由は **OpenNext / wrangler 間で esbuild バージョンを揃え、host/binary mismatch を防ぐこと**。
- 単純に override を削除すると、OpenNext と wrangler が別 esbuild instance を持って binary path 解決失敗が再発する可能性がある。
- したがって正しい対処は「override を削除」ではなく「**override を wrangler 4.85.0 同梱版に合わせて bump**」。

### 論点 3: ローカル `scripts/cf.sh` の fallback ロジックは効くのか

- 現状 `scripts/cf.sh` は `ESBUILD_BINARY_PATH` を `node_modules/wrangler/node_modules/@esbuild/<platform>/bin/esbuild` に解決する。
- pnpm overrides により wrangler nested の esbuild も hoisted 単一 esbuild 0.25.4 に置換されている可能性があり、`node_modules/wrangler/node_modules/@esbuild` 自体が存在しない場合 fallback が空振りする。
- Phase 5 で実物の `node_modules` ツリーを確認し、必要なら探索 path 配列を拡張する。

## CI 失敗ログ要約

| ワークフロー | ジョブ | 実行コマンド | エラー |
| --- | --- | --- | --- |
| `web-cd.yml` | `deploy-staging` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | `"import-source" is not a valid feature name for the "supported" setting` |
| `web-cd.yml` | `deploy-production` | 同上 (`--env production`) | 同上 |
| `backend-ci.yml` | `deploy-staging` | `cloudflare/wrangler-action@v3` (`wranglerVersion: 4.85.0`) → `npx wrangler deploy --env staging` (`apps/api`) | 同上 |
| `backend-ci.yml` | `deploy-production` | 同上 (`--env production`) | 同上 |

CI ログ上には `update available 4.92.0` の wrangler 通知も観測されており、代替案として参考にする。

## 依存マップ（依存メタとしての overrides）

```
ルート package.json
  devDependencies.wrangler = "4.85.0"
    └─ wrangler/node_modules/esbuild は package.json で "0.27.3" を要求
         └─ pnpm.overrides.esbuild = "0.25.4" により 0.25.4 に強制ダウングレード
              └─ wrangler 4.85.0 が "supported: { import-source: ... }" を build option に渡す
                   └─ esbuild 0.25.4 が feature 名を知らず parse error
```

OpenNext 側:

```
apps/web
  dependencies.@opennextjs/cloudflare → @opennextjs/aws → esbuild ^?.??
    └─ 同じ override 0.25.4 が適用される
         └─ apps/web build (next build --webpack → OpenNext bundle) も同経路で失敗
```

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| ルート `package.json` | `pnpm.overrides.esbuild: "0.25.4"` 存在 | package.json |
| `pnpm-lock.yaml` | overrides に整合した resolution が記録済（再生成対象） | pnpm-lock.yaml |
| `scripts/cf.sh` | `ESBUILD_BINARY_PATH` を wrangler 同梱 esbuild へ向ける fallback あり | scripts/cf.sh:37-46 |
| `scripts/cf.sh` のコメント | overrides 存在理由を明示（OpenNext host/binary mismatch 対策） | scripts/cf.sh:5-8 |
| `apps/api/wrangler.toml` | cron / D1 binding 設定済 | apps/api/wrangler.toml |
| `apps/web/wrangler.toml` | OpenNext Cloudflare adapter 経由 deploy | apps/web/wrangler.toml |
| `.github/workflows/web-cd.yml` | `scripts/cf.sh deploy` 経由 | .github/workflows/web-cd.yml:52,97 |
| `.github/workflows/backend-ci.yml` | `cloudflare/wrangler-action@v3` + `wranglerVersion: 4.85.0` を 4 箇所でピン | .github/workflows/backend-ci.yml:43,54,98,109 |

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | deploy パイプラインが復旧するか | PASS | — |
| 実現性 | 依存メタの bump + lockfile 再生成だけで対処可能か | PASS | wrangler 4.85.0 の同梱 esbuild と互換ある最小 bump を Phase 2 で決定 |
| 整合性 | OpenNext / wrangler / vitest と整合するか | CONDITIONAL | Phase 5 のローカル build と Phase 6 の test 影響評価で確認 |
| 運用性 | `scripts/cf.sh` のラッパー前提を崩さないか | PASS | fallback path 配列を Phase 5 で確認 |

## 実行タスク

- [ ] 失敗ログを再収集（最新 CI Run URL を `outputs/phase-01/dependency-map.md` に記録）
- [ ] `node_modules/wrangler/package.json` の `dependencies.esbuild` 値を確認（実物の要求 version を確定）
- [ ] `@opennextjs/aws` / `@opennextjs/cloudflare` の esbuild 要求範囲を確認
- [ ] esbuild リリースノートで `import-source` feature 導入 version を確認
- [ ] `outputs/phase-01/dependency-map.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/dependency-map.md | 依存マップ・CI 失敗ログ要約・互換マトリクス調査結果 |

## 完了条件

- [ ] 依存マップが図解されている
- [ ] CI 失敗ログがワークフロー × ジョブ単位で要約されている
- [ ] wrangler / OpenNext / esbuild の互換マトリクスが調査タスクとして列挙されている
- [ ] 4 条件評価の CONDITIONAL が Phase 2 への申し送りとして明示されている

## 次 Phase

- 次: 2 (候補解比較・採択)
- 引き継ぎ事項:
  - 第一候補（override を `0.27.3` 以上に bump）と代替案（wrangler 自身を 4.92.0 以降に bump）の比較材料
  - OpenNext が要求する esbuild メジャー範囲
- ブロック条件: `node_modules/wrangler/package.json` の esbuild 要求値が未確認の場合 Phase 2 に進まない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
