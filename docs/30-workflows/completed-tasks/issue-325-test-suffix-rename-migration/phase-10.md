# Phase 10 — デプロイ / rollback / PR commit 戦略

## 1. デプロイ概要

本タスクは **テストファイル名規約変更** であり、runtime 成果物（`apps/api` の Workers bundle）には一切影響しない。よって **Cloudflare Workers への deploy は不要**。影響範囲は CI/CD パイプラインの test 実行 step と pre-commit / pre-push hook の glob のみ。

| 項目 | 値 |
| --- | --- |
| Cloudflare Workers deploy | 不要（runtime 変更ゼロ） |
| D1 migration | 不要 |
| KV / R2 / Queue 変更 | 不要 |
| CI/CD パイプライン影響 | あり（test 実行 step の glob 同期） |
| lefthook 影響 | あり（pre-commit / pre-push の glob） |
| 想定 downtime | 0 秒（runtime 無影響） |

## 2. PR commit 戦略（3 commit / 1 PR）

`git mv` の意図と config 変更の意図を機械的に分離するため、1 PR を以下 3 commit で構成する。順序は固定。

### Commit 1: `refactor(api): rename *.test.ts to suffix-classified *.spec.ts (Refs #325)`

- 内容: `git mv` 132 件のみ
- diff filter: `git log -1 --diff-filter=R --summary HEAD` で 132 件すべてが rename (R) として現れ、Modified (M) / Added (A) / Deleted (D) が **0 件であること**
- `+`/`-` 行数: 0（rename のみ）
- レビュアーは次のコマンドで「内容変更ゼロ」を機械確認できる:
  ```bash
  git log -1 --diff-filter=R --summary <commit-1-sha> | wc -l   # 132
  git diff --stat <commit-1-sha>~..<commit-1-sha>               # +/- 0
  git diff <commit-1-sha>~..<commit-1-sha> -- '*.spec.ts' | wc -l  # 0
  ```

### Commit 2: `chore(test): sync test glob to *.spec.ts (Refs #325)`

- 内容: 以下ファイルの glob 同期のみ
  - `vitest.config.ts`（root）
  - `apps/api/vitest.config.ts`（存在時）
  - `apps/api/package.json`
  - `package.json`（root）
  - `lefthook.yml`
  - `.github/workflows/*.yml`（test 関連）
- rename ファイルは触らない（diff 0 維持）
- レビュアー確認: `git diff <commit-2-sha>~..<commit-2-sha> -- 'apps/api/src/**'` が空であること

### Commit 3: `docs(test): add test file suffix ADR (Refs #325)`

- 内容: `outputs/phase-12/test-file-suffix-adr.md` の追加 + Phase 12 系 evidence ファイル
- runtime / config に一切触らない

### 3 commit 分割の根拠

1. **rename と内容変更の機械分離**: Commit 1 が rename のみ（diff 0）であることを `git log --diff-filter=R --summary` で 1 行確認できる。混在 commit にすると「rename と本物の修正」を目視で分離する必要があり、レビュー負荷と誤検知リスクが跳ね上がる
2. **rollback 粒度の保全**: glob 同期だけ revert したい場合に Commit 2 のみ revert 可能
3. **bisect の意味保持**: 万一 rename 起因の breakage が後日発覚した場合、`git bisect` が「rename commit」を単独で指摘できる
4. **CI gate 整合**: 本 PR は 1 squash merge ではなく **merge commit 経由**で main に入れる前提（3 commit を保つ）

## 3. hook bypass 禁止

- `--no-verify` 使用禁止（CLAUDE.md 共通方針）
- 例外: sync-merge（main 取り込み）時の `staged-task-dir-guard` / `coverage-guard` 自動 skip は CLAUDE.md 既定どおり許容（本 PR は feature → dev の通常 merge なので該当しない）
- pre-commit で lint/typecheck が rename 後ファイルに対して走る。glob 同期 (Commit 2) より前に Commit 1 が積まれた状態で push が走らないよう、3 commit を **連続して積んでから 1 度だけ push** する

## 4. rollback 戦略

| シナリオ | 対応 |
| --- | --- |
| merge 後に CI が落ちた | `git revert -m 1 <merge-sha>` 1 コマンドで全 3 commit を一括 revert（merge commit 経由で取り込むため）|
| Commit 2 (glob) だけ問題 | `git revert <commit-2-sha>` で glob のみ戻す（rename は維持される） |
| Commit 1 (rename) だけ問題 | 原則発生しないが、発生時は `git revert <commit-1-sha>` で逆 rename。test 件数 assert は再走査して同一性を確認 |
| 並行 PR との rename 衝突 | 本 PR を最後に merge する（branch protection の up-to-date 要件で sync 後 merge）|

revert 後の検証コマンド:
```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l   # 132
```

## 5. CI gate（既存 workflow への接続確認）

| gate | 結果期待値 | 備考 |
| --- | --- | --- |
| typecheck | exit 0 | rename は型に影響しないため当然 green |
| lint | exit 0 | 同上 |
| `apps/api` test | exit 0 / test 件数 = rename 前 | reporter 出力を Phase 11 evidence に保存 |
| verify-design-tokens | 無関係（pass） | 本 PR は CSS / token に触らない |
| verify-indexes | 無関係（pass） | skill indexes を変更しない |
| coverage-guard (pre-push) | pass | rename のため coverage 数値に変化なし |

> 新規 workflow は追加しない。既存 `ci.yml` / `backend-ci.yml` / `pr-build-test.yml` の test 実行が rename 後 `*.spec.ts` を拾うことを Phase 11 で確認する。テスト常時実行可能性 DoD の CI gate 化は「既存 CI に接続されていること」で満たす。

## 6. リスクと緩和

| リスク | 緩和策 |
| --- | --- |
| 並行 PR との rename 衝突 | 本 PR を最後に merge / branch protection の up-to-date 要件で main 同期後 merge |
| CI 環境キャッシュによる旧 glob の温存 | vitest はディスクキャッシュを CI で保持しないため不要。lefthook も毎回 install 経由で更新 |
| `lefthook.yml` の glob 取りこぼしで pre-commit が静かに skip | Phase 11 で `glob-coverage-grep.log` を取得し、`*.test.ts` 残存参照が config 側に 0 件であることを assert |
| GitHub Actions の matrix job で旧 glob が残存 | `.github/workflows/*.yml` 全件 grep を Phase 11 evidence に記録 |
| rename 後 import path が壊れる | rename は **ファイル名** のみで、test file は他から import されないため影響しない（vitest が自身で discovery する）|

## 7. 完了条件チェック

- [ ] 1 PR が 3 commit 構成（rename / config / ADR）で push されている
- [ ] Commit 1 が `git log -1 --diff-filter=R --summary` で 132 件 rename のみ
- [ ] Commit 2 が `apps/api/src/**` を 1 件も触っていない
- [ ] `--no-verify` 未使用
- [ ] runtime deploy 不要であることを PR 本文に明記
- [ ] rollback 手順が PR 本文に記載されている
