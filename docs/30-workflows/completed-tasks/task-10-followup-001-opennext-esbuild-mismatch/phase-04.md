# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 4 |
| 状態 | spec_created |

## 目的

build toolchain 修正の前後で回帰がないことを確認するためのテスト範囲を定義する。

## テストカテゴリ

### A. ビルド検証（必須）

| ID | コマンド | 期待 |
| --- | --- | --- |
| BUILD-1 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`Host version "..." does not match binary version "..."` が出ない |
| BUILD-2 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0（`next build --webpack`） |
| BUILD-3 | `mise exec -- pnpm --filter @ubm-hyogo/api build` (存在する場合) | exit 0 |

### B. esbuild バージョン整合（必須）

| ID | コマンド | 期待 |
| --- | --- | --- |
| EB-1 | `mise exec -- pnpm why esbuild` | OpenNext host と platform binary の mismatch pair が 0 件（単一 version が最優先、scope override 採用時は根拠を `main.md` に明記） |
| EB-2 | `find node_modules -path "*/@esbuild/darwin-arm64/package.json" -exec grep version {} \;` | すべて `"version": "0.25.4"` |
| EB-3 | `find node_modules -name esbuild -type d -maxdepth 5` で見つかる各パッケージの version 確認 | すべて 0.25.4 |

### C. 既存品質ゲート回帰（必須）

| ID | コマンド | 期待 |
| --- | --- | --- |
| QG-1 | `mise exec -- pnpm typecheck` | green |
| QG-2 | `mise exec -- pnpm lint` | green |
| QG-3 | `mise exec -- pnpm test` | green（既存 vitest pass 範囲を維持） |

### D. tsx 経由スクリプト smoke（必須・Phase 3 懸念対応）

| ID | コマンド | 期待 |
| --- | --- | --- |
| TSX-1 | `mise exec -- pnpm skill:logs:render` | exit 0 |
| TSX-2 | `mise exec -- pnpm postmortem:generate --help` 相当の dry-run | エラーなし |

### E. wrangler 経路回帰（必須）

| ID | コマンド | 期待 |
| --- | --- | --- |
| WR-1 | `bash -n scripts/cf.sh` | shell syntax OK |
| WR-2 | `bash scripts/cf.sh --version` | wrapper 経由で wrangler version を表示（認証不要） |

### F. dev サーバ smoke（推奨）

| ID | コマンド | 期待 |
| --- | --- | --- |
| DEV-1 | `mise exec -- pnpm dev:web`（10 秒起動して終了） | listening port を吐く |

## 自動テスト追加の要否

- 本タスクは package.json / lockfile / 1 shell スクリプトのみの変更で、新規 unit test の追加は不要
- `find` ベースの EB-2 / EB-3 を Phase 11 evidence script として残すことを推奨

## CI 反映方針

- `verify-indexes-up-to-date` は Phase 12 の aiworkflow index sync 後に対象となる。`indexes:rebuild` 実行ログを Phase 11 または Phase 12 compliance に残す
- 新規 CI gate は追加しない（toolchain 一回限りの修正のため）
- 将来再発時に検出する gate を作る場合は別タスクで検討

## エビデンス取得項目

Phase 11 で次のログを取得し `outputs/phase-11/evidence/` に保管:

- `build-cloudflare.log`（BUILD-1 の生出力）
- `pnpm-why-esbuild.log`（EB-1）
- `esbuild-versions.log`（EB-2 + EB-3 の集計）
- `typecheck.log`、`lint.log`、`test.log`
- `tsx-smoke.log`
- `wrangler-version.log`

## 完了条件

- [ ] 検証カテゴリ A-E が必須、F が推奨として明記されている
- [ ] 各テストにコマンドと期待結果が記載されている
- [ ] エビデンス取得項目が一覧化されている

## 成果物

- `outputs/phase-04/main.md`

## 実行タスク

- BUILD / EB / QG / TSX / WR の各検証カテゴリを Phase 11 evidence に配線する
- `scripts/cf.sh` wrapper 経由の read-only smoke を採用し、direct wrangler 実行を避ける
- index regeneration の検証ログを Phase 12 compliance へ渡す

## 統合テスト連携

NON_VISUAL タスクのため、統合検証は `build:cloudflare` PASS、依存解決 scan、typecheck / lint / test、tsx / wrapper smoke のログで代替する。

## 参照資料

- Phase 2 設計4「テスト戦略の概要」
- Phase 3 残懸念
