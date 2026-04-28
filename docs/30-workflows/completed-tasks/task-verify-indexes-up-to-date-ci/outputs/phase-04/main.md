# Phase 4 — テスト戦略 / verify suite 確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 4 / 13 |
| 状態 | completed |
| 上流 | Phase 3（独立 workflow file 採用） |
| 下流 | Phase 5（実装ランブック） |

## 結論サマリ

`verify-indexes-up-to-date` は CI gate（authoritative）であり、ユニットテストは設けず
**ジョブログを assert する E2E（実 GitHub Actions 起動）+ 手動 dry-run（act / ローカル）**
の 2 経路で AC-1〜AC-7 を検証する。verify suite は L1〜L6 の 6 レイヤで構成し、
TC-01〜TC-08 の 8 ケースで AC-1 / AC-2 / AC-3 / AC-5 / AC-7 を網羅する。

## verify suite 全体像（L1〜L6）

| レイヤ | 種別 | 目的 | 主要コマンド |
| --- | --- | --- | --- |
| L1 | ローカル smoke | `pnpm indexes:rebuild` が決定論的に動く | `mise exec -- pnpm indexes:rebuild` |
| L2 | ローカル dry-run | 連続 2 回実行で diff が出ない（false positive 排除） | `pnpm indexes:rebuild` × 2 → `git diff --exit-code -- <indexes>` |
| L3 | drift 検出 (positive) | indexes を意図的に壊した状態で fail | `echo " " >> <index>.json && git diff --exit-code -- <indexes>` |
| L4 | act dry-run (negative) | 何も変えない PR で PASS | `act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml` |
| L5 | fail ログ assert | fail 時に `::error::index drift detected` + 差分ファイル名 | act 実行ログ grep |
| L6 | CI 実機 | GitHub Actions 上で TC-05 / TC-06 / TC-08 を確認 | draft PR を 1 本立てる |

## テストケース表（AC トレース付き）

| TC | 対応 AC | 入力 | 期待出力 | exit |
| --- | --- | --- | --- | --- |
| TC-01 | AC-3 / AC-7 | クリーン状態で `pnpm indexes:rebuild` 実行 | `git add -N` 後の `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` が変化なし | 0 |
| TC-02 | AC-3 | TC-01 直後に再度 `pnpm indexes:rebuild` を実行 | 出力が完全一致（mtime 含めず） | 0 |
| TC-03 | AC-2 | references を意図的に編集後 indexes 未再生成のまま push | job fail + 差分ファイル名出力 | 1 |
| TC-04 | AC-2 | indexes/<対象>.json を手で 1 行編集 | job fail + `git diff --name-only` に該当 file | 1 |
| TC-05 | AC-1 | PR を作成 | workflow が auto trigger | run started |
| TC-06 | AC-1 | main / dev へ push | workflow が auto trigger | run started |
| TC-07 | AC-7 | references/ を編集し indexes は正しく再生成して commit | PASS（誤検出なし） | 0 |
| TC-08 | AC-5 | 同一 PR で ci.yml も走らせる | 両 workflow が独立完走 | 両 0 |

> AC-4（lefthook.yml に index 再生成を戻していない）と AC-6（Node 24 / pnpm 10.33.2）は
> 静的検査（ファイル grep / yaml の `node-version` / `version` 値の目視）で担保するため
> TC は不要。Phase 7 AC マトリクスで明示する。

## 検証コマンド一覧（コピペ実行可能）

```bash
# L1: ローカル smoke
mise exec -- pnpm install
mise exec -- pnpm indexes:rebuild

# L2: 決定論性確認（連続 2 回）
mise exec -- pnpm indexes:rebuild
git status --short -- .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm indexes:rebuild
git add -N .claude/skills/aiworkflow-requirements/indexes
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes && echo "OK: deterministic"

# L3: drift 検出 simulation（exit 1 を期待）
echo " " >> .claude/skills/aiworkflow-requirements/indexes/<対象>.json
git add -N .claude/skills/aiworkflow-requirements/indexes
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes
git checkout -- .claude/skills/aiworkflow-requirements/indexes

# L4: act によるローカル simulation
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml

# L5: 失敗ログ assert
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml 2>&1 \
  | grep -F "::error::index drift detected"
```

## 認可境界テスト（read-only 強制）

| 観点 | 設計 | 検証 |
| --- | --- | --- |
| GITHUB_TOKEN 権限 | `permissions: { contents: read }` のみ | yaml lint で `permissions:` 行を grep |
| Cloudflare 認証 | 不使用 | `grep -r "secrets.CLOUDFLARE" .github/workflows/verify-indexes.yml` で 0 件 |
| 1Password 認証 | 不使用 | `grep -r "op run\|op://" .github/workflows/verify-indexes.yml` で 0 件 |
| write 権限 | 不要（commit / push しない） | `grep "permissions: write-all" verify-indexes.yml` で 0 件 |

> 本 gate は **read-only**。書き込み権限が必要になった時点で設計違反とみなし Phase 5 に戻す。

## expected result マトリクス

| 状態 | git diff 結果 | exit | ログ出力 |
| --- | --- | --- | --- |
| drift なし | 空 | 0 | "index drift" 文言なし |
| drift あり | 1 ファイル以上 | 1 | `::error::index drift detected` + `git diff --name-only` + `git status --short` |
| script 自体が異常終了 | 不定 | 1（rebuild step で fail） | step "Rebuild indexes" で fail（drift メッセージは出ない） |
| lockfile drift | install step で fail | 1 | step "Install dependencies" で `ERR_PNPM_OUTDATED_LOCKFILE` |

## false positive 排除戦略（Phase 6 への申し送り）

1. `generate-index.js` の出力に **mtime / 実行時刻 / 絶対パス** が含まれないことを Phase 6 F-05 で確認
2. ファイル列挙順序が OS / FS 依存にならない（`fs.readdirSync` を sort してから出力する想定）— Phase 6 F-06
3. JSON の indent / trailing newline が一貫している
4. 連続 2 回実行で diff が出ない（TC-02）

## 実行タスク（completed）

- [x] TC-01〜TC-08 を AC とマッピング（AC-1 / AC-2 / AC-3 / AC-5 / AC-7 をフルカバー）
- [x] L1〜L5 検証コマンドをコピペ可能形式で記載
- [x] 認可境界テスト（read-only）の観点表を記載
- [x] expected result マトリクス（4 状態）を記載
- [x] false positive 排除戦略を Phase 6 へ申し送り

## 完了条件

- [x] TC-01〜TC-08 が AC-1〜AC-7（AC-4 / AC-6 は静的検査）を全カバー
- [x] 検証コマンドがコピペ実行可能
- [x] 認可境界が read-only に限定
- [x] expected result の 4 状態が定義
- [x] false positive 排除戦略が Phase 6 に渡る

## 次 Phase

Phase 5（実装ランブック）に TC 表 + 検証コマンド + read-only 認可境界を引き継ぐ。
