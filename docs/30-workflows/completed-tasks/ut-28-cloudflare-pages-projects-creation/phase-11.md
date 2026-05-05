# Phase 11: 手動 smoke test（dev push → staging green / main push → production green / `pages project list` 確認 — NON_VISUAL / 仕様レベル固定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（dev push → staging deploy green / main push → production deploy green / `pages project list` 確認 / Git 連携 OFF 確認 / OpenNext 整合性確認） |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending（workflow root は `spec_created`。本 Phase は walkthrough 仕様を固定するが、実 smoke は Phase 13 承認後まで未完了） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |
| user_approval_required | false（Phase 13 の実 `wrangler pages project create` + 実 push 承認とは独立。本 Phase は仕様レベル固定のみ） |
| GitHub Issue | #48 |

## VISUAL / NON_VISUAL 判定（冒頭固定文言）

> **本タスクは UI / Renderer / 画面遷移を一切伴わない NON_VISUAL タスクである。**
> **したがって Phase 11 のスクリーンショットは不要であり、`outputs/phase-11/screenshots/` ディレクトリは `.gitkeep` 含めて一切作成しない。**

- **mode: NON_VISUAL**
- **taskType: implementation（Cloudflare Pages プロジェクト作成 / `bash scripts/cf.sh pages project create` 経由）**
- 判定理由:
  - 本ワークフローは Cloudflare Pages API（`bash scripts/cf.sh pages project create` / `bash scripts/cf.sh pages project list`）への PUT/GET 操作と、その結果として `web-cd.yml` の `deploy-staging` / `deploy-production` が green 化することを確認するものであり、本 PR 側の UI 描画は一切発生しない。Cloudflare Dashboard の補助確認はあるが、それは UT-28 PR の差分ではなく外部サービス UI である。
  - 実 `wrangler pages project create` 実行 / 実 dev push smoke / 実 main push smoke は **Phase 13 ユーザー承認後** の別オペレーションで実行する。本 Phase 11 では「コマンド系列の仕様レベル固定 + spec walkthrough」までを成果物とする。
  - Pages プロジェクト作成タスクの性質上、本 PR 側で描画される画面は存在しない。証跡の主ソースは `bash scripts/cf.sh pages project list` のマスク済み出力 / `gh run view <id>` の URL / push commit SHA / 公開 URL（`https://<project>.pages.dev` の HTTP 200 応答）に集約する。秘匿 ID（Account ID 等）はマスクする。

## 必須 outputs（spec_created Phase 11 / NON_VISUAL 代替証跡 4 点 + index）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の適用結果と「実地操作不可 / Phase 13 ユーザー承認後実走」を冒頭明記 |
| `outputs/phase-11/manual-smoke-log.md` | 5 ステップ smoke（前提確認 → `pages project list` 確認 → dev push smoke → main push smoke → Git 連携 OFF / OpenNext 整合性確認）を **NOT EXECUTED** ステータスで列挙 |
| `outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言と代替証跡の出所明示（証跡の主ソース = `pages project list` マスク出力 / `gh run view <id>` URL / push commit SHA / 公開 URL HTTP 応答 / スクリーンショットを作らない理由 = Pages 作成タスクで本 PR 側描画なし） |
| `outputs/phase-11/link-checklist.md` | 仕様書間の参照リンク健全性チェック（index.md / phase-NN.md / outputs / 親仕様 / `.github/workflows/web-cd.yml` / `apps/web/wrangler.toml` / `apps/web/open-next.config.ts` / `apps/api/wrangler.toml` / `scripts/cf.sh`） |

> `outputs/phase-11/screenshots/` は**作成しない**（NON_VISUAL）。

## 目的

Phase 1〜10 で固定された設計（lane 1〜5 / Pages プロジェクト 2 件 / 命名規則「`<base>` / `<base>-staging`」/ `production_branch` 環境別配線（main / dev）/ `compatibility_date = 2025-01-01` / `compatibility_flags = ["nodejs_compat"]` / Git 連携 OFF 既定 / OpenNext アップロード判定 (A)/(B) / `bash scripts/cf.sh` 経由コマンド草案 / 動作確認手順 5 件 / 4 条件 + 5 観点 PASS / 上流 2 件 NO-GO ゲート 3 重明記）に対し、NON_VISUAL 代替 evidence プレイブックを適用して spec walkthrough を実施し、以下を確定する。

1. 仕様書の自己完結性（前提・AC-1〜AC-15・成果物パス）が満たされている
2. 5 ステップ smoke（**前提確認 → `bash scripts/cf.sh pages project list` で 2 件存在確認 → `git commit --allow-empty && git push origin dev` → `gh run watch` で `web-cd.yml` deploy-staging green → main push 経由 deploy-production green / Git 連携 OFF / OpenNext 整合性**）のコマンド系列が Phase 2 §動作確認手順の固定通りに `manual-smoke-log.md` で再現可能な形に展開されている
3. 全リンク（index.md ↔ phase-NN.md ↔ outputs ↔ 親仕様 ↔ `.github/workflows/web-cd.yml` ↔ `apps/web/wrangler.toml` ↔ `apps/web/open-next.config.ts` ↔ `apps/api/wrangler.toml` ↔ `scripts/cf.sh`）が健全である
4. NON_VISUAL の限界（Cloudflare API の eventual consistency / `pages project list` の値マスク粒度 / Pages 公開 URL の 1st-deploy 反映遅延 / OpenNext 切替が必要かの判定が runtime smoke でしか確定できない / Pages Dashboard 手動編集による drift 再現性不足）を明示し、保証できない範囲を Phase 12 `unassigned-task-detection.md` 候補として記録する

依存成果物として Phase 2 設計（lane 1〜5 / 設定一致表 / OpenNext 判定 / `bash scripts/cf.sh` コマンド草案 / 動作確認手順 5 件）、Phase 3 レビュー（NO-GO ゲート / 9 観点 PASS / open question 6 件）、Phase 10 最終レビューを入力する。本 Phase 11 は実走ではなく walkthrough と手順仕様固定に限定する。

## 実行タスク

1. NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）を `outputs/phase-11/main.md` に作成する（完了条件: 4 階層が漏れなく記述）。
2. 5 ステップ smoke のコマンド系列を `outputs/phase-11/manual-smoke-log.md` に **NOT EXECUTED** ステータスで列挙する（完了条件: Phase 2 §動作確認手順 5 件のコマンド系列が網羅 + 期待結果 + 担当者）。
3. NON_VISUAL 宣言と代替証跡の出所（`pages project list` マスク出力 / `gh run view` URL / push commit SHA / 公開 URL HTTP 応答）、スクリーンショット非作成理由を `manual-test-result.md` に明示する。
4. spec walkthrough を実施し、phase-01〜phase-13 / index.md / artifacts.json / outputs/* / 親仕様 / `.github/workflows/web-cd.yml` / `apps/web/wrangler.toml` / `apps/web/open-next.config.ts` / `apps/api/wrangler.toml` / `scripts/cf.sh` 間の参照リンクを `outputs/phase-11/link-checklist.md` に記録する（完了条件: 全リンクが OK / Broken で表記）。
5. 「実地操作不可 / Phase 13 ユーザー承認後実走」を `main.md` 冒頭に明記する。
6. 保証できない範囲（Cloudflare API eventual consistency / `pages project list` の値マスク粒度 / 1st-deploy 反映遅延 / OpenNext 切替判定が runtime でしか確定できない / Dashboard 手動編集による drift 再現実験不可）を Phase 12 申し送り候補として最低 3 項目列挙する。

## NON_VISUAL 代替 evidence の 4 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 型** | `bash scripts/cf.sh pages project create <name> --production-branch=<branch> --compatibility-flags=nodejs_compat --compatibility-date=2025-01-01` のコマンド構文と引数型（プロジェクト名 = kebab-case、`--production-branch` の値域 = `main` / `dev`、`--compatibility-date` = ISO date、`--compatibility-flags` = カンマ区切り flag 名）を仕様レベルで検証 | コマンド型整合（CLI 引数名 / 値域 / 必須引数の有無） | 実 PUT 応答の意味的整合（401 / 409 名前衝突 / 422 引数不正 判定） |
| **L2: lint / boundary** | 「production = `<base>` / staging = `<base>-staging`」「`production_branch` 環境別配線（production=main / staging=dev）」「Pages Git 連携 OFF 既定」「`compatibility_date` Workers 同期（`2025-01-01`）」の 4 boundary を設計レベルで検証。`<base>-staging` を Variable に置く誤りや `production_branch` 逆配線を赤として明示 | 命名衝突 / preview 扱い事故 / Workers 同期ずれ / 二重 deploy事故 の境界 | 実走時の人為ミス（誤プロジェクト名指定 / 既存同名衝突）— `apply-runbook.md` で別途緩和 |
| **L3: in-memory test** | 5 ステップ smoke（前提確認 → `pages project list` 確認 → dev push smoke → main push smoke → Git 連携 OFF / OpenNext 整合性）の **コマンド系列を仕様レベルで固定**（`manual-smoke-log.md` に NOT EXECUTED で列挙） | 「再現する手順」の網羅性 | Cloudflare API eventual consistency / `pages project list` 反映遅延 / OpenNext 整合性は runtime smoke でしか確定不可 |
| **L4: 意図的 violation snippet** | (a) `<base>-staging` を Variable に置く赤ケース（`web-cd.yml` の suffix 連結で `<base>-staging-staging` になり 8000017）、(b) production プロジェクトの `production_branch` を `dev` にする赤ケース（preview 扱いでカスタムドメイン未反映）、(c) `compatibility_date` を `2024-09-01` にする赤ケース（Workers と乖離して `process` / `node:*` の片側不可用）、(d) Pages Git 連携 ON で push したケース（GHA と二重 deploy で古い commit 採用レース）を spec walkthrough で red 確認 | 「赤がちゃんと赤になる」(命名 / branch / 互換性 / 二重 deploy 検出) | （L4 自体は green 保証ではない） |

## 5 ステップ smoke コマンド系列（NOT EXECUTED）

> 本 Phase では実走しない。Phase 13 ユーザー明示承認後に別オペレーションで走らせる前提。
> ここで列挙するのはコマンドの「仕様レベル固定」のみであり、実行ログ・実 Cloudflare API 応答・実 CD run URL・実公開 URL HTTP 応答は本 Phase では取得しない。

```bash
# === STEP 0: 前提確認（NOT EXECUTED）===
# 上流 2 件（01b / UT-05）completed か（重複明記の最終地点）
gh pr list --search "01b parallel cloudflare base bootstrap" --state merged
gh pr list --search "UT-05" --state merged
op item get "Cloudflare" --vault UBM-Hyogo > /dev/null   # 01b の API Token / Account ID 存在確認
bash scripts/cf.sh whoami                                 # API Token 認証 + 最小スコープ確認

# `web-cd.yml` の参照キーが Phase 2 §命名規則と整合しているか
grep -nE "vars.CLOUDFLARE_PAGES_PROJECT|pages deploy" .github/workflows/web-cd.yml

# === STEP 1: `pages project list` で 2 件存在確認（NOT EXECUTED — Phase 13 ユーザー承認後）===
bash scripts/cf.sh pages project list
# 期待結果:
#   - `ubm-hyogo-web`           production_branch=main / compatibility_date=2025-01-01 / flags=nodejs_compat
#   - `ubm-hyogo-web-staging`   production_branch=dev  / compatibility_date=2025-01-01 / flags=nodejs_compat
#   - Git 連携: 未接続（OFF）
# Account ID / Project ID 等の秘匿値は verification-log.md / manual-smoke-log.md に転記しない

# === STEP 2: dev push smoke（NOT EXECUTED）===
git switch dev
git pull --ff-only origin dev
git commit --allow-empty -m "chore(cd): trigger staging deploy smoke [UT-28]"
git push origin dev
# 期待結果: dev branch に commit SHA が記録され、`web-cd.yml` deploy-staging job がトリガーされる

gh run list --branch dev --limit 5
gh run watch                                              # web-cd.yml deploy-staging job を watch
# 期待結果:
#   - `web-cd.yml` deploy-staging job が green
#   - Cloudflare Pages → `ubm-hyogo-web-staging` Deployments に staging deploy が記録
#   - `https://ubm-hyogo-web-staging.pages.dev` が HTTP 200 を返す（Auth は別タスク）

# job ログから命名 / 8000017 (Project not found) / `_worker.js` 不在を確認
gh run view <run-id> --log | rg -nE "8000017|Project not found|_worker\.js|404|500" || echo "deploy 系エラーなし"

# === STEP 3: main push smoke（NOT EXECUTED）===
# 通常運用では dev → main の PR 経由。直接 main push は branch protection で拒否される想定
gh pr create --base main --head dev --title "chore(cd): trigger production deploy smoke [UT-28]"
# PR マージ後
gh run watch                                              # web-cd.yml deploy-production job を watch
# 期待結果:
#   - `web-cd.yml` deploy-production job が green
#   - Cloudflare Pages → `ubm-hyogo-web` Deployments に production deploy が記録
#   - `https://ubm-hyogo-web.pages.dev` が HTTP 200 を返す

# === STEP 4: Pages Git 連携 OFF 確認（NOT EXECUTED — 苦戦箇所 §5 / R-5）===
# Cloudflare Dashboard → Pages → 各プロジェクト → Settings → Builds & deployments
#   "Connect to Git" が OFF（または未接続）であることを目視
#   ON になっている場合は OFF に切り替え、Phase 12 unassigned-task-detection に
#   「Dashboard 手動編集による drift」の運用ドキュメント追記候補として登録

# === STEP 5: OpenNext アップロード整合性確認（NOT EXECUTED — 苦戦箇所 §1 / R-1）===
# STEP 2 の deploy 結果から:
curl -sSI https://ubm-hyogo-web-staging.pages.dev/ | head -1   # 200 OK
# トップページ / 任意 SSR ルートで `_worker.js` 不在エラー / 500 / 404 が出ないか軽く確認
# red の場合は判定 (B) に該当 → Phase 12 で UT-05 にフィードバック登録
#   （`apps/web/wrangler.toml` の `pages_build_output_dir` と `web-cd.yml` の
#     `pages deploy .next` を `.open-next/assets` に切り替える PR を別途）
```

> **担当者**: solo 運用のため実行者本人。`bash scripts/cf.sh pages project delete <name>` + 再 create による即時復旧経路を `outputs/phase-13/apply-runbook.md` に明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | lane 5 動作確認 / `bash scripts/cf.sh` コマンド草案 / OpenNext 判定基準の正本 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-03.md | NO-GO 条件 / 9 観点 PASS / R-1〜R-8 / open question 6 件 |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | 親仕様（苦戦箇所 §1〜§5） |
| 必須 | .github/workflows/web-cd.yml | プロジェクト名参照キー / suffix 連結仕様確認 |
| 必須 | apps/web/wrangler.toml | `name` / `pages_build_output_dir` / `compatibility_date` / `compatibility_flags` 整合確認 |
| 必須 | apps/web/open-next.config.ts | OpenNext 採用時のビルド出力構造（`.open-next/`） |
| 必須 | apps/api/wrangler.toml | Workers 側 `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` 同期源 |
| 必須 | scripts/cf.sh | `wrangler` ラッパーの正規経路（CLAUDE.md / AC-14） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL / spec_created Phase 11 必須 outputs フォーマット |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | L1〜L4 プレイブックの正本 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI 実行ルール / ブランチ戦略） | 1Password 正本 / `scripts/cf.sh` 経由 / dev → main 戦略 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-11.md | NON_VISUAL Phase 11 構造リファレンス |

## 実行手順

1. NON_VISUAL 代替 evidence の 4 階層を `outputs/phase-11/main.md` へ記録する。
2. 5 ステップ smoke のコマンド系列を `manual-smoke-log.md` に NOT EXECUTED として記録する。
3. `manual-test-result.md` に NON_VISUAL 宣言・代替証跡の主ソース・スクリーンショット非作成理由を明示する。
4. `link-checklist.md` で index.md / phase-NN.md / outputs / 親仕様 / `.github/workflows/web-cd.yml` / `apps/web/wrangler.toml` / `apps/web/open-next.config.ts` / `apps/api/wrangler.toml` / `scripts/cf.sh` の参照リンクを確認する。
5. 「Phase 13 ユーザー承認後に実走」を `main.md` 冒頭で明記する。

## 統合テスト連携

本 Phase は spec walkthrough のため smoke を実走しない。Phase 13 ユーザー明示承認後に同じコマンド系列を実走し、`outputs/phase-13/verification-log.md` / `apply-runbook.md` を確定させる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| walkthrough | outputs/phase-11/main.md | NON_VISUAL 代替 evidence の記録（L1〜L4）+ 「実地操作不可」明記 |
| smoke log | outputs/phase-11/manual-smoke-log.md | 5 ステップ smoke の NOT EXECUTED コマンド系列 |
| 代替証跡宣言 | outputs/phase-11/manual-test-result.md | NON_VISUAL 宣言 / 証跡主ソース / スクリーンショット非作成理由 |
| link check | outputs/phase-11/link-checklist.md | 仕様書間リンク確認 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `manual-test-result.md` / `link-checklist.md` の 4 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）が `main.md` に記載
- [ ] 5 ステップ smoke（前提確認 / `pages project list` / dev push / main push / Git 連携 OFF + OpenNext 整合性）のコマンド系列が `manual-smoke-log.md` に NOT EXECUTED ステータスで網羅
- [ ] `manual-test-result.md` に「証跡の主ソース = `pages project list` マスク出力 / `gh run view <id>` URL / push commit SHA / 公開 URL HTTP 応答」と「スクリーンショットを作らない理由 = Pages 作成タスクで本 PR 側描画なし」が明記
- [ ] spec walkthrough のリンク健全性が `link-checklist.md` に OK/Broken で記録
- [ ] 「実地操作不可 / Phase 13 ユーザー承認後実走」が `main.md` 冒頭で明記
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙
- [ ] 上流 2 件（01b / UT-05）完了前提が NO-GO 条件として再掲（4 重明記の 4 箇所目）
- [ ] `wrangler` 直接実行が混入していない（全コマンドが `bash scripts/cf.sh` 経由）

## 検証コマンド

```bash
# 必須 4 ファイルの存在
ls docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/
# main.md / manual-smoke-log.md / manual-test-result.md / link-checklist.md の 4 件

# screenshots/ が存在しないこと
test ! -d docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/screenshots && echo OK

# NOT EXECUTED が manual-smoke-log.md に明記されていること
rg -n "NOT EXECUTED" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/manual-smoke-log.md

# 5 ステップ smoke の各ステップが記述されているか
rg -n "STEP [0-5]" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/manual-smoke-log.md

# wrangler 直接実行混入なし確認
rg -nE "^\s*wrangler\s" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/ \
  && echo "NG: wrangler 直接実行混入" || echo "OK: scripts/cf.sh 経由のみ"

# API Token / Account ID 値転記なし確認
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|CLOUDFLARE_ACCOUNT_ID=[a-f0-9]{32}" \
  docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/ \
  || echo "Secret 値転記なし"
```

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は spec walkthrough。`manual-smoke-log.md` には必ず `NOT EXECUTED` ステータスを残す。実 `wrangler pages project create` / 実 push は Phase 13 ユーザー承認後。
3. **`<base>-staging` を Variable に置くケースを赤として明示**: `web-cd.yml` の `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` 連結で suffix が二重になり 8000017。L4 で意図的 violation として記録する。
4. **`production_branch` 逆配線を赤として明示**: production プロジェクトに `dev` を、staging プロジェクトに `main` を指定するとそれぞれ preview 扱いになる。L4 で必ず明示。
5. **`compatibility_date` Workers 同期ずれを赤として明示**: `apps/api/wrangler.toml` の `2025-01-01` と乖離した値で Pages を作成すると `process` / `node:*` の可用性が片側だけ変わり挙動分岐。L4 で `2024-09-01` 等の意図的不整合をケース化。
6. **Pages Git 連携 ON を赤として明示**: GHA と二重 deploy で古い commit を採用するレースが発生。STEP 4 で OFF を必ず確認、ON 残存なら Phase 12 unassigned-task-detection に Dashboard 手動編集 drift の運用ルール化候補として登録。
7. **OpenNext 切替判定の re-run 不要性**: 切替判定は dev push smoke の runtime 結果で確定する。本 Phase では「判定基準」までを固定し、結果は Phase 13 verification-log に記録する。
8. **値転記禁止**: API Token / Account ID / Project ID 等の秘匿値はコマンド例にも実値を書かず、`op://...` / 環境変数参照のみ記述する。公開 URL（`https://ubm-hyogo-web-staging.pages.dev` 等）は記録可。
9. **`wrangler` 直接実行禁止**: 全コマンドが `bash scripts/cf.sh ...` 経由。CLAUDE.md / AC-14 違反は spec walkthrough 段階で検出する。
10. **上流 2 件完了 NO-GO の 4 重明記**: Phase 1 / 2 / 3 に加え、本 Phase 11 でも `manual-smoke-log.md` STEP 0 に再掲する。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - L3/L4 で発見した「保証できない範囲」を `unassigned-task-detection.md` の current 区分へ転記
  - 5 ステップ smoke のコマンド系列を `implementation-guide.md` Part 2 に再掲
  - `link-checklist.md` の Broken 項目があれば Phase 12 で同 sprint 修正
  - OpenNext 切替が runtime smoke で red になった場合の UT-05 へのフィードバック条件を `unassigned-task-detection.md` に登録
  - Pages Dashboard 手動編集 drift の運用ルール化候補を `unassigned-task-detection.md` に登録
- ブロック条件:
  - `screenshots/` ディレクトリが誤って作成されている
  - `manual-smoke-log.md` が「実走済」と誤記している
  - `link-checklist.md` が空（spec walkthrough 未実施）
  - 5 ステップのいずれかが欠落
  - `wrangler` 直接実行混入
  - API Token / Account ID / Project ID 値が outputs に転記されている
