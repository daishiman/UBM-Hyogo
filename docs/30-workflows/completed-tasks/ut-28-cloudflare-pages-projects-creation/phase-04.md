# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（validation matrix: project list 配置検証 / production_branch 整合 / compatibility 同期 / dev push staging deploy / main push production deploy / Git 連携 OFF / OpenNext アップロード整合） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending（仕様化のみ完了 / 実走は別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

Phase 3 で PASS（with notes 6 件）が確定した base case（案 A: `bash scripts/cf.sh pages project create` 経由 / lane 1〜5 直列 + lane 3-4 部分並列）に対し、**Phase 5 着手前に「何を満たせば Green か」を 7 種類のテスト（T1〜T7）として確定する**。本タスクは UI 変更なし（NON_VISUAL）かつ Cloudflare Pages プロジェクト作成タスクのため、ユニットテストではなく **作成後の挙動検証マトリクス** として固定する。本 Phase はテストの実走ではなく、Phase 5 ランブック / Phase 6 異常系 / Phase 11 smoke / Phase 13 ユーザー承認後配置が参照する **検証コマンド系列の正本** として固定する。

> **本 Phase は仕様化のみ**。実 `bash scripts/cf.sh pages project create` / `git push origin dev` / `git push origin main` は Phase 13 ユーザー承認後の別オペレーション。本 Phase ではコマンドを記述するが**実行は禁止**。

## 依存タスク順序（上流 2 件完了必須）— 引き継ぎ確認

UT-05（CI/CD パイプライン実装）/ 01b（Cloudflare base bootstrap）の 2 件すべてが completed であること（Phase 1 / 2 / 3 で 3 重明記済み）。1 件でも未完了で T1〜T7 を実走させると、(a) `bash scripts/cf.sh pages project create` を呼ぶための API Token が未発行で 401、(b) `web-cd.yml` の参照キーと Pages プロジェクト名が乖離して `pages deploy` が 8000017 (Project not found) / 命名ミスマッチ、のいずれかが確定する。

## 実行タスク

- タスク1: T1〜T7 の対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを表化する。
- タスク2: 上流 2 件完了前提を本 Phase でも再確認する。
- タスク3: 実走を Phase 5 / 6 / 11 / 13 に委譲する境界を明記する。
- タスク4: API Token 値 / Account ID 値 / 秘匿 ID を一切転記しないこと（`op` 参照のみ記述、公開 URL は記録可）を全 T で徹底する。
- タスク5: コマンド系列を全て `bash scripts/cf.sh ...` 経由で固定する（`wrangler` 直接実行を T レベルで禁止）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | lane 1〜5 設計 / プロジェクト設定一致表 / コマンド草案 / state ownership |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-03.md | base case PASS（with notes 6 件） / NO-GO 条件 / open question |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md §苦戦箇所・知見 | リスク源（OpenNext / production_branch / compatibility / 命名 / Git 連携） |
| 必須 | .github/workflows/web-cd.yml | `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev` / `--project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main` の突合元 |
| 必須 | apps/web/wrangler.toml | `pages_build_output_dir` / `compatibility_date` / `compatibility_flags` 突合元 |
| 必須 | apps/api/wrangler.toml | Workers 側 `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` 同期突合 |
| 必須 | scripts/cf.sh | `wrangler` ラッパーの正規経路 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | テスト戦略フォーマット参照 |

## 実行手順

1. Phase 2 設計（lane 1〜5 / 設定一致表 / コマンド草案）と Phase 3 PASS 判定を入力として確認する。
2. T1〜T7 の対象 lane / 検証コマンド / 期待値 / Red 状態を表に落とす。
3. 本 Phase ではコマンドを実走しないことを Phase 5 ランブック側に明示的に引き渡す。

## 統合テスト連携

T1〜T7 は別オペレーション側で Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 11（手動 smoke）/ Phase 13（ユーザー承認後配置）の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T7 のテスト一覧 / 検証コマンド / 期待値 / 失敗時切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## テスト一覧（happy path）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前 / 作成前）の現状値 / **対応 lane** = Phase 2 §SubAgent lane 設計の lane 番号

### T1: プロジェクト作成完了検証（Cloudflare アカウントに 2 件存在）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 lane | lane 3 + lane 4（production / staging プロジェクト作成） |
| 検証コマンド | `bash scripts/cf.sh pages project list` の出力を `jq -r '.[].name' | sort` で抽出し、`ubm-hyogo-web` / `ubm-hyogo-web-staging` の 2 件が含まれることを確認 |
| 期待値 | プロジェクト集合に `ubm-hyogo-web` / `ubm-hyogo-web-staging` の 2 件がいずれも存在 / 名前以外のフィールド（subdomain 等）の存在のみ確認し、Account ID 等の秘匿値は出力に転記しない |
| Red 状態 | いずれかのプロジェクト名が未作成 / 命名揺れ（`ubm-hyogo` / `ubm-hyogo-web-stg` 等のタイポ） |
| 失敗時切り分け | (a) lane 3 / lane 4 の `bash scripts/cf.sh pages project create` 失敗（401: Token スコープ不足 / 409: 同名衝突） / (b) Phase 2 命名規則（AC-6）と実 create 名の乖離 / (c) 上流 01b の API Token 未発行 |

### T2: `production_branch` 環境別配線検証（main / dev の正配線）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 lane | lane 3 + lane 4 + lane 5（設定確認） |
| 検証コマンド | (1) `bash scripts/cf.sh pages project list` の出力から `ubm-hyogo-web` の `production_branch` が `main` / `ubm-hyogo-web-staging` の `production_branch` が `dev` であることを `jq` で抽出 / (2) `bash scripts/cf.sh pages deployment list --project-name=ubm-hyogo-web-staging` で deploy 履歴の branch ラベルが `dev` であることを確認（lane 5 動作確認後） |
| 期待値 | production プロジェクト = `production_branch=main` / staging プロジェクト = `production_branch=dev` / Cloudflare 側で「production」スコープに分類される（preview alias でない） |
| Red 状態 | 取り違え（production プロジェクトに `dev` / staging プロジェクトに `main`）/ 未設定（`production_branch` が空 or 既定の `main` のまま staging に流用）/ deploy URL が `<commit>.<project>.pages.dev` のプレビューエイリアス化（苦戦箇所 §2） |
| 失敗時切り分け | (a) `bash scripts/cf.sh pages project create` 時に `--production-branch=` を渡し忘れ / (b) staging プロジェクトに `--production-branch=dev` を渡さず既定 `main` で作成 / (c) Phase 2 設定一致表との乖離 |

### T3: `compatibility_date` / `compatibility_flags` Workers 同期検証（苦戦箇所 §3）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 lane | lane 3 + lane 4 + lane 5 |
| 検証コマンド | (1) `bash scripts/cf.sh pages project list` の出力から両プロジェクトの `compatibility_date` / `compatibility_flags` を `jq` で抽出 / (2) `apps/api/wrangler.toml` の `compatibility_date` / `compatibility_flags` を `grep -E "compatibility_date|compatibility_flags" apps/api/wrangler.toml` で抽出 / (3) 両者が完全一致（`2025-01-01` / `["nodejs_compat"]`）することを目視突合 |
| 期待値 | Pages 両プロジェクト: `compatibility_date = "2025-01-01"` / `compatibility_flags` に `nodejs_compat` を含む / Workers 側 `apps/api/wrangler.toml` と完全一致 |
| Red 状態 | Pages 側のみ更新されて Workers と乖離 / `nodejs_compat` フラグ抜けで `process` / `node:*` 利用箇所が片側だけ壊れる / `compatibility_date` が既定（create 時の current date）で確定し Workers 側 `2025-01-01` と乖離 |
| 失敗時切り分け | (a) create 時に `--compatibility-date` / `--compatibility-flags` を未指定 / (b) Workers 側 `apps/api/wrangler.toml` を後から更新したが Pages 側を同期していない（運用 drift / R-3） / (c) Phase 12 で同期運用がドキュメント化されていない |

### T4: `dev` push → staging deploy green smoke（CD 実稼働化の最終確認 / 苦戦箇所 §1 / §4）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 lane | lane 5（動作確認） |
| 検証コマンド | (1) `git checkout dev && git pull --ff-only origin dev` / (2) `git commit --allow-empty -m "chore(cd): trigger staging deploy smoke [UT-28]"` / (3) `git push origin dev` / (4) `gh run watch` / (5) `gh run list --workflow web-cd.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'` => `success` / (6) `curl -sS -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.pages.dev` => `200` / (7) `bash scripts/cf.sh pages deployment list --project-name=ubm-hyogo-web-staging` で最新 deploy が `production` 環境扱い（preview ではない）であること |
| 期待値 | `web-cd.yml` の `deploy-staging` ジョブが green / `https://ubm-hyogo-web-staging.pages.dev` が 200 を返す / Cloudflare 側で deploy が production scope（`production_branch=dev` のため dev push が production scope 扱い） |
| Red 状態 | 8000017 (Project not found) → R-4（命名揺れ） or R-7（命名衝突 / 名前乖離） / 401 → R-6（API Token スコープ不足） / `_worker.js` 不在で SSR / API ルート 500 → R-1（OpenNext 不整合） / `<commit>.<project>.pages.dev` の preview alias で公開 URL が機能しない → R-2（`production_branch` 取り違え） |
| 失敗時切り分け | (a) Variable `CLOUDFLARE_PAGES_PROJECT` の値が `ubm-hyogo-web` （suffix なし）でなく `web-cd.yml` の連結結果が `ubm-hyogo-web-staging` にならない → UT-27 側 Variable 値修正 / (b) `bash scripts/cf.sh pages project list` で `ubm-hyogo-web-staging` が無い → lane 4 の create 再実行 / (c) `_worker.js` 不在 → OpenNext 切替判定 (B) → Phase 12 で UT-05 にフィードバック登録 |

### T5: `main` push → production deploy green smoke（本番経路の最終確認）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 lane | lane 5（動作確認） |
| 検証コマンド | (1) dev → main の PR を merge（通常運用 / 本 Phase ではコマンド記述のみ） / (2) `gh run watch` / (3) `gh run list --workflow web-cd.yml --branch main --limit 1 --json conclusion --jq '.[0].conclusion'` => `success` / (4) `curl -sS -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web.pages.dev` => `200` / (5) `bash scripts/cf.sh pages deployment list --project-name=ubm-hyogo-web` で最新 deploy が production scope であること |
| 期待値 | `web-cd.yml` の `deploy-production`（main 条件分岐）が green / `https://ubm-hyogo-web.pages.dev` が 200 / production scope deploy（`production_branch=main` のため main push が production scope） |
| Red 状態 | T4 と同様の 8000017 / 401 / OpenNext 不整合 / preview alias 化（production 側で発生した場合は本番影響大） |
| 失敗時切り分け | (a) Variable `CLOUDFLARE_PAGES_PROJECT` の値が `ubm-hyogo-web` でない / (b) lane 3 の production プロジェクト create が未完了 / (c) main ブランチ保護で push できない → UT-GOV-001 側設定確認（本タスクのスコープ外） |

### T6: Pages Git 連携 OFF 検証（苦戦箇所 §5 / R-5）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 対象 lane | lane 5（設定確認） |
| 検証コマンド | (1) Cloudflare Dashboard → Pages → 各プロジェクト → Settings → Builds & deployments を開く（GUI 目視） / (2) "Connect to Git" / "Git Integration" が OFF（または未接続）であることを確認 / (3) 任意で `bash scripts/cf.sh pages project list` の出力に `source` フィールドがある場合、その値が `null` / `direct_upload` 等であることを `jq` で確認 / (4) dev push smoke（T4）後に Cloudflare 側 build がトリガーされていない（GitHub Actions 由来の deploy が 1 件のみ）ことを `bash scripts/cf.sh pages deployment list --project-name=...` で確認 |
| 期待値 | 両プロジェクトとも Git 連携 OFF / Cloudflare 側 build が独立にトリガーされていない / GitHub Actions 由来の deploy 1 件のみが履歴に並ぶ |
| Red 状態 | Git 連携 ON で dev push 1 回に対して Cloudflare 側 build + GitHub Actions deploy の 2 件が並走 / ログが Cloudflare Dashboard と GitHub Actions に分散 / 古い commit の build が採用されるレース / 苦戦箇所 §5 の二重 deploy |
| 失敗時切り分け | (a) `bash scripts/cf.sh pages project create` の create 直後の既定状態は連携なしのため、ON の場合は誤って GUI で連携設定された / (b) 過去に同名プロジェクトが存在し連携済みの状態を再利用してしまった / (c) Phase 2 R-5 緩和策（Git 連携 OFF 既定）が運用に降りていない |

### T7: OpenNext アップロード整合性検証（苦戦箇所 §1 / R-1 / open question #1）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 対象 lane | lane 2 + lane 5（OpenNext 判定 + 動作確認 smoke） |
| 検証コマンド | (1) **静的判定（lane 2）**: `grep -E "pages_build_output_dir|compatibility" apps/web/wrangler.toml` / `grep -nE "pages deploy" .github/workflows/web-cd.yml` / `cat apps/web/open-next.config.ts | grep -E "defineCloudflareConfig|export"` で 3 ファイル整合確認 / (2) **動作判定（lane 5）**: T4 deploy 後に `curl -sS https://ubm-hyogo-web-staging.pages.dev/` でトップページが 200 / `curl -sS -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.pages.dev/api/health/db`（または UT-06 想定の任意 SSR ルート）が 5xx / 404 にならないことを確認 / (3) Cloudflare Dashboard → Pages → Deployments → 最新 deploy → Functions タブで `_worker.js` が登録されていること（GUI 目視） |
| 期待値 | 判定 (A): `.next` 継続で deploy / `_worker.js` が機能 / SSR・API ルートが 200 / OpenNext config (`defineCloudflareConfig()`) が `.next` 経由でも互換 build を生成できている |
| Red 状態 | 判定 (B): `_worker.js` 不在で SSR / API ルートが 500 / 404 / Functions タブが空 / runtime error（`process is not defined` 等の `nodejs_compat` 関連例外は T3 経由で別検出） |
| 失敗時切り分け | (a) 判定 (B) 確定 → 本タスクではプロジェクト作成のみ実施し、`apps/web/wrangler.toml` の `pages_build_output_dir` と `web-cd.yml` の `pages deploy .next` を `.open-next/assets` 系に切り替える PR を **UT-05 にフィードバック**（Phase 12 unassigned-task-detection.md に登録） / (b) `nodejs_compat` 起因のエラーは T3 で別検出 / (c) 静的判定で 3 ファイル不整合があれば lane 5 smoke の前に判定 (B) と確定 |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| プロジェクト作成完了（production / staging 計 2 件） | T1 で全件被覆 |
| `production_branch` 環境別配線（main / dev） | T2 で全件突合 |
| `compatibility_date` / `compatibility_flags` Workers 同期 | T3 で 2 環境 × 2 値被覆 |
| dev push staging deploy（`web-cd.yml` deploy-staging） | T4 で被覆 |
| main push production deploy（`web-cd.yml` deploy-production） | T5 で被覆 |
| Pages Git 連携 OFF（二重 deploy 防止） | T6 で 2 環境被覆 |
| OpenNext アップロード整合性（`.next` vs `.open-next/...`） | T7 で静的判定 + 動作判定の両被覆 |
| API Token / Account ID / 秘匿 ID 値転記禁止 | 全 T で `op://...` 参照のみ記述。実値出力の検証コマンドは含まない（公開 URL は記録可） |
| `wrangler` 直接実行禁止 | 全 T のコマンドが `bash scripts/cf.sh ...` 経由 |

## 完了条件

- [ ] T1〜T7 が `outputs/phase-04/main.md` に表化されている
- [ ] 各テストに ID / 対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] 上流 2 件完了が本 Phase の前提として再確認されている
- [ ] base case PASS（Phase 3）と設定一致表（Phase 2）が入力として参照されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 / 13 に委ねる旨が明示されている
- [ ] 本 Phase で `bash scripts/cf.sh pages project create` / `git push origin dev` / `git push origin main` を実行していない（仕様化のみ）
- [ ] API Token 値 / Account ID 値 / 秘匿 ID の payload / runbook / Phase outputs / 検証コマンドへの転記禁止が全 T で守られている（公開 URL `*.pages.dev` は記録可）
- [ ] 全 T のコマンド系列が `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行なし）

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
# 仕様の存在確認のみ（実テストは走らせない）
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-04/main.md
rg -c "^### T[1-7]:" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-04/main.md
# => 7
rg -c "wrangler " docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-04/main.md | grep -v "scripts/cf.sh"
# => `wrangler` 直接実行が混入していないこと（`bash scripts/cf.sh` 経由のみ）
```

## 苦戦防止メモ

1. **`production_branch` 取り違えは Cloudflare Dashboard 上では即時に判別しづらい**: deploy 自体は成功するが production scope ではなく preview alias になる。T2 で `pages project list` の `production_branch` フィールドと deploy 履歴の `branch` ラベルの両方を突合する。
2. **`compatibility_date` の Workers 同期 drift（T3）は CI ログでは検出できない**: Pages 側のみ更新が走っても deploy は green になり得る。Workers 側 `apps/api/wrangler.toml` を正本として両側を突合する運用を Phase 12 ドキュメントに固定。
3. **OpenNext 整合性（T7）は静的判定 + 動作判定の両方が必要**: `apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` と OpenNext の `.open-next/...` 出力構造の不整合は静的解析だけでは確定せず、`_worker.js` の存在は実 deploy 後の Cloudflare Functions タブまたは SSR/API ルートの実呼び出しでのみ確定する。
4. **Git 連携 OFF（T6）は GUI 目視が確実**: `bash scripts/cf.sh pages project list` の出力に Git 連携状態が含まれない場合があり得る。Phase 2 §動作確認手順で Dashboard 経由の確認を併記する。
5. **本 Phase は実走しない**: T1〜T7 の Red 確認は Phase 5 着手直前 / Phase 11 smoke / Phase 13 ユーザー承認後配置で行う。仕様化のみで Phase 5 へ進む。
6. **API Token / Account ID / 秘匿 ID 値を含むコマンド出力を Phase outputs に貼らない**: `bash scripts/cf.sh pages project list` の出力には Account ID 等の秘匿値が含まれ得るため、verification-log.md に転記する際は `jq` で `name` / `production_branch` / `compatibility_date` / `compatibility_flags` のみを抽出する（AC-13）。
7. **`wrangler` 直接実行禁止を全 T で徹底**: T レベルでも `bash scripts/cf.sh ...` 経由を強制し、Phase 5 ランブックの草案で混入が起きないよう先取りで縛る（AC-14）。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T7 を Phase 5 ランブック Step 1〜5 の Green 条件として参照
  - T1（プロジェクト作成完了）/ T2（production_branch 配線）/ T3（compatibility 同期）の検証コマンドを Phase 5 各 Step の確認コマンドに転記
  - T4（dev push staging deploy）/ T5（main push production deploy）/ T6（Git 連携 OFF）/ T7（OpenNext 整合性）は Phase 11 smoke の主要ケース
  - 実走は Phase 13 ユーザー承認後（user_approval_required: true）
  - T7 で判定 (B) 確定時は Phase 12 で UT-05 にフィードバック登録
- ブロック条件:
  - 上流 2 件（01b / UT-05）のいずれかが completed でない
  - T1〜T7 のいずれかに期待値・検証コマンドが欠けている
  - T6（Git 連携 OFF）が省略されている
  - T7（OpenNext 整合性）の静的判定 + 動作判定の両被覆が省略されている
  - コマンド系列に `wrangler` 直接実行が混入している
  - API Token / Account ID / 秘匿 ID 値が検証コマンドに直書きされている
