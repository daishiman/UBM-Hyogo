# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（命名衝突 / `production_branch` 取り違え / OpenNext `_worker.js` 不在 / `compatibility_date` Workers drift / Git 連携 ON 復活 / Variable 値ミスマッチ / `web-cd.yml` アップロード先（`.next` vs `.open-next`）方針確定とフィードバック判定） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending（仕様化のみ完了 / 実走は Phase 11 / 13） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

Phase 4 の T1〜T7（happy path）に加えて、**fail path / 回帰 guard** を T8〜T13 として固定する。本 Phase は「命名衝突 (R-7) / `production_branch` 取り違え (R-2) / OpenNext `_worker.js` 不在 (R-1) / `compatibility_date` Workers drift (R-3) / Pages Git 連携 ON 復活 (R-5) / Variable 値ミスマッチ (R-4) + `web-cd.yml` の Pages プロジェクト名整合確認とアップロード先 `.next` vs `.open-next` の方針確定」の 6 観点を仕様レベルで網羅する。実走は Phase 11 smoke / Phase 13 ユーザー承認後配置に委譲する。

加えて本 Phase は **`web-cd.yml` の Pages プロジェクト名整合確認** と **アップロード先（`.next` vs `.open-next`）方針確定** を実施し、必要に応じて UT-05 への workflow 修正フィードバックを Phase 12 unassigned-task-detection.md に登録する経路を含める。

## 依存タスク順序（上流 2 件完了必須）

上流 2 件（01b / UT-05）完了は Phase 5 Step 0 ゲートで担保済み。本 Phase は Step 0 をパスした前提で fail path を扱う。OpenNext 切替 (R-1) / `web-cd.yml` のアップロード先設計が UT-05 に未組込の場合、T10 / T13 で実検出 → Phase 12 unassigned で UT-05 にフィードバック起票する経路を含める。

## 実行タスク

- タスク1: T8〜T13 の 6 件（命名衝突 / `production_branch` 取り違え / `compatibility_date` drift / Git 連携 ON 復活 / Variable 値ミスマッチ / `web-cd.yml` アップロード先方針確定）を定義する。
- タスク2: 各 T のシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応を表化する。
- タスク3: 実走を Phase 11 / 13 に委譲する範囲を明記する。
- タスク4: rollback 経路（`bash scripts/cf.sh pages project delete` 後 再 create / Variable 値の UT-27 同期更新）を T8 / T9 / T11 / T12 に含める。
- タスク5: `web-cd.yml` のアップロード先 `.next` vs `.open-next` 方針確定（T13）を実施し、判定 (B) 時の UT-05 フィードバック条件を明文化する。

## エラー逆引き

| 症状 / code | 最有力原因 | 初動 |
| --- | --- | --- |
| 401 / 403 | Token 不足・失効 | 01b / 1Password / token scope を再確認 |
| 409 | Pages project 名衝突 | `pages project list` のマスク出力で既存名確認、命名再検討 |
| 8000017 | `web-cd.yml` の project-name と Cloudflare project 名不一致 | UT-27 Variable と suffix 連結を照合 |
| `_worker.js` 不在 / runtime 500 | OpenNext output-form 不整合 | UT-05 に `.open-next` 形式または Pages 形式例外をフィードバック |
| 二重 deploy | Pages Git 連携 ON | Git 連携 OFF に戻し、verification-log に drift と対応を記録 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-04.md | T1〜T7 happy path |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-05.md | 6 ステップランブック / 3 コミット粒度 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | リスク R-1〜R-5 / 設定一致表 / state ownership |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-03.md | リスク R-6〜R-8 補強 / open question #1 |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md §苦戦箇所・知見 | リスク源 |
| 必須 | .github/workflows/web-cd.yml | Pages プロジェクト名整合確認 / アップロード先（`.next` vs `.open-next`）の突合 |
| 必須 | apps/web/wrangler.toml / apps/web/open-next.config.ts | OpenNext 整合性の静的判定 |

## 実行手順

1. Phase 4 の happy path と Phase 5 の実装ランブックを確認する。
2. T8〜T13 をシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応に分解する。
3. T13 で `web-cd.yml` のアップロード先方針を確定し、判定 (B) なら Phase 12 で UT-05 にフィードバック登録経路を起票する。
4. Phase 7 の AC マトリクス入力として引き渡す。

## 統合テスト連携

T8〜T13 は実 `bash scripts/cf.sh pages project create` / `bash scripts/cf.sh pages project delete` / `git push origin dev` / `git push origin main` を伴うため、**Phase 13 ユーザー承認後** の Phase 11 smoke で実走する。本 Phase は fail path 仕様の正本化のみ。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T8〜T13 のテスト一覧 / 期待値 / 観測手順 / `web-cd.yml` 整合確認結果 / アップロード先方針確定 |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 異常系テスト一覧

### T8: プロジェクト命名衝突事故（既存アカウントに同名 / R-7）

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | 命名規則「`<base>` / `<base>-staging`」の維持 / Variable `CLOUDFLARE_PAGES_PROJECT` 値 (`ubm-hyogo-web`) との同期 |
| シナリオ | 既存 Cloudflare アカウントに `ubm-hyogo-web` または `ubm-hyogo-web-staging` と同名のプロジェクトが既に存在 → `bash scripts/cf.sh pages project create` が 409 系で失敗。あるいは過去の試作プロジェクトが残っており設定不整合のまま deploy が走る |
| 検証コマンド | (1) `bash scripts/cf.sh pages project list | jq -r '.[].name' | sort > /tmp/cf-projects.txt` / (2) `rg "^ubm-hyogo-web$" /tmp/cf-projects.txt` / (3) `rg "^ubm-hyogo-web-staging$" /tmp/cf-projects.txt` で create 前に同名がないことを確認 |
| 期待値 | create 前: 同名なし。create 後: 期待した 2 件のみ存在 |
| Red 状態 | create 前に既存プロジェクトあり / create が 409 / 試作プロジェクトが `production_branch` 取り違え状態で残存 |
| 対応 | (a) 試作プロジェクトを `bash scripts/cf.sh pages project delete <name>` で削除 → 再 create / (b) 命名再検討 → UT-27 Variable `CLOUDFLARE_PAGES_PROJECT` 値の同期更新フィードバック / (c) 既存プロジェクトが正しい設定なら delete をスキップして設定確認のみ。**rollback** = `pages project delete` で削除して `pages project create` で再作成 |

### T9: `production_branch` 取り違え事故（main / dev 逆配線 or 未指定 / R-2 / 苦戦箇所 §2）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | 環境別配線（production=main / staging=dev）の維持 |
| シナリオ A（逆配線）| production プロジェクトに `--production-branch=dev` / staging プロジェクトに `--production-branch=main` を渡してしまう |
| シナリオ B（未指定）| `--production-branch=` を省略 → 既定 `main` で staging も作成され、dev push が preview alias `<commit>.<project>.pages.dev` 化 / カスタムドメイン未反映 / production スコープ環境変数が反映されない |
| 検証コマンド | (1) `bash scripts/cf.sh pages project list | jq -r '[.[] | {name, production_branch}] | sort_by(.name)'` / (2) `production_branch` が production=`main` / staging=`dev` であること / (3) Phase 5 Step 5.3 / 5.4 deploy 後に `bash scripts/cf.sh pages deployment list --project-name=...` で `environment=production` 表示 / `<commit>.<project>.pages.dev` ではなく `https://<project>.pages.dev` が公開 URL |
| 期待値 | production=`main` / staging=`dev` の正配線 / deploy が production scope 扱い / 公開 URL が preview alias でない |
| Red 状態 | 逆配線 / 未指定既定 `main` / preview alias 化で公開 URL が機能しない |
| 対応 | `bash scripts/cf.sh pages project delete <name>` → `--production-branch=` 明示で再 create。Phase 5 Step 3 / Step 4 で必須引数として固定済みなので発生時は Step 漏れの兆候 |

### T10: OpenNext `_worker.js` 不在事故（R-1 / 苦戦箇所 §1 / open question #1）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | OpenNext 採用環境のアップロード対象整合（`.next` 継続 vs `.open-next/...` 切替） |
| シナリオ | `apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` と `web-cd.yml` の `pages deploy .next` で deploy が走るが、OpenNext 標準出力 `.open-next/assets/` + `_worker.js` 構造と不整合で `_worker.js` 不在 → SSR / API ルートが 500 / 404 / Functions タブ空 |
| 検証コマンド | (1) Phase 5 Step 5.5 で `curl -sS -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.pages.dev/api/<任意 SSR ルート>` が 5xx / 404 / (2) Cloudflare Dashboard → Pages → 最新 deploy → Functions タブで `_worker.js` 不在を目視 / (3) `apps/web/open-next.config.ts` が `.open-next/...` 出力を生成する設定であることを `grep -E "defineCloudflareConfig" apps/web/open-next.config.ts` で確認 |
| 期待値 | 静的判定 (A): 3 ファイル整合 / 動作判定: SSR 200 / Functions タブに `_worker.js` 登録 |
| Red 状態 | 判定 (B) 確定 / SSR 5xx / Functions タブ空 / OpenNext build 出力と deploy アップロード対象の乖離 |
| 対応 | 本タスクではプロジェクト作成のみ実施し、`apps/web/wrangler.toml` の `pages_build_output_dir` と `web-cd.yml` の `pages deploy .next` を `.open-next/assets` 系に切り替える PR を **UT-05 にフィードバック**。Phase 12 unassigned-task-detection.md に「UT-05: web-cd.yml の Pages アップロード先を `.open-next/assets` 系に切替」として登録（T13 と連動） |

### T11: `compatibility_date` / `compatibility_flags` Workers drift（R-3 / 苦戦箇所 §3）

| 項目 | 内容 |
| --- | --- |
| ID | T11 |
| 観点 | Workers 正本（`apps/api/wrangler.toml`）と Pages 派生コピーの同期維持 |
| シナリオ A（Pages 側のみ古い）| Workers 側を将来 `2025-06-01` 等に更新したが Pages 側 `2025-01-01` のまま → 共有 util の `process` / `node:*` 可用性が片側だけ異なり挙動分岐 |
| シナリオ B（Pages 側のみ更新）| Pages 側のみ Dashboard で書き換え → Workers との挙動乖離 / drift |
| シナリオ C（`nodejs_compat` 抜け）| create 時に `--compatibility-flags=nodejs_compat` を渡し忘れ → `process is not defined` 等の runtime error |
| 検証コマンド | (1) `bash scripts/cf.sh pages project list | jq -r '[.[] | {name, compatibility_date, compatibility_flags}]'` / (2) `grep -nE "compatibility_date|compatibility_flags" apps/api/wrangler.toml` / (3) 両者の値突合 |
| 期待値 | 両プロジェクトとも Workers 側と完全一致（`2025-01-01` / `["nodejs_compat"]`） |
| Red 状態 | Workers と Pages で値が乖離 / `nodejs_compat` 抜け |
| 対応 | (a) `bash scripts/cf.sh pages project delete <name>` → 再 create で `--compatibility-date` / `--compatibility-flags` 明示 / (b) Phase 12 で「Workers 側更新時は Pages 側を同期する運用」を 01b ドキュメントに追記。**rollback** = 値ミスマッチ確定時の delete → 再 create |

### T12: Pages Git 連携 ON 復活事故（R-5 / 苦戦箇所 §5）

| 項目 | 内容 |
| --- | --- |
| ID | T12 |
| 観点 | Git 連携 OFF 既定方針の維持 / GitHub Actions 主導 deploy との二重起動防止 |
| シナリオ | 誰かが Cloudflare Dashboard で「Connect to Git」を ON にする → Cloudflare 側で push を独自に build / deploy → GitHub Actions の `pages deploy` と二重 deploy / ログが分散 / 古い commit の build が採用されるレース |
| 検証コマンド | (1) Cloudflare Dashboard → Pages → 各プロジェクト → Settings → Builds & deployments で「Connect to Git」が OFF / (2) `bash scripts/cf.sh pages deployment list --project-name=ubm-hyogo-web-staging` で 1 push に対して 1 deploy のみ（GitHub Actions 由来） / (3) `source` フィールドが `direct_upload` / `null` 系であること |
| 期待値 | 両プロジェクトとも Git 連携 OFF / 1 push に対して GitHub Actions 由来の 1 deploy のみ |
| Red 状態 | Git 連携 ON / 同一 push に対して 2 件以上の deploy が並走 / 古い commit が deploy される |
| 対応 | Cloudflare Dashboard で「Disconnect from Git」を実行 → OFF 化。Phase 12 documentation-changelog.md に「Pages Git 連携 OFF 必須」を運用ルールとして追記。**rollback** = Disconnect で OFF 復元（Cloudflare 側 build キャンセル後に GitHub Actions 主導に再収束） |

### T13: `web-cd.yml` Pages プロジェクト名整合確認 + アップロード先方針確定（R-4 + R-1 統合）

| 項目 | 内容 |
| --- | --- |
| ID | T13 |
| 観点 | (i) `web-cd.yml` の `--project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}` / `--project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` の suffix 連結結果が UT-28 で create する 2 プロジェクト名と完全一致すること / (ii) アップロード先（`pages deploy .next` vs `pages deploy .open-next/assets`）の方針を本 Phase で確定 / (iii) 判定 (B) なら UT-05 にフィードバック |
| シナリオ A（命名整合）| Variable `CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web` の連結で main 分岐 = `ubm-hyogo-web` / dev 分岐 = `ubm-hyogo-web-staging` が成立し、UT-28 の作成名と一致 |
| シナリオ B（アップロード先 `.next`）| 現行 `web-cd.yml` の `pages deploy .next` を維持。OpenNext config が `.next` 経由でも互換 build を生成 → Phase 5 Step 5.5 smoke で `_worker.js` 機能を確認 → 維持で確定 |
| シナリオ C（アップロード先 `.open-next/assets` 切替必要）| Phase 5 Step 5.5 smoke で SSR 5xx / Functions タブ空 → `web-cd.yml` を `pages deploy .open-next/assets` に切り替える PR を UT-05 にフィードバック |
| 検証コマンド | (1) `grep -nE "pages deploy|project-name=\\$\\{\\{ vars\\.CLOUDFLARE_PAGES_PROJECT" .github/workflows/web-cd.yml` で参照キーと連結仕様を抽出 / (2) `bash scripts/cf.sh pages project list | jq -r '.[].name' | sort` と突合 / (3) Phase 5 Step 5.5 動作判定の結果（SSR ルート 200 / `_worker.js` 登録）を本 Phase で `outputs/phase-06/main.md §opennext-final-judgement` に記録 / (4) 判定 (B) 確定時は `outputs/phase-12/unassigned-task-detection.md` に UT-05 フィードバック起票 |
| 期待値 | 命名整合: 連結結果が `pages project list` の 2 件と一致 / アップロード先: 判定 (A) なら `.next` 維持 / 判定 (B) なら UT-05 へ切替 PR フィードバック登録 |
| Red 状態 | 命名乖離（Variable 値が `ubm-hyogo-web` でない / `web-cd.yml` で別名参照）/ 判定 (B) 確定時に UT-05 フィードバック未登録 / 本タスク内で `web-cd.yml` を直接編集してしまう（責務逸脱） |
| 対応 | (a) 命名乖離時: UT-27 Variable 値を `ubm-hyogo-web` に修正、または UT-05 / UT-28 のいずれかで命名を再合意 / (b) 判定 (B) 時: 本タスクでは `web-cd.yml` を編集せず Phase 12 unassigned-task-detection.md に「UT-05: web-cd.yml アップロード先を `.open-next/assets` に切替」を起票（責務分離 / R-1） / (c) 本タスクの責務はプロジェクト作成と命名・互換性の整合のみ。workflow 編集は UT-05 スコープ |

## fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step | CI gate 候補 |
| --- | --- | --- | --- |
| T8 | lane 3 + lane 4 | Phase 5 Step 3 / Step 4 / Phase 11 smoke | -（create 前 inventory） |
| T9 | lane 3 + lane 4 | Phase 5 Step 3 / Step 4 / Phase 11 smoke | ◎（Phase 12 登録 / `pages project list` の `production_branch` フィールドを CI で突合） |
| T10 | lane 2 + lane 5 | Phase 5 Step 2 / Step 5.5 / Phase 11 smoke / Phase 12 UT-05 フィードバック | -（UT-05 側で対処） |
| T11 | lane 3 + lane 4 + lane 5 | Phase 5 Step 3 / Step 4 / Phase 11 smoke / Phase 12 同期運用ドキュメント | ◎（Phase 12 登録 / `pages project list` の `compatibility_date` を `apps/api/wrangler.toml` と CI 突合） |
| T12 | lane 5 | Phase 5 Step 5.2 / Phase 11 smoke / Phase 12 documentation-changelog | -（Dashboard 目視 / Cloudflare API 上で確認可能なら CI 候補） |
| T13 | lane 1 + lane 5 | Phase 6 本体 / Phase 11 smoke / Phase 12 UT-05 フィードバック | ◎（Phase 12 登録 / `web-cd.yml` の参照キー文字列と `pages project list` の name を CI で突合） |

## `web-cd.yml` 整合確認 outputs（本 Phase で確定）

| 確認項目 | 期待値 | 確認手段 |
| --- | --- | --- |
| Variable `CLOUDFLARE_PAGES_PROJECT` の値 | `ubm-hyogo-web`（suffix なし / production 名） | UT-27 配置時に確定（本タスクは値の出所のみ提供） |
| `web-cd.yml` の dev 分岐 `--project-name=` | `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` → `ubm-hyogo-web-staging` | `grep -nE "project-name" .github/workflows/web-cd.yml` |
| `web-cd.yml` の main 分岐 `--project-name=` | `${{ vars.CLOUDFLARE_PAGES_PROJECT }}` → `ubm-hyogo-web` | 同上 |
| アップロード先（暫定方針） | `.next` 継続（判定 (A)）。Phase 5 Step 5.5 smoke で SSR 200 + `_worker.js` 登録を確認後に最終確定 | Phase 5 Step 2 静的判定 + Step 5.5 動作判定 |
| 判定 (B) 確定時の UT-05 フィードバック | `outputs/phase-12/unassigned-task-detection.md` に「UT-05: web-cd.yml アップロード先を `.open-next/assets` 系に切替」を起票 | Phase 12 で登録 |
| 本タスクで `web-cd.yml` を直接編集するか | **編集しない**（UT-05 スコープ / 責務分離） | AC-5 / Phase 1 §スコープ「含まない」 |

## 完了条件

- [ ] T8〜T13 が `outputs/phase-06/main.md` に表化されている
- [ ] 各テストにシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応が記述されている
- [ ] 6 観点（命名衝突 / `production_branch` 取り違え / OpenNext `_worker.js` 不在 / `compatibility_date` Workers drift / Pages Git 連携 ON 復活 / `web-cd.yml` 整合 + アップロード先方針確定）がカバーされている
- [ ] T13 の `web-cd.yml` 命名整合確認結果が `outputs/phase-06/main.md §web-cd-name-check` に記録されている
- [ ] T13 のアップロード先方針（暫定 (A) `.next` 維持 + Phase 5 Step 5.5 smoke で最終確定）が記述されている
- [ ] T13 の判定 (B) 確定時の UT-05 フィードバック経路（Phase 12 unassigned-task-detection.md）が明記されている
- [ ] 本タスクで `web-cd.yml` を直接編集しない（責務分離）が T13 で明記されている
- [ ] T8 / T11 の rollback 経路（`pages project delete` → 再 create）が明記されている
- [ ] 実テスト走行は Phase 11 / 13（ユーザー承認後）に委ねる旨が明示されている
- [ ] API Token / Account ID / 秘匿 ID 値が検証コマンド出力 / Red 状態の説明 / 対応手順に転記されていない（公開 URL のみ可 / AC-13）
- [ ] 全 T のコマンドが `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行なし / AC-14）

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-06/main.md
rg -c "^### T(8|9|10|11|12|13):" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-06/main.md
# => 6
rg -c "wrangler " docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-06/main.md | grep -v "scripts/cf.sh"
# => 0（wrangler 直接実行なし）
```

## 苦戦防止メモ

1. **T9 / T11 / T13 は CI gate 化が望ましい**: 手動 review では `production_branch` 取り違え / `compatibility_date` Workers drift / Variable 値ミスマッチを検出しきれない。Phase 12 unassigned-task-detection.md に CI gate タスクを登録（`pages project list` の JSON と `apps/api/wrangler.toml` / `web-cd.yml` を突合する自動チェック）。
2. **T10 / T13 はセットで扱う**: OpenNext `_worker.js` 不在の根本原因はアップロード先の不整合であり、修正は `web-cd.yml` 側（UT-05 スコープ）。本タスクは判定までで責務を切る。
3. **T12 は CI からは検出しづらい**: Dashboard 目視 + `pages deployment list` の deploy 件数で間接判定。運用周期で確認することを Phase 12 documentation-changelog.md に明記。
4. **T8 命名衝突の rollback は Variable 値同期が必要**: `pages project delete` → 別名で create する場合、UT-27 Variable `CLOUDFLARE_PAGES_PROJECT` 値も同期更新が必要。本タスク完了後に UT-27 へフィードバック。
5. **本 Phase は実走しない**: 仕様化のみ。実走は Phase 11 smoke / Phase 13 ユーザー承認後配置。
6. **API Token / Account ID 値転記禁止を異常系シナリオでも徹底**: 「Red 状態」の説明で具体的な Token 文字列の示唆も避ける。「401 で create 失敗」「Token スコープ不足で 401」のように観測される現象のみを記述する（AC-13）。
7. **`wrangler` 直接実行禁止**: T8〜T13 のすべての検証コマンド・対応コマンドが `bash scripts/cf.sh ...` 経由（AC-14）。
8. **本タスクで `web-cd.yml` を編集しない**: T13 判定 (B) でも workflow 編集は UT-05 スコープ。本タスクは判定とフィードバック起票までで責務を切る（責務分離）。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T7（happy path）+ T8〜T13（fail path）の合計 13 件を Phase 7 AC マトリクス入力として渡す
  - T9 / T11 / T13 を CI gate 候補として Phase 12 に申し送り
  - T10 / T13 の OpenNext / アップロード先切替フィードバックを Phase 12 unassigned-task-detection.md に登録（判定 (B) 確定時のみ）
  - T12 の Pages Git 連携 OFF ルールを Phase 12 documentation-changelog.md に転記
  - T11 の Workers / Pages `compatibility_date` 同期運用を Phase 12 で 01b ドキュメントに追記
- ブロック条件:
  - 6 観点のいずれかが未カバー
  - T13 の `web-cd.yml` 命名整合確認結果が outputs に記録されない
  - T13 の判定 (B) 時の UT-05 フィードバック経路が Phase 12 への引き渡しから欠落
  - T8 / T11 の rollback 経路（delete → 再 create）が runbook に記載されない
  - 本タスクで `web-cd.yml` を直接編集する記述が混入している（責務逸脱）
  - API Token / Account ID 値が異常系シナリオの説明 / 検証コマンド / 対応手順に転記されている
  - コマンド系列に `wrangler` 直接実行が混入している
