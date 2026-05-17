# Phase 3: 全体設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 名称 | 全体設計 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | 2 (候補解比較・採択) |
| 次 Phase | 4 (詳細実装手順) |

## 目的

採択案（第一候補 A: `pnpm.overrides.esbuild` の bump）に基づき、変更対象ファイル一覧と Phase 4 以降の俯瞰図を確定する。

## 変更対象ファイル一覧（第一候補 A）

| 種別 | パス | 役割 | 変更内容 |
| --- | --- | --- | --- |
| 編集 | `package.json` | ルート overrides 正本 | `pnpm.overrides.esbuild` を `"0.25.4"` → `"0.27.3"` 以上に変更 |
| 再生成 | `pnpm-lock.yaml` | 依存解決の確定値 | `pnpm install --force` で再生成 |
| 参照のみ | `scripts/cf.sh` | esbuild path 解決ロジック | Phase 5 で fallback path 配列が新依存ツリーで有効か確認。必要時のみ追記 |
| 参照のみ | `apps/api/wrangler.toml` | wrangler build 対象 | 変更なし |
| 参照のみ | `apps/web/wrangler.toml` | OpenNext build 対象 | 変更なし |
| 参照のみ | `.github/workflows/web-cd.yml` | deploy 発火源 | 変更なし（候補 B/C 切替時のみ wranglerVersion 更新） |
| 参照のみ | `.github/workflows/backend-ci.yml` | deploy 発火源 | 変更なし（候補 B/C 切替時のみ wranglerVersion 4 箇所更新） |

## 関数・モジュール構造（依存メタ）

依存メタとしての overrides オブジェクト構造:

```jsonc
{
  "pnpm": {
    "overrides": {
      "esbuild": "0.27.3" // ← wrangler 4.85.0 同梱版に合わせて bump
    }
  }
}
```

副次的に影響を受ける概念モジュール:

- `pnpm-lock.yaml` 内の `wrangler@4.85.0` 解決ブロックの `esbuild` resolved-version
- `pnpm-lock.yaml` 内の `@opennextjs/aws` / `@opennextjs/cloudflare` 解決ブロックの `esbuild` resolved-version
- `node_modules/wrangler/node_modules/@esbuild/<platform>/bin/esbuild`（`scripts/cf.sh` の参照対象）

## 入出力（pnpm install の挙動）

| ステップ | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `pnpm install --force` | 更新済 `package.json` | 新 `pnpm-lock.yaml` | `node_modules` 再構築、esbuild platform binary 再 download |
| `pnpm install` (override 後 1 度目以降) | 同じ `package.json` | lockfile 差分なし | hoisted esbuild が 0.27.x に切り替わる |

## Phase 4 以降の俯瞰

```
Phase 4: 詳細実装手順
  - package.json diff 案
  - pnpm install --force コマンド
  - scripts/cf.sh fallback 確認手順

Phase 5: ローカル検証
  - mise exec -- pnpm typecheck
  - mise exec -- pnpm lint
  - apps/api build dry-run（scripts/cf.sh deploy --dry-run 相当）
  - apps/web OpenNext build（pnpm --filter @ubm-hyogo/web build）
  - 採択ゲート評価 → 候補 A 確定 or 候補 B 切替

Phase 6: vitest 影響評価
  - esbuild 0.27.x で vitest が動くサンプル実行
  - 既存 spec の regression 検出

Phase 7: 統合テスト方針
  - CI に build-only ゲート追加余地の検討
  - 実 deploy を伴わない build 検証で再発防止できるか

Phase 8: ドキュメント更新
  - scripts/cf.sh コメントの override 値追従記述更新
  - CLAUDE.md「シークレット管理 / Cloudflare CLI 実行ルール」周辺で関連箇所があれば最小更新

Phase 9: 受入確認
  - AC-1〜AC-10 のチェック

Phase 10: ロールバック
  - override を 0.25.4 に戻す手順
  - wrangler ピン 4.85.0 維持手順

Phase 11: CI evidence
  - web-cd / deploy-staging と backend-ci / deploy-staging の Run URL 保管

Phase 12: 正本同期
  - strict 7 outputs

Phase 13: PR・振り返り
  - PR 本文テンプレ + commit メッセージ案
```

## CONST_005 適合確認

| 項目 | 本仕様書での記載先 |
| --- | --- |
| 変更対象ファイル | 本 Phase「変更対象ファイル一覧」 |
| 関数・モジュール構造 | 本 Phase「関数・モジュール構造」 |
| 入出力 | 本 Phase「入出力」 + Phase 4 |
| テスト方針 | Phase 6（unit 影響評価）+ Phase 7（統合）|
| ローカル実行コマンド | Phase 4 + Phase 5 |
| DoD | index.md AC-1〜AC-10 + Phase 9 |

## CONST_007 適合確認

- 本 PR 内で「override bump + lockfile 再生成 + ローカル検証 + CI 緑化観測」を完結させる。
- 代替案 B/C への切替は Phase 5 ゲート評価で同 PR 内に閉じる。
- 別 PR や将来タスクへの先送りなし。

## 実行タスク

- [ ] 変更対象ファイル一覧を確定
- [ ] Phase 4-13 の俯瞰図を成果物に転記
- [ ] CONST_005 / CONST_007 適合表を記載
- [ ] `outputs/phase-03/change-plan.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/change-plan.md | 変更対象ファイル一覧 / Phase 4-13 俯瞰 / CONST 適合確認 |

## 完了条件

- [ ] 変更対象ファイル一覧が表で記載されている
- [ ] Phase 4 以降の責務分担が明示されている

## 次 Phase

- 次: 4 (詳細実装手順)
- 引き継ぎ事項: 第一候補 A の override 値（`"0.27.3"` または Phase 2 で確定した最小値）
- ブロック条件: なし

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
