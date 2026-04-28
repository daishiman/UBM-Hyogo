# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 (最終レビュー) |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | completed |
| visualEvidence | **NON_VISUAL** |
| taskType | docs + CI |

> **NON_VISUAL 宣言**: 本タスクは `.github/workflows/verify-indexes.yml` という CI gate の追加であり、
> UI 変更を伴わない。**screenshot は作成しない**。`outputs/phase-11/screenshots/` ディレクトリも作らない。
> 証跡は GitHub Actions の job log（テキスト）と CLI 実行ログ（テキスト）のみで完結させる。

## 目的

本 Phase は NON_VISUAL の CI gate であり、画面スクリーンショットは不要。`.github/workflows/verify-indexes.yml` は静的検証とローカル diff 検証で確認する。
Phase 5 で設計した CI gate を文書ウォークスルーし、本実装で実行する **3 シナリオの smoke 設計** が
AC-1〜AC-7を過不足なく覆うことを確認する。

## smoke 評価軸（Visual を除く 3 層）

NON_VISUAL のため Visual 層は評価対象外。下記 3 層のみ評価する。

| 層 | 観点 | 評価方法 |
| --- | --- | --- |
| Semantic | gate の意味 | drift があれば fail / なければ PASS が成立しているか |
| Operational | 運用容易性 | fail 時に「どのファイルが drift したか」が job log で即座に判明するか |
| Risk | 既存 CI への副作用 | 既存 ci.yml / backend-ci.yml / web-cd.yml / validate-build.yml と並走しても衝突・遅延しないか |

## smoke シナリオ（3 件）

### S-1: クリーン状態 PASS 確認（drift なし）

```bash
# 1. main 同期済みの feature branch 上で workflow を手動起動
gh workflow run verify-indexes.yml --ref feat/wt-5

# 2. 直近 run を確認
gh run list --workflow=verify-indexes.yml --limit 1

# 3. 成功ログを取得
gh run view --log <RUN_ID>
```

- 期待:
  - `verify-indexes-up-to-date` job が `success` で終了
  - 最終ステップ `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` が exit 0
  - 所要時間が既存 ci.yml と同等オーダ（Node 24 setup + pnpm install + indexes:rebuild が支配項）
- 証跡 placeholder: 本実装で `outputs/phase-11/manual-smoke-log.md` の S-1 セクションに `gh run view --log` の関連行を貼付

### S-2: 意図的 drift fail 確認

```bash
# 1. drift を作る（indexes 配下を 1 ファイル手動編集）
echo "// intentional drift for smoke" >> .claude/skills/aiworkflow-requirements/indexes/<対象ファイル>

# 2. drift を含むコミット・push（feature branch 上）
git add .claude/skills/aiworkflow-requirements/indexes/
git commit -m "chore(smoke): intentional drift to verify CI fail (S-2)"
git push

# 3. PR trigger / push trigger により verify-indexes が起動
gh run list --workflow=verify-indexes.yml --limit 1
gh run view --log <RUN_ID>
```

- 期待:
  - job が `failure` で終了
  - log に `git diff --name-only` の出力で **drift したファイル名が明示**される
  - 終了コードが非 0（典型的に exit 1）
- 証跡 placeholder: `outputs/phase-11/manual-smoke-log.md` S-2 セクションに fail log 抜粋
- **AC-2 を実機で証明する核となるシナリオ**

### S-3: 戻して PASS 確認（False Positive 防止）

```bash
# 1. S-2 のコミットを revert する
git revert --no-edit HEAD
git push

# 2. または `pnpm indexes:rebuild` で正規再生成して push
mise exec -- pnpm indexes:rebuild
git add .claude/skills/aiworkflow-requirements/indexes/
git commit -m "chore(smoke): revert drift, regenerated indexes (S-3)"
git push

# 3. 再 run
gh run list --workflow=verify-indexes.yml --limit 1
gh run view --log <RUN_ID>
```

- 期待:
  - job が `success` に戻る
  - 同一 workflow が同一入力に対し決定論的に PASS する（false positive ゼロ）
- 証跡 placeholder: `outputs/phase-11/manual-smoke-log.md` S-3 セクションに success log 抜粋

## manual evidence placeholder（テキストのみ）

| Placeholder | 想定内容 | 取得コマンド |
| --- | --- | --- |
| `gh-workflow-run.txt` 相当 | `gh workflow run` 実行成功 | `gh workflow run verify-indexes.yml --ref <BRANCH>` |
| `gh-run-list.txt` 相当 | 直近 run の status / conclusion | `gh run list --workflow=verify-indexes.yml --limit 5` |
| `gh-run-view-log-pass.txt` 相当 | S-1 / S-3 の success log（git diff exit 0） | `gh run view --log <RUN_ID_SUCCESS>` |
| `gh-run-view-log-fail.txt` 相当 | S-2 の failure log（git diff exit 1 + 差分ファイル名） | `gh run view --log <RUN_ID_FAIL>` |

> 上記は全て `outputs/phase-11/manual-smoke-log.md` 内に抜粋として埋め込む。**個別ファイル化はしない**（screenshots/ を作らないのと同方針で、生成物を最小化）。

## 統合テスト連携（既存 CI との並走確認）

S-1 の run と同タイミングで、以下既存 workflow が並走しても影響しないことを確認する。

| 既存 workflow | 確認観点 |
| --- | --- |
| ci.yml | 同一 PR で並走、verify-indexes の fail/success が ci.yml の judgement に影響しない（独立 job） |
| backend-ci.yml | 並走、Node / pnpm セットアップが衝突しない |
| web-cd.yml | trigger 条件（push to main）で並走するが job 名衝突なし |
| validate-build.yml | 並走、`actions/setup-node@v4` のキャッシュが互いに破壊しない |

→ `outputs/phase-11/manual-smoke-log.md` の「並走確認」表に `gh run list --limit 10` の出力で確認する。

## 実行タスク

1. S-1（クリーン PASS）の実行手順と期待ログを文書ウォークスルーする
2. S-2（意図的 drift fail）の実行手順と差分ファイル名ログ要件を文書ウォークスルーする
3. S-3（戻し PASS）の実行手順と false positive 防止観点を文書ウォークスルーする
4. 既存 CI との並走確認観点を `gh run list` 証跡として本実装へ引き継ぐ
5. `outputs/phase-11/link-checklist.md` に Phase 7 AC-1〜AC-7 と各 S シナリオの紐付けを記載
6. `outputs/phase-11/main.md` に総括（PASS / FAIL 件数・運用上の所感・GO 判定）を記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-05.md (実装ランブック) | workflow yml の最終形 |
| 必須 | phase-07.md (AC matrix) | smoke 結果と AC のトレース |
| 必須 | phase-10.md outputs/phase-10/main.md | GO 判定（前提） |
| 必須 | .github/workflows/verify-indexes.yml | 実装本体（同一ブランチ で作成） |
| 参考 | .github/workflows/ci.yml | 既存 setup（Node 24 / pnpm 10.33.2）の流用元 |
| 参考 | CLAUDE.md ブランチ戦略 | feature/* → dev → main |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| docs + CI | — | smoke は CI gate の挙動確認のみ。app コード / D1 に触れない |
| 副作用 | #5 | apps/web → D1 直アクセス禁止に影響しない（CI gate のため） |
| 既存 CI への影響 | — | ci.yml / backend-ci.yml / web-cd.yml / validate-build.yml と job 名衝突なし |
| 決定論性 | — | 同一入力で常に同一結果（S-1 と S-3 の二度の PASS で確認） |
| 運用性 | — | fail 時に差分ファイル名が log で即座に確認できる（AC-2） |
| secret hygiene | — | smoke ログに API token / OAuth token が含まれない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-1 クリーン PASS | 11 | completed | gh run view log 取得 |
| 2 | S-2 意図的 drift fail | 11 | completed | 差分ファイル名出力確認 |
| 3 | S-3 戻し PASS | 11 | completed | false positive ゼロ確認 |
| 4 | 既存 CI 並走確認 | 11 | completed | gh run list で確認 |
| 5 | link-checklist 作成 | 11 | completed | AC × シナリオ |
| 6 | main.md 総括 | 11 | completed | GO 判定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 総括 + GO 判定 |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | S-1〜S-3 ログ抜粋 + 並走確認 |
| ドキュメント | outputs/phase-11/link-checklist.md | AC-1〜AC-7 × S-1〜S-3 紐付け |

> **作らない**: `outputs/phase-11/screenshots/`、`outputs/phase-11/evidence/` 等の追加サブディレクトリ
> （NON_VISUAL のため）

## 完了条件

- [ ] S-1 / S-2 / S-3 の実行設計が期待通り（PASS / FAIL / PASS）で、本実装へ引き継げる
- [ ] AC-1〜AC-7 が manual-smoke-log の文書ウォークスルーで裏付けられる
- [ ] 既存 CI との並走確認観点が link-checklist に明記されている
- [ ] outputs/phase-11/ 配下に main.md / manual-smoke-log.md / link-checklist.md の **3 ファイルのみ** 配置

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-11/ 配下が 3 ファイルのみ（screenshots/ ディレクトリが作られていない）
- [ ] artifacts.json の Phase 11 を completed に更新

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ事項: smoke ログ抜粋（implementation-guide の Part 2 に再利用）
- ブロック条件: いずれかの S シナリオが期待外なら Phase 5 / 9 に戻る
