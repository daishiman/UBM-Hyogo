# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 3 |
| 状態 | spec_created |

## 目的

Phase 2 設計の妥当性を 4 観点で検証し、実装着手前に懸念を解消する。

## レビュー観点

### 1. 整合性（CLAUDE.md 不変条件 / 既存 build pipeline）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| `wrangler` 直接呼び出し禁止 | OK | `scripts/cf.sh` 経路維持 |
| D1 直接アクセス禁止 | OK | build toolchain のみ |
| `apps/web` production build = webpack | OK | `next build --webpack` は維持、`opennextjs-cloudflare build` の内部 esbuild 解決のみ修正 |
| Node 24 / pnpm 10 固定 | OK | `mise exec --` 経由維持 |

### 2. 互換性リスク

| 依存 | 0.25.4 強制で動作するか | 確認方法 |
| --- | --- | --- |
| vite 5.4.21 (dev/build) | 高確率で OK（vite は esbuild major bump にも追従しやすい） | `pnpm dev` 起動・unit test 実行 |
| vitest 2.1.9 | 高確率で OK（esbuild 0.21〜0.27 で動作実績あり） | `pnpm test` |
| wrangler 4.85.0 | 要確認（実測 dependency は 0.27 系、0.25.4 pin は範囲内と断言しない） | `bash -n scripts/cf.sh` + `bash scripts/cf.sh --version`（認証不要） |
| tsx 4.21.0 | 要確認（範囲 `~0.27.0` を downgrade） | tsx スクリプト実行（`pnpm skill:logs:render` 等） |
| @opennextjs/aws | OK（要求と一致） | `build:cloudflare` PASS |

**懸念**: tsx 4.21.0 が 0.27 要求の場合、overrides で 0.25.4 に下げると warning / fail の可能性。Phase 5 実装時に tsx 経由スクリプトを smoke 実行する。

### 3. ロールバック性

- 失敗時の戻し: `git checkout package.json pnpm-lock.yaml && pnpm install` で完全復元可能
- `scripts/cf.sh` 変更を入れる場合も追加関数 1 つで隔離されており復旧容易
- production 影響なし（build pipeline のみ、Cloudflare runtime には未到達）

### 4. CI 影響

- `verify-indexes-up-to-date`: Phase 12 で aiworkflow indexes を触るため対象。更新後に `mise exec -- pnpm indexes:rebuild` または現行 generator を実行し、差分を確認する
- `backend-ci.yml` / `web-cd.yml`: pnpm install 経路は同じため、overrides 反映後の lockfile が CI でも正常に解決されることを確認

## 残懸念と対応

| 懸念 | 対応 |
| --- | --- |
| tsx の esbuild 0.27 要求との衝突 | Phase 5 の検証ステップ B で `pnpm skill:logs:render` 等 tsx スクリプトを実行し回帰確認 |
| vite dev サーバ起動エラー | Phase 5 で `pnpm dev:web` を 10 秒起動して確認 |
| lockfile 差分が想定外に膨らむ | Phase 5 で `git diff --stat pnpm-lock.yaml` を確認し、esbuild 関連以外の drift があれば原因調査 |
| overrides 単独で解消しない場合 | Phase 2 設計2 の cf.sh フォールバックに切り替え（事前合意） |

## レビュー結論

- 設計2（overrides 第一手 → cf.sh フォールバック第二手）の段階的アプローチは妥当。ただし fallback 採用時は `apps/web` の標準 `build:cloudflare` script に接続し、AC-1 の受入コマンドを二重化しない
- リスクは tsx 互換性のみで、検証ステップで吸収可能
- 設計承認: PASS

## 完了条件

- [ ] 4 観点の判定が記載されている
- [ ] 残懸念と対応が一覧化されている
- [ ] 設計承認可否が明示されている

## 成果物

- `outputs/phase-03/main.md`

## 実行タスク

- Phase 2 の overrides / fallback 設計を不変条件と照合する
- wrangler / tsx の esbuild 0.27 系依存を前提に、0.25.4 pin のリスクを明記する
- aiworkflow index sync と `verify-indexes-up-to-date` への影響を Phase 12 に渡す

## 統合テスト連携

Phase 11 evidence の `tsx-smoke.log`、`cf-sh-syntax.log`、`wrangler-version.log` をレビュー結論の検証点とする。

## 参照資料

- Phase 2 設計
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」
- `apps/web/package.json`「`build:cloudflare`」
