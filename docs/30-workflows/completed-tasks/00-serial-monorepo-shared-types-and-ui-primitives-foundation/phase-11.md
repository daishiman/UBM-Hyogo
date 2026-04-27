# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 11 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 10 (最終レビュー) |
| 下流 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

Phase 5 の runbook に沿って手動 smoke を行い、screenshot / curl / wrangler 出力 evidence を outputs/phase-11/ に保存する。Wave 0 は UI 完成度が低いため、smoke 対象は「scaffold 起動」「healthz」「primitive Storybook の代替（Vitest snapshot）」に限定する。

## 実行タスク

1. manual smoke 手順を Phase 5 runbook から抽出
2. 各手順で取得する evidence を確定（curl 出力、wrangler dev ログ、スクリーンショット placeholder）
3. evidence を outputs/phase-11/ に保存する path を確定
4. outputs/phase-11/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | smoke 手順 |
| 必須 | outputs/phase-04/test-matrix.md | 検証項目 |

## 実行手順

### ステップ 1: smoke 手順抽出（5 手順）
1. `pnpm install` 成功 evidence
2. `pnpm -w typecheck` 成功 evidence
3. `pnpm --filter @ubm/api dev` 起動 → `curl /healthz` evidence
4. `pnpm --filter @ubm/web dev` 起動 → トップページ 200 evidence
5. `pnpm -w test` 成功 evidence

### ステップ 2: evidence path 確定

### ステップ 3: outputs/phase-11/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | implementation-guide.md に evidence path を追記 |
| Phase 13 | PR description に evidence link を貼る |

## 多角的チェック観点（不変条件参照）

- **#1**: typecheck evidence で型 4 層 export 確認
- **#5**: lint evidence で ESLint rule 動作確認
- **#6**: primitive snapshot で localStorage 不使用確認
- **#8**: Avatar snapshot で決定論性確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | smoke 手順抽出 | 11 | pending | 5 手順 |
| 2 | evidence path 確定 | 11 | pending | outputs/phase-11/ |
| 3 | placeholder 用意 | 11 | pending | 各手順 |
| 4 | outputs 作成 | 11 | pending | outputs/phase-11/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリー |
| evidence | outputs/phase-11/install.log | `pnpm install` ログ placeholder |
| evidence | outputs/phase-11/typecheck.log | typecheck ログ |
| evidence | outputs/phase-11/healthz.curl | curl 出力 |
| evidence | outputs/phase-11/web-dev.log | next dev 起動ログ |
| evidence | outputs/phase-11/test.log | vitest ログ |
| evidence | outputs/phase-11/screenshots/ | UI primitives スクリーンショット placeholder |
| メタ | artifacts.json | Phase 11 を completed |

## 完了条件

- [ ] 5 手順すべての evidence が outputs/phase-11/ に placeholder で配置（実装後に実 file を上書き）
- [ ] 各 evidence ファイルの取得 command が明記
- [ ] screenshot は実装フェーズで取得することを明示

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-11/main.md 配置済み
- [ ] evidence placeholder 6 種すべて path 明記
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ事項: evidence path → implementation-guide.md
- ブロック条件: evidence placeholder 未確定

## Manual Evidence

### 1. `pnpm install` 成功

```bash
$ pnpm install
# placeholder: 期待出力
# Lockfile is up to date, resolution step is skipped
# Done in X.Xs
```

evidence: `outputs/phase-11/install.log`

### 2. `pnpm -w typecheck` 成功

```bash
$ pnpm -w typecheck
# 期待: 4 package 全て exit 0
```

evidence: `outputs/phase-11/typecheck.log`

### 3. `GET /healthz` 200

```bash
$ pnpm --filter @ubm/api dev &
$ curl -i http://localhost:8787/healthz
# 期待:
# HTTP/1.1 200 OK
# Content-Type: application/json
#
# {"ok":true}
```

evidence: `outputs/phase-11/healthz.curl`

### 4. `next dev` 起動

```bash
$ pnpm --filter @ubm/web dev
# 期待: ▲ Next.js X.X.X
#       - Local:        http://localhost:3000
$ curl -I http://localhost:3000
# 期待: HTTP/1.1 200
```

evidence: `outputs/phase-11/web-dev.log`

### 5. `pnpm -w test` 成功

```bash
$ pnpm -w test
# 期待: 全 spec PASS
```

evidence: `outputs/phase-11/test.log`

### 6. UI primitives スクリーンショット（実装後）

- `outputs/phase-11/screenshots/chip.png`
- `outputs/phase-11/screenshots/avatar.png`
- ... (15 種)

実装フェーズで Storybook 等で取得。spec phase では path 確保のみ。

## wrangler 出力 placeholder

```bash
$ wrangler --version
# 期待: ⛅️ wrangler X.X.X
$ wrangler dev --local
# 期待: ⎔ Starting local server...
```

evidence: `outputs/phase-11/wrangler.log`
