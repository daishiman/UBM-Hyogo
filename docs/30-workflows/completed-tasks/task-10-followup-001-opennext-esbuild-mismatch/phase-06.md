# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 6 |
| 状態 | spec_created |

## 目的

overrides 適用後に発生し得る異常系を洗い出し、各々の検知方法と復旧手順を明示する。

## 異常系シナリオ

### S1: tsx の esbuild 互換性 fail

- 症状: `pnpm skill:logs:render` 等 tsx 経由スクリプトが `esbuild` 関連エラーで落ちる
- 検知: Phase 5 Step 8 の `tsx-smoke.log` に error 行
- 復旧:
  1. tsx をピン上げ（`tsx@^4.21` のままで esbuild 0.25 と互換するパッチ版を探す）
  2. もしくは tsx を `pnpm.overrides` の影響対象から除外する記法（`"tsx>esbuild": "0.27.3"` 等）を検討
  3. それでも解消しない場合、Phase 2 設計 (B) cf.sh フォールバックに切り替え、overrides を解除

### S2: vite dev サーバ起動 fail

- 症状: `pnpm dev:web` がポート bind 前に esbuild エラーで落ちる
- 検知: Step 8 推奨で 10 秒間動作確認
- 復旧:
  1. vite を `vite@^5.4.x` の最新へ bump（既存 5.4.21 のまま）
  2. vite-plugin-react を最新化
  3. ダメなら overrides を解除し cf.sh フォールバック経路に切替

### S3: vitest テスト fail（新規）

- 症状: 既存通過テストが esbuild 0.25.4 で fail
- 検知: `test.log` に新規 fail
- 復旧:
  1. fail 内容を確認し、esbuild の仕様変更（loader 等）に依存している箇所を特定
  2. 該当テストを最小修正
  3. 修正範囲が大きい場合は本タスクをロールバックし、別タスクで対応

### S4: lockfile 差分が想定外に膨張

- 症状: `git diff --stat pnpm-lock.yaml` で esbuild 関連以外の数十パッケージが drift
- 検知: Step 9 の差分レビュー
- 復旧:
  1. 影響元を `pnpm why <pkg>` で特定
  2. 不要な drift であれば overrides の記法を見直す
  3. `pnpm install --frozen-lockfile` で再現するか確認

### S5: `build:cloudflare` が依然として fail

- 症状: overrides 適用後も "Host version ... does not match binary version ..." が出る
- 検知: Step 5 の `after-build-cloudflare.log`
- 復旧:
  1. `node_modules/@opennextjs/aws/node_modules/esbuild/package.json` の version を確認
  2. nested `@esbuild/<platform>` が同一 version か確認
  3. ズレている場合、`pnpm.overrides` に `"esbuild@0.25.4"` だけでなく `"@esbuild/darwin-arm64": "0.25.4"` 等 platform-specific binary も含める
  4. それでもダメなら Phase 5 Step 6-7（cf.sh フォールバック）を実施

### S6: production deploy の wrangler 経路で esbuild fail

- 症状: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` が esbuild エラー
- 検知: production deploy 試行時（本タスクのスコープ外、追跡のみ）
- 復旧: deploy 経路は OpenNext build output を使うため、本タスクで `build:cloudflare` が PASS していれば理論上影響なし。発生時は task-10-followup-002 等の下流タスクで対処

### S7: CI 上でローカルと異なる挙動

- 症状: ローカル PASS / CI fail
- 検知: PR 後の CI workflow log
- 復旧:
  1. CI の Node / pnpm version を確認（`.mise.toml` と GitHub Actions のセットアップが一致しているか）
  2. CI の `pnpm install --frozen-lockfile` で lockfile が認識されているか
  3. プラットフォーム固有 binary が CI（linux）と local（darwin）でズレるケースに備え、overrides に platform 横断の指定を追加

## 異常系チェックリスト（実装中に都度確認）

- [ ] S1: tsx smoke が PASS
- [ ] S2: vite dev サーバ起動確認（推奨）
- [ ] S3: vitest 既存通過範囲を維持
- [ ] S4: lockfile 差分が想定範囲
- [ ] S5: `build:cloudflare` PASS、`Host version` エラーなし
- [ ] S7: CI workflow も green（PR 作成後）

## 完了条件

- [ ] 7 つの異常系シナリオが定義されている
- [ ] 各シナリオに検知方法・復旧手順が記載されている
- [ ] チェックリストが Phase 5 実装中に追跡可能な形式である

## 成果物

- `outputs/phase-06/main.md`

## 実行タスク

- S1〜S7 の異常系を Phase 5 / Phase 11 の検知ログへ対応付ける
- fallback 採用が必要な条件とロールバック条件を確認する
- CI 差分が発生した場合の追加確認手順を Phase 13 に渡す

## 統合テスト連携

異常系は Phase 11 evidence の failure log と `outputs/phase-11/evidence/anomalies/` で追跡する。

## 参照資料

- Phase 5 実装ランブック
- Phase 3 残懸念
