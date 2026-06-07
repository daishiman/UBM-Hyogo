# Phase 13 — PR作成（user 明示承認後のみ）

**[実装区分: 実装仕様書 / implementation_mode: new]**

> **PR 作成は user の明示承認後のみ実施する（CONST_002）。** 本仕様書は手順定義であり、自動実行しない。
> 本タスクは issue #1089 の新規実装仕様書（`implementation_mode: new`）であり、主成果物は
> docs（Phase 1〜12 の仕様書一式）。apps コードの実装が同 PR に含まれる場合も、commit / push / PR /
> Secrets 投入 / deploy / runtime screenshot はすべて user-gated である。

---

## 1. 絶対原則

- **base ブランチ = `dev`**（`gh pr create --base dev`）。production リリース時のみ `--base main`（CLAUDE.md PR 既定）。
- 作業ブランチ = `docs/issue-1089-backfill-impact-preview-spec`（差分の主題に沿った `docs/` ブランチを自律作成）。
- commit / push / PR 作成 / Secrets 投入（`SYNC_ADMIN_TOKEN`）/ staging・production deploy /
  authenticated runtime screenshot は **すべて user-gated**（CONST_002）。
- **issue #1089 は CLOSED のままゆえ、PR 本文に `Closes #1089` を付けない**（既に closed のため PR で close しない）。
  関連 issue として `#1089` を参照リンクで記載するに留める。
- `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として準拠する。

---

## 2. PR に含まれる差分の性質（事前確認）

| 区分 | 内容 |
|------|------|
| docs（主成果物） | `docs/30-workflows/issue-1089-backfill-impact-preview/` 配下の `index.md` / `phase-1..13.md` / `outputs/**` / `artifacts.json` |
| apps コード差分 | 実装サイクルを同 PR で行う場合のみ含む（phase-1.md §5 の 8 ファイル）。spec のみの PR ならゼロ |
| skill 同期 | Phase 12 で更新した LOGS.md ×2 / topic-map / index 再生成物 |

> `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得し、意図しない差分（メイン repo への混入など）が
> 無いことを確認する。

---

## 3. 実行順序（user 承認後）

1. 現在ブランチと変更状況を確認する。`dev` 直上またはブランチ未作成なら `docs/issue-1089-backfill-impact-preview-spec` を自律作成。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチに戻り `git merge dev`。コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い
   自律解消（docs は意味結合 + 重複行除去 / skill ログ系は `pnpm sync:resolve`）。
4. 品質検証（pre-flight・4 コマンド）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`（docs-only gate の pre-flight。`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証）
   - 実装を同 PR に含む場合は追加で回帰: `mise exec -- pnpm vitest run apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（backend contract は D1 必須環境で別途）
5. 検証失敗時は最大 3 回まで自動修復しコミット。
6. `git status --porcelain` で未コミット差分を確認し `git add -A` で全件コミット。
7. `git diff dev...HEAD --name-only` で PR ファイル一覧を確定（漏れなし確認）。
8. `.claude/commands/ai/diff-to-pr.md` + `outputs/phase-12/implementation-guide.md` を参照して PR 本文を作成し
   `gh pr create --base dev` で作成。

---

## 4. PR 本文の構成（必須反映）

| セクション | 内容 |
|-----------|------|
| 変更概要 | 全件 backfill 承認前の影響件数プレビュー（dry-run）の追加。`previewResponseSync` + route `?dryRun=true` 分岐 + staged UI（preview ボタン / 件数表示 / `canBackfill` gate / confirm 文言への実数埋め込み） |
| AC 対応 | AC-1（承認前件数表示）/ AC-2（backend 実数・UI 推定でない）/ AC-3（`SyncResultSchema`・`?fullSync` 契約不退行）/ AC-4（confirm cancel で不実行）/ AC-5（TC-B1..B8 維持・TC-B2 staged 化 + TC-B9..B12） |
| テスト結果 | `outputs/phase-12/implementation-guide.md` の Part1 / Part2 / 視覚証跡 を反映。主証跡 = 自動テスト（パネル TC-B1..B12 / preview schema / backend contract）全 pass |
| スクリーンショット | `outputs/phase-11/` に実 png が存在する場合のみ参照を含める。runtime screenshot は admin 認証必須で user-gated・pending のため、**png が無い場合はスクリーンショット専用セクションを作らない**。代替として「VISUAL だが runtime screenshot user-gated」を明記 |
| 不変条件遵守 | `SyncResultSchema` / `?fullSync` 不変（AC-3）/ preview read-only（D1 write ゼロ・lock/ledger 非変更）/ D1 直接アクセス禁止 / mutation は `useAdminMutation` 経由 / OKLch トークンのみ / PII 非露出 / `SYNC_ADMIN_TOKEN` user-gated |

> 本文冒頭に「issue #1089 は CLOSED のため `Closes #1089` を付けない（参照リンクのみ）」を明記する。

---

## 5. PR 作成前チェック

- `git status --porcelain` が空であること。
- `git diff dev...HEAD --name-only` が取得済みで意図しない差分（メイン repo 混入など）が無いこと。
- `implementation-guide.md` の主要見出し（Part1 / Part2 / 視覚証跡）が PR 本文へ反映されていること。
- `outputs/phase-11/` の画像数と PR 本文の画像参照が整合していること（png 0 件 → 画像セクションなし）。
- PR 本文に `Closes #1089` が含まれていないこと（#1089 は CLOSED 維持）。

---

## 6. 最終レポート（PR 作成完了後・1 回のみ）

PR URL / 採用ブランチ（base=dev）/ 実行した自動修復 / 解消したコンフリクト / 残課題（runtime screenshot ・
`SYNC_ADMIN_TOKEN` 投入 / staging deploy が user-gated で pending である旨）を 1 回だけ報告する。

---

## 完了条件

- [x] PR 作成が user 明示承認後のみであること（CONST_002）を最上部に明記した
- [x] base=dev / production 時のみ main、作業ブランチ `docs/issue-1089-backfill-impact-preview-spec` を明記した
- [x] commit / push / PR / Secrets 投入 / deploy / screenshot がすべて user-gated であることを明記した
- [x] issue #1089 が CLOSED のため `Closes #1089` を付けない（参照リンクのみ）旨を明記した
- [x] pre-flight（`pnpm install --force` / typecheck / lint / `verify-pr-ready.sh`）を実行順序に定義した
- [x] PR 本文構成（変更概要 / AC 対応 / テスト結果 / スクリーンショット条件付き / 不変条件遵守）を定義した
- [x] PR 作成前チェックと最終レポート項目を定義した
