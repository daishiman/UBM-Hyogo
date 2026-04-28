# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 |
| 下流 | Phase 5 |
| 状態 | completed |

## 目的

Phase 3 で採用した「独立 workflow file」案に対し、`verify-indexes-up-to-date` が
**真に authoritative gate として機能する** ことを保証する verify suite を確定する。
特に AC-1〜AC-7 のうち、AC-1 / AC-2 / AC-3 / AC-7 を verify 可能なテストケースに分解する。

## verify suite 全体像

| レイヤ | 種別 | 目的 | 主要コマンド |
| --- | --- | --- | --- |
| L1 | ローカル smoke | indexes:rebuild が決定論的に動くこと | `mise exec -- pnpm indexes:rebuild` |
| L2 | ローカル dry-run | 連続 2 回実行で diff が生じないこと（false positive 排除） | `pnpm indexes:rebuild && git add -N .claude/skills/aiworkflow-requirements/indexes && git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` |
| L3 | drift 検出 (positive) | 意図的に index を壊した状態で fail すること | `git checkout HEAD~1 -- .claude/skills/aiworkflow-requirements/indexes && act` |
| L4 | drift なし PASS (negative) | 何も変えない PR で PASS すること | `act -j verify-indexes-up-to-date` |
| L5 | fail ログ確認 | fail 時に差分ファイル名がログに出ること | act 実行ログ grep |
| L6 | CI 実機 | GitHub Actions 上での挙動 | PR を draft で 1 本立てて確認 |

## テストケース表

| TC | 対応 AC | 入力 | 期待出力 | 期待 exit |
| --- | --- | --- | --- | --- |
| TC-01 | AC-3 / AC-7 | クリーン状態で `pnpm indexes:rebuild` 実行 | `git add -N` 後の `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` が変化なし | exit 0 |
| TC-02 | AC-3 | TC-01 直後に再度 `pnpm indexes:rebuild` を実行 | 出力が完全一致（mtime 含めず） | exit 0 |
| TC-03 | AC-2 | references を意図的に編集後 indexes 未再生成のまま push | job fail + 差分ファイル名出力 | exit 1 |
| TC-04 | AC-2 | indexes/foo.json を手で 1 行編集 | job fail + `git diff --name-only` に該当 file | exit 1 |
| TC-05 | AC-1 | PR を作成 | workflow が auto trigger | run started |
| TC-06 | AC-1 | main へ push | workflow が auto trigger | run started |
| TC-07 | AC-7 | references/ を編集し indexes は正しく再生成して commit | PASS（誤検出なし） | exit 0 |
| TC-08 | AC-5 | 同一 PR で ci.yml も走らせる | 両 workflow が独立完走 | 両 exit 0 |

## 検証コマンド一覧

```bash
# L1: ローカル smoke
mise exec -- pnpm install
mise exec -- pnpm indexes:rebuild

# L2: 決定論性確認（連続 2 回）
mise exec -- pnpm indexes:rebuild
git status --short -- .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm indexes:rebuild
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes

# L3: drift 検出 simulation
echo " " >> .claude/skills/aiworkflow-requirements/indexes/<対象>.json
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes  # exit 1 を期待
git checkout -- .claude/skills/aiworkflow-requirements/indexes

# L4: act によるローカル simulation
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml

# L5: 失敗ログ確認
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml 2>&1 | grep "::error::index drift"
```

## 認可境界テスト

| 観点 | 設計 | 検証 |
| --- | --- | --- |
| GITHUB_TOKEN 権限 | `permissions: { contents: read }` のみで足りる | workflow 上で `GITHUB_TOKEN` を参照しないことを yaml lint で確認 |
| Cloudflare 認証 | 不使用 | secrets.CLOUDFLARE_* を参照しないことを grep で確認 |
| 1Password 認証 | 不使用 | `op run` 呼び出しがないことを grep で確認 |
| write 権限 | 不要（commit / push しない） | `permissions: write-all` を絶対に書かない |

→ 本 gate は **read-only**。書き込み権限が必要になった時点で設計違反とみなす。

## expected result マトリクス

| 状態 | git diff 結果 | exit code | ログ出力 |
| --- | --- | --- | --- |
| drift なし | 空 | 0 | "index drift" 文言なし |
| drift あり | 1 ファイル以上 | 1 | `::error::index drift detected` + `git diff --name-only` + `git status --short` |
| script 自体が異常終了 | 不定 | 1 (rebuild step で fail) | step 名 "Rebuild indexes" で fail |
| lockfile drift | install step で fail | 1 | step 名 "Install dependencies" で fail |

## false positive 排除戦略

1. `generate-index.js` の出力に **mtime / 実行時刻 / 絶対パス** が含まれないことを Phase 6 で確認
2. ファイル列挙順序が OS / FS 依存にならないことを確認（`fs.readdirSync` を sort してから出力する想定）
3. JSON の indent / trailing newline が一貫していることを確認
4. 連続 2 回実行で diff が出ないこと（TC-02）

## 実行タスク

1. テストケース表（TC-01〜TC-08）を `outputs/phase-04/main.md` に記載
2. 検証コマンド一覧を実行可能な形で記載
3. 認可境界テストの観点表を記載
4. expected result マトリクスを記載
5. false positive 排除戦略を Phase 6 へ申し送り

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs | workflow YAML 仕様 |
| 必須 | Phase 3 outputs | 採用根拠 / MINOR 申し送り |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | 決定論性確認 |
| 参考 | .github/workflows/ci.yml | act での共存確認 |
| 参考 | https://github.com/nektos/act | ローカル simulation tool |

## 実行手順

1. 上記 L1〜L6 の順で smoke を実行（実装は本タスク）
2. TC-01〜TC-08 の期待結果と一致することを記録
3. fail ケース（TC-03/TC-04）の stderr スニペットを Phase 6 evidence として保存
4. PASS で Phase 5 へ

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | TC ベースで runbook の sanity check を構成 |
| Phase 6 | false positive 原因（mtime / 順序）の検証 |
| Phase 7 | TC ↔ AC のマッピング表 |
| Phase 11 | 実機 PR で TC-05/TC-06/TC-08 を再実行 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 不変条件 | #1〜#7 | 触れない |
| secrets | — | テストでも secrets を要求しない |
| 無料枠 | — | Actions 無料枠で完結 |
| 決定論性 | — | TC-02 が必須 |
| 認可境界 | — | contents:read のみ |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | TC 表 (8 件) 作成 | completed | AC-1〜AC-7 と紐付け |
| 2 | 検証コマンド一覧 | completed | L1〜L5 |
| 3 | 認可境界テスト観点 | completed | read-only 確認 |
| 4 | expected result マトリクス | completed | 4 状態 × 4 列 |
| 5 | false positive 排除戦略 | completed | Phase 6 申し送り |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-04/main.md | TC 表 + コマンド + 認可境界 + expected matrix |

## 完了条件

- [ ] TC-01〜TC-08 が AC-1〜AC-7 を全カバー
- [ ] 検証コマンドがコピペ実行可能
- [ ] 認可境界が read-only に限定
- [ ] expected result の 4 状態が定義
- [ ] false positive 排除戦略が Phase 6 に渡る

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-04/main.md 配置済み
- [ ] artifacts.json の Phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ事項: TC 表 + 検証コマンド + 認可境界（read-only）
- ブロック条件: TC が AC をフルカバーしなければ Phase 4 やり直し
