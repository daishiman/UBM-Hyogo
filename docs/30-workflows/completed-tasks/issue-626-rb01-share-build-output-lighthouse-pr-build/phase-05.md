# Phase 5: YAML 改修実装


## 目的

Issue #626 RB-01 の Phase 5 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 5 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実装ステップ

1. `actions/upload-artifact@v4` / `actions/download-artifact@v4` の SHA pin を Phase 3 で確定した値で固定する（既存 workflow で同 action を pinning している箇所があれば同値再利用）。
2. `.github/workflows/pr-build-test.yml` の `build-test` job に `Upload Next.js build output` step を追加する。位置: 標準 `Build` step の直後、`Build (Cloudflare standalone)` より前。`build:cloudflare` は OpenNext 用に標準 build を再実行するため、Lighthouse が消費する `.next` はこの位置で固定する。
3. `.github/workflows/pr-build-test.yml` の `jobs:` レベルに `lighthouse-ci` job を追加する（Phase 04 §「`lighthouse-ci` job 新規」のテンプレートを採用）。
4. `pr-build-test.yml` トップに `concurrency:` block を追加する:
   ```yaml
   concurrency:
     group: pr-build-test-${{ github.ref }}
     cancel-in-progress: true
   ```
5. `.github/workflows/lighthouse.yml` を `git rm` で削除する。
6. `docs/30-workflows/e2e-quality-uplift/backlog.md` の RB-01 行を更新:
   - `Status` column: `open` → `implemented-local-runtime-pending`
   - `Notes` column: `Integrated locally into pr-build-test.yml lighthouse-ci job sharing the next-build-* artifact (Refs #626). PR dry-run / merge-time runtime evidence and Phase 13 close-out remain user-gated.`

## 編集差分の絶対不変条件

- 既存 `build-test` job の `name: build-test` を変更しない
- 新規 `lighthouse-ci` job の `name: lighthouse-ci` を厳密に維持する
- `permissions: {}` の workflow デフォルトを維持する
- `secrets:` を job env に追加しない
- `persist-credentials: false` を checkout step から外さない
- `mise exec --` 経由の Node / pnpm 実行を踏襲する

## 実装手順の禁止事項

- `actions/cache` を主経路として導入しない（best-effort のため）
- `workflow_run` トリガを使わない
- `lighthouse.yml` を残したまま `lighthouse-ci` job を `pr-build-test.yml` にも追加しない（必ず削除と統合をセットで行う）
- 既存 `build-test` の `build` step / `build:cloudflare` step を削除しない

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 5 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 4 (`phase-04.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-05.md`
- Phase 5 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] 編集差分が `git diff --stat .github/workflows/` で `pr-build-test.yml`（変更） / `lighthouse.yml`（削除）の 2 ファイルになる
- `git diff docs/30-workflows/e2e-quality-uplift/backlog.md` に RB-01 行の更新が含まれる
