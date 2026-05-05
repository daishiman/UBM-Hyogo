# Phase 7: AC マトリクス（受入条件 × Phase 1-13 マッピング）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（AC-1〜15 を Phase 1-13 / T1〜T13 / 成果物 にマッピング） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending（仕様化のみ完了） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

`index.md §受入条件` / `phase-01.md` で確定した AC-1〜15 を、Phase 1〜13 のどこで・どの T（Phase 4 / 6 由来 / T1〜T13）/ どの成果物で・どう満たすかを **マトリクスとして固定する**。本 Phase は AC の追跡可能性確保のみで、実走を伴わない。AC × Phase × T × 成果物の 4 軸対応関係が空欄なく埋まっていることが Phase 9 / 10 GO 条件の入力。動作確認（dev push staging deploy / main push production deploy）の AC は実走確認が必要だが、本 Phase ではマッピングのみを行い、実走は Phase 11 / 13 に委譲する。

## 動作検証（dev push → staging / main push → production）の Phase マッピング

本 Phase で **AC-8（dev push → staging deploy success）/ AC-9（main push → production deploy success）の動作検証** を以下の Phase に明確にマッピングする：

| 動作検証 | 仕様化 Phase | 実走 Phase | 主な T |
| --- | --- | --- | --- |
| `dev` push → `web-cd.yml` deploy-staging green / `https://ubm-hyogo-web-staging.pages.dev` 200 | Phase 4 T4 / Phase 5 Step 5.3 | Phase 11 manual-smoke / Phase 13 user_approval 後 | T4 + T7 + T9 |
| `main` push → `web-cd.yml` deploy-production green / `https://ubm-hyogo-web.pages.dev` 200 | Phase 4 T5 / Phase 5 Step 5.4 | Phase 11 manual-smoke / Phase 13 user_approval 後 | T5 + T7 + T9 |

## 実行タスク

- タスク1: AC-1〜15 を一覧化し、対応 Phase / 成果物 / T を 1:N でマッピングする。
- タスク2: 親仕様 §AC（一覧）と index.md 設計追加 AC を出典付きで分離して写経する。
- タスク3: Phase 7 で「空セルなし」「未消化 AC なし」を確認する。
- タスク4: AC-12（上流 2 件 3 重明記）/ AC-15（artifacts.json 完全一致）の構造的被覆を引用付きで確認する。
- タスク5: 動作検証 AC（AC-8 / AC-9）が Phase 11 / Phase 13 で実走されることを明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | 親仕様 AC 起源 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/index.md §受入条件 | AC-1〜15 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-01.md | AC × Phase 1 入力 / 上流 2 件 3 重明記 1/3 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | AC × Phase 2 入力 / 上流 2 件 3 重明記 2/3 / R-1〜R-5 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-03.md | AC × Phase 3 入力 / 上流 2 件 3 重明記 3/3 / R-6〜R-8 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-04.md | T1〜T7（happy path） |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-05.md | 実装ランブック 6 ステップ |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-06.md | T8〜T13（fail path）/ `web-cd.yml` 整合確認 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/artifacts.json | Phase 1-13 状態（本 workflow で作成済み） |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-07.md | フォーマット参照 |

## 実行手順

1. index.md §受入条件 の AC-1〜15 を写経する。
2. AC × Phase の対応マトリクスを 1:N で表にする（空セルなし）。
3. AC × T（T1〜T13）の対応マトリクスで全 AC を最低 1 件の T で被覆（構造的 AC は構造引用で代替）。
4. AC × 成果物 の対応マトリクスで全 AC を最低 1 件の成果物に紐付ける。
5. AC-12（上流 2 件 3 重明記）/ AC-15（artifacts.json 完全一致）を構造引用で被覆確認する。
6. AC-8 / AC-9 の動作検証実走 Phase（Phase 11 / Phase 13）を再確認する。
7. 未消化 AC が無いことを Phase 9 / 10 ゲート入力として確認する。

## 統合テスト連携

Phase 9（品質保証）/ Phase 10（最終レビュー）の GO/NO-GO 判定で、本 Phase の AC マトリクスを再利用する。AC ↔ Phase ↔ T ↔ 成果物 の 4 軸対応関係が空欄なく埋まっていることが Phase 10 通過条件。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC-1〜15 × Phase 1〜13 × T1〜T13 × 成果物 マッピング |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## AC 一覧（出典付き / index.md §受入条件 写経）

| ID | 内容 | 出典 |
| --- | --- | --- |
| AC-1 | production プロジェクト `ubm-hyogo-web` を `production_branch=main` で作成する手順が仕様化されている | index.md / 親仕様 §苦戦箇所 §2 |
| AC-2 | staging プロジェクト `ubm-hyogo-web-staging` を `production_branch=dev` で作成する手順が仕様化されている | index.md / 親仕様 §苦戦箇所 §2 |
| AC-3 | 両プロジェクトに `nodejs_compat` 互換性フラグが ON で適用される手順が仕様化されている | index.md / 親仕様 §苦戦箇所 §3 |
| AC-4 | `compatibility_date` を Workers 側 `2025-01-01` と整合させる手順が仕様化されている（同一値、または以降の同一値で揃える方針が明記） | index.md / 親仕様 §苦戦箇所 §3 |
| AC-5 | アップロード対象ディレクトリ（`.next` のままで OpenNext と整合するか、`.open-next/assets` + `_worker.js` 構造に切り替えるか）の判定基準が明文化され、必要なら UT-05 へフィードバックする条件が定義されている | index.md / 親仕様 §苦戦箇所 §1 |
| AC-6 | 命名規則「production = `<base>` / staging = `<base>-staging`」が明文化され、UT-27 へ引き渡す `CLOUDFLARE_PAGES_PROJECT` Variable の値が `<base>`（suffix なし）であることが固定されている | index.md / 親仕様 §苦戦箇所 §4 |
| AC-7 | Pages の Git 連携を OFF にする方針（GitHub Actions 主導 deploy と二重起動しない）が明文化されている | index.md / 親仕様 §苦戦箇所 §5 |
| AC-8 | `dev` push で staging プロジェクトに deploy 成功することを確認する手順が定義されている（実走は Phase 11 / 13） | index.md / Phase 4 T4 |
| AC-9 | `main` push で production プロジェクトに deploy 成功することを確認する手順が定義されている（実走は Phase 11 / 13） | index.md / Phase 4 T5 |
| AC-10 | 苦戦箇所 5 件（OpenNext アップロード先 / `production_branch` 落とし穴 / `compatibility_date` Workers 同期 / 命名揺れ / Pages 自動 Git 連携）が Phase 2 リスク表 R-1〜R-5 にマップされている | index.md / Phase 2 §リスク表 |
| AC-11 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 の双方で PASS 確認されている | index.md / phase-01.md / phase-03.md |
| AC-12 | 上流タスク（01b / UT-05）完了確認が Phase 1（前提）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記されている | index.md / phase-01.md / phase-02.md / phase-03.md |
| AC-13 | API Token 値・Account ID 値・実プロジェクト URL を含む実行ログが payload / runbook / Phase outputs に転記されない方針が明文化されている | index.md / 親仕様 §苦戦箇所 / CLAUDE.md |
| AC-14 | `bash scripts/cf.sh` 経由で `wrangler` を呼び出す（直接 `wrangler` 実行禁止）が運用ルールとして明記されている | index.md / CLAUDE.md |
| AC-15 | Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed` / Phase 4〜13 = `pending` | index.md / artifacts.json |

## AC × Phase 対応マトリクス（空セルなし）

| AC | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | P11 | P12 | P13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 要件 | 設定一致表 + コマンド草案 | base case PASS | T1/T2 | Step 3 | T8/T9 | 本表 | DRY | QA | レビュー | smoke | docs | apply-runbook §production |
| AC-2 | 要件 | 設定一致表 + コマンド草案 | base case PASS | T1/T2 | Step 4 | T8/T9 | 本表 | DRY | QA | レビュー | smoke | docs | apply-runbook §staging |
| AC-3 | 要件 | 設定一致表 | PASS | T3 | Step 3/4 | T11 | 本表 | DRY | QA | レビュー | smoke | docs | apply-runbook 引数 |
| AC-4 | 要件（Workers 同期） | 設定一致表（同一値固定） | PASS | T3 | Step 1/3/4 | T11 | 本表 | DRY | QA | レビュー | smoke | 01b 同期運用追記 | apply-runbook 引数 |
| AC-5 | 要件（OpenNext 判定予約） | 判定基準 (A)/(B) + UT-05 フィードバック条件 | open question #1 | T7 | Step 2 / Step 5.5 | T10/T13 | 本表 | DRY | QA | レビュー | smoke | unassigned-task-detection に UT-05 フィードバック登録 | verification-log §opennext |
| AC-6 | 要件（命名固定） | 命名規則表 + Variable 引き渡し | base case PASS | T1/T4/T5 | Step 3/4/5.3/5.4 | T8/T13 | 本表 | DRY | QA | レビュー | smoke | UT-27 への命名同期通知 | apply-runbook 命名 |
| AC-7 | 要件（Git 連携 OFF） | Git 連携 OFF 既定方針 | 案 D 不採用根拠 | T6 | Step 5.2 | T12 | 本表 | DRY | QA | レビュー | smoke | documentation-changelog 運用ルール | verification-log §git-off |
| AC-8 | 要件（dev push smoke） | 動作確認手順 §dev push smoke | smoke 観点 | T4 | Step 5.3 | T13 統合 | 本表 | DRY | QA | レビュー | **manual-smoke-log（実走）** | docs | **verification-log（実走）** |
| AC-9 | 要件（main push smoke） | 動作確認手順 §main push smoke | smoke 観点 | T5 | Step 5.4 | T13 統合 | 本表 | DRY | QA | レビュー | **manual-smoke-log（実走）** | docs | **verification-log（実走）** |
| AC-10 | 苦戦箇所 1〜5 受け皿 | R-1〜R-5 表化 | R-6〜R-8 補強 | T1〜T7 各対応 | Step 0/2/3/4/5 で個別緩和 | T8〜T13 全件対応 | 本表（被覆確認） | DRY | QA | レビュー | smoke | 運用 docs | apply-runbook |
| AC-11 | 4 条件 PASS | 4 条件再確認 | 9 観点 PASS（with notes） | テスト戦略入力 | runbook 入力 | 異常系入力 | 本表 | DRY | QA | レビュー | smoke | docs | apply-runbook |
| AC-12 | 依存境界 1/3 | 依存タスク順序 2/3 | NO-GO 条件 3/3 | 引き継ぎ確認 | Step 0 ゲート再確認 | 引き継ぎ確認 | 本表（構造引用） | DRY | QA | レビュー | smoke | docs | apply-runbook 前提確認 |
| AC-13 | 不変条件 touched | env / Secret §値転記禁止 | NO-GO 条件 | 全 T で `op://` 参照 | one-shot ラッパー / 全 Step | Red 状態の値示唆禁止 | 本表（全行で被覆） | DRY | QA | レビュー | smoke（Account ID 不記録） | docs | verification-log（公開 URL のみ） |
| AC-14 | 不変条件 touched | コマンド草案（`bash scripts/cf.sh` 経由） | 案 A 採用根拠 | 全 T が `cf.sh` 経由 | 全 Step が `cf.sh` 経由 | 全 T が `cf.sh` 経由 | 本表（全行で被覆） | DRY | QA | レビュー | smoke | docs | apply-runbook |
| AC-15 | Phase 一覧 | Phase 一覧 | Phase 一覧 | artifacts.json `phases[3]` | artifacts.json `phases[4]` | artifacts.json `phases[5]` | 本表（構造引用） | artifacts.json `phases[7]` | artifacts.json `phases[8]` | artifacts.json `phases[9]` | artifacts.json `phases[10]` | artifacts.json `phases[11]` | artifacts.json `phases[12]` |

## AC × T 対応マトリクス（T1〜T13）

| AC | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | ◎ | ◎ |   |   | ◎ |   |   | ◎ | ◎ |   |   |   | ◎ |
| AC-2 | ◎ | ◎ |   | ◎ |   |   |   | ◎ | ◎ |   |   |   | ◎ |
| AC-3 |   |   | ◎ |   |   |   |   |   |   |   | ◎ |   |   |
| AC-4 |   |   | ◎ |   |   |   |   |   |   |   | ◎ |   |   |
| AC-5 |   |   |   |   |   |   | ◎ |   |   | ◎ |   |   | ◎ |
| AC-6 | ◎ |   |   | ◎ | ◎ |   |   | ◎ |   |   |   |   | ◎ |
| AC-7 |   |   |   |   |   | ◎ |   |   |   |   |   | ◎ |   |
| AC-8 |   |   |   | ◎ |   |   | ◎ |   | ◎ |   |   |   | ◎ |
| AC-9 |   |   |   |   | ◎ |   | ◎ |   | ◎ |   |   |   | ◎ |
| AC-10 | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ |
| AC-11 | 構造引用（Phase 1 / 3 §4 条件評価で PASS） |
| AC-12 | 構造引用（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件 の 3 行で被覆） |
| AC-13 | 全 T で `op://` 参照 + 公開 URL のみ記録（全行被覆） |
| AC-14 | 全 T のコマンドが `bash scripts/cf.sh ...` 経由（全行被覆） |
| AC-15 | 構造引用（artifacts.json `phases[]` と Phase 一覧の完全一致 / 本 workflow で作成済み） |

> 凡例: ◎ = 主被覆 / 空白 = 直接被覆なし（他 T で被覆）/ 構造引用 = 単一 T ではなく構造で被覆

## AC × 成果物 対応マトリクス

| AC | 成果物 |
| --- | --- |
| AC-1 | outputs/phase-02/main.md（設定一致表）/ outputs/phase-04/main.md（T1/T2）/ outputs/phase-05/main.md（Step 3）/ outputs/phase-13/apply-runbook.md §production |
| AC-2 | outputs/phase-02/main.md（設定一致表）/ outputs/phase-04/main.md（T1/T2）/ outputs/phase-05/main.md（Step 4）/ outputs/phase-13/apply-runbook.md §staging |
| AC-3 | outputs/phase-02/main.md / outputs/phase-04/main.md（T3）/ outputs/phase-05/main.md（Step 3/4 引数） |
| AC-4 | outputs/phase-02/main.md / outputs/phase-04/main.md（T3）/ outputs/phase-12/documentation-changelog.md（Workers 同期運用追記） |
| AC-5 | outputs/phase-02/main.md §opennext-judgement / outputs/phase-04/main.md（T7）/ outputs/phase-06/main.md（T10/T13）/ outputs/phase-12/unassigned-task-detection.md（UT-05 フィードバック起票 / 判定 (B) 時のみ） |
| AC-6 | outputs/phase-02/main.md（命名規則表）/ outputs/phase-04/main.md（T1/T4/T5）/ outputs/phase-12（UT-27 への Variable 値同期通知） |
| AC-7 | outputs/phase-02/main.md（Git 連携 OFF 既定方針）/ outputs/phase-04/main.md（T6）/ outputs/phase-12/documentation-changelog.md（運用ルール） |
| AC-8 | outputs/phase-04/main.md（T4）/ outputs/phase-05/main.md（Step 5.3）/ outputs/phase-11/manual-smoke-log.md / outputs/phase-13/verification-log.md |
| AC-9 | outputs/phase-04/main.md（T5）/ outputs/phase-05/main.md（Step 5.4）/ outputs/phase-11/manual-smoke-log.md / outputs/phase-13/verification-log.md |
| AC-10 | outputs/phase-02/main.md §リスク表 R-1〜R-5 / outputs/phase-03/main.md §R-6〜R-8 / outputs/phase-06/main.md（T8〜T13） |
| AC-11 | outputs/phase-01/main.md §4 条件評価 / outputs/phase-03/main.md §base case 最終判定 |
| AC-12 | outputs/phase-01/main.md §依存境界 / outputs/phase-02/main.md §依存タスク順序 / outputs/phase-03/main.md §NO-GO 条件 |
| AC-13 | 全 outputs（実値転記なし / 公開 URL のみ可） |
| AC-14 | 全 outputs（コマンド系列が `bash scripts/cf.sh ...` 経由） |
| AC-15 | artifacts.json（Phase 1〜13 全行）+ index.md §Phase 一覧 |

## 完了条件

- [ ] AC-1〜15 が `outputs/phase-07/main.md` に写経されている
- [ ] AC × Phase の対応マトリクスが空セル 0
- [ ] AC × T（T1〜T13）の対応マトリクスで全 AC が最低 1 件の T で被覆（AC-11 / AC-12 / AC-13 / AC-14 / AC-15 は構造引用で代替）
- [ ] AC × 成果物 の対応マトリクスで全 AC が最低 1 件の成果物に紐付く
- [ ] AC-12（3 重明記）の引用箇所が Phase 1 / 2 / 3 から 3 行とも明示される
- [ ] AC-15（artifacts.json 完全一致）が Phase 1〜13 全行で ✓
- [ ] AC-8 / AC-9 の実走 Phase（Phase 11 manual-smoke / Phase 13 verification-log）が明示されている
- [ ] AC-10 が苦戦箇所 5 件 → R-1〜R-5 → T1〜T13 まで縦断的に被覆されている

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-07/main.md
rg -c "^\| AC-(1[0-5]|[1-9]) " docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-07/main.md
# => 15 以上
rg -c "manual-smoke-log|verification-log" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-07/main.md
# => AC-8 / AC-9 の実走 Phase 紐付けが含まれる
```

## 苦戦防止メモ

1. **空セルゼロを機械チェック**: 1 セルでも空だと Phase 9 / 10 で再掘り起こしが発生する。Phase 7 完了時に `rg "\| - \|"` 等で「-」セルを再点検し、AC-11 / AC-12 / AC-13 / AC-14 / AC-15 のような構造的 AC については「構造引用で被覆」と明示注記する。
2. **AC-12（3 重明記）の自己検証**: Phase 1 §依存境界（重複明記 1/3）/ Phase 2 §依存タスク順序（重複明記 2/3）/ Phase 3 §依存タスク順序（重複明記 3/3）の 3 行を引用する。
3. **AC-5（OpenNext 判定）は T7 / T10 / T13 で挟む**: 静的判定（T7 / Phase 5 Step 2）+ 動作判定（T7 / Phase 5 Step 5.5）+ 異常系（T10）+ アップロード先方針確定（T13）の 4 軸で被覆。判定 (B) 時の UT-05 フィードバック起票（Phase 12）まで AC × 成果物 で紐付ける。
4. **AC-6（命名規則）と AC-8 / AC-9 の連動**: Variable `CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web`（suffix なし）と `web-cd.yml` の suffix 連結結果が一致して初めて T4 / T5 が green になる。マトリクスでは AC-6 / AC-8 / AC-9 が T1 / T4 / T5 / T13 で同時被覆されることを示す。
5. **AC-13 / AC-14 は全 Phase × 全 T で被覆**: 値転記禁止と `wrangler` 直接実行禁止は単一 T ではなく全成果物の不変条件。マトリクスでは「全 T で被覆」と明示する。
6. **AC-1（最小スコープではないが必須引数の固定）は T1 / T2 + T8 / T9**: happy（T1 / T2 = create 完了 + production_branch 配線）+ fail（T8 = 命名衝突 / T9 = production_branch 取り違え）の両側で被覆。
7. **本 Phase は実走しない**: マッピング作業のみ。AC-8 / AC-9 の実走は Phase 11 / Phase 13。
8. **動作検証 AC（AC-8 / AC-9）の Phase 11 / Phase 13 紐付けを明示**: 本 Phase の表に「実走」マークを入れることで、Phase 9 / 10 で「実走未済」と誤判定されないようにする。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC-1〜15 × Phase 1-13 × T1〜T13 × 成果物 の対応マトリクスを Phase 9 / 10 GO/NO-GO 判定の根拠に再利用
  - 未消化 AC が無いことを Phase 8 DRY 化レビューでも再確認
  - AC-8（dev push staging deploy）/ AC-9（main push production deploy）/ AC-5（OpenNext 整合）/ AC-7（Git 連携 OFF）の 4 件は実走確認が要件 → Phase 11 manual-smoke-log.md / Phase 13 verification-log.md で最終証跡化
  - AC-5 判定 (B) 確定時の UT-05 フィードバック起票（Phase 12 unassigned-task-detection.md）を申し送り
- ブロック条件:
  - AC × Phase / AC × T / AC × 成果物 のいずれかで空セル
  - AC-1〜15 のうち被覆漏れ
  - AC-12（3 重明記）の引用箇所が 3 箇所揃わない
  - AC-15（artifacts.json 完全一致）が Phase 1〜13 全行で ✓ になっていない
  - AC-8 / AC-9 の実走 Phase（Phase 11 / Phase 13）紐付けが本表で欠落
