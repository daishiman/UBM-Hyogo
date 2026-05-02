# Phase 12: ドキュメント更新 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 12 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-02 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |
| status | spec_created / Phase 1-12 completed / Phase 13 pending_user_approval |

## 目的

task-specification-creator skill が定める Phase 12 必須 5 タスク（Task 12-1〜12-5）と Task 6（compliance check）を実施し、本タスクで更新すべきドキュメントを正本（aiworkflow-requirements / runbook / changelog）に反映する方針を固定する。

本 phase は **コード実装を伴わない**。Markdown 更新と changelog 整備に閉じる。Phase 11 の実 smoke 実行は user approval 後に行うため、本 phase 出力中の「実 smoke を前提にした更新」は明示的に *pending* で記載する。

## Phase 12 必須タスク一覧（7 ファイル構成）

| Task | 名称 | 出力ファイル |
| --- | --- | --- |
| index | Phase 12 メイン index | `outputs/phase-12/main.md` |
| 12-1 | implementation guide（中学生レベル + 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| 12-2 | system spec update summary | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | unassigned task detection（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | skill feedback report（改善点なしでも必須） | `outputs/phase-12/skill-feedback-report.md` |
| 6 | Phase 12 必須 7 ファイル compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 各サブ成果物の必須内容

### Task index: `outputs/phase-12/main.md`

- 7 ファイル一覧と各ファイルへの相対 link
- Phase 11 → Phase 12 → Phase 13 の引き渡し情報サマリ
- AC-7（aiworkflow-requirements 反映 trace）の状態

### Task 12-1: `outputs/phase-12/implementation-guide.md`

#### Part 1（中学生レベルの比喩）

「mock の偽データで OK と思っても、本番では D1 という本物の倉庫から商品を出してくるので、倉庫がちゃんと open しているか確認しないと、当日棚が空っぽになる」という比喩で、なぜ実 binding smoke が必要かを記述する。

具体的に次の 3 点を比喩で説明する:

1. **mock = 練習用の偽倉庫**: 練習中は誰でも商品を出せるが、お店の住所も中身も全部嘘
2. **D1 = 本物の倉庫**: 鍵 (binding) が無いと開かない、住所 (`PUBLIC_API_BASE_URL`) が間違ってると別の店に行く
3. **smoke = 開店前の試運転**: お客様 (curl) が来た時にちゃんと棚から商品が出てくるか、実倉庫で 1 回試す

#### Part 2（技術者レベル）

- `scripts/cf.sh` の役割
  - `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入
  - `ESBUILD_BINARY_PATH` 解決でグローバル esbuild と pinned esbuild の version mismatch を回避
  - `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を保証
- `PUBLIC_API_BASE_URL` 経路図
  ```
  Browser ─► apps/web (Cloudflare Workers / Next.js via @opennextjs/cloudflare)
              │
              │ SSR fetch / RSC fetch（`PUBLIC_API_BASE_URL` で apps/api host を解決）
              ▼
            apps/api (Cloudflare Workers / Hono)
              │
              │ env.DB.prepare(...).bind(...).all() （D1 binding 経由のみ）
              ▼
            Cloudflare D1
  ```
- D1 binding lookup の流れ: `wrangler.toml` `[[d1_databases]]` の `binding = "DB"` → Worker runtime で `env.DB` として注入 → `apps/api` 内で SQL 実行
- 不変条件 #6 順守: `apps/web` から `env.DB` に触れる import は存在しないことを `grep -r "env.DB|D1Database" apps/web/{app,src}` で 0 件であることを確認

### Task 12-2: `outputs/phase-12/system-spec-update-summary.md`

更新対象（実更新は **Phase 11 実 smoke 後の別 PR で実施 = pending**）:

| 対象 spec | 追記内容 | 状態 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Step 1-A: local smoke 起動手順 / Step 1-B: curl 5 cases / Step 1-C: screenshot 4 routes | pending runtime evidence |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 binding smoke の確認観点（seed query, items.length>=1, 不変条件 #6 grep）を append | pending runtime evidence |
| `.claude/skills/aiworkflow-requirements/references/` / `indexes/` | task inventory に本 workflow を `spec_created / implementation-spec / docs-only / VISUAL_ON_EXECUTION` として登録 | done |

実 smoke 完了後の別 PR で `15-infrastructure-runbook.md` 反映を行う旨を明示する。

### Task 12-3: `outputs/phase-12/documentation-changelog.md`

- 本 PR で追加・更新する仕様書ファイル一覧（`index.md` / `phase-01.md`〜`phase-13.md` / `outputs/phase-*/main.md` / 本 phase の 7 ファイル）
- 本 PR で **更新を行わない** spec 一覧と pending 理由（system-spec-update-summary に対応）
- 各ファイルの 1 行差分サマリ
- `Refs #273` 表記のみ使用、`Closes #273` は不使用

### Task 12-4: `outputs/phase-12/unassigned-task-detection.md`（0 件でも必須）

点検観点:

- mock smoke 限界（apps/web から fetch する base URL が mock fixture のままでも green になる経路）が新タスクとして残っていないか
- esbuild mismatch 再発時の `scripts/cf.sh` 改善余地が新タスク化されていないか
- staging URL（apps/web / apps/api）の Cloudflare DNS / route 設定タスクが存在するか
- Playwright を導入する場合の devDependency / CI integration タスクが存在するか
- OGP / sitemap / mobile FilterBar（本 scope out）の親タスクへ trace されているか

検出件数 0 でも本ファイルは必ず生成し、点検観点ごとに「該当なし」or「既存タスク `<id>` に trace 済み」を明記する。

### Task 12-5: `outputs/phase-12/skill-feedback-report.md`（改善なしでも必須）

- task-specification-creator skill: VISUAL タスクで Phase 11 が screenshot 4 routes × 2 環境となるケースの evidence ディレクトリ構造ガイドが弱い旨など、観察事項を記述
- aiworkflow-requirements skill: current task inventory 登録の自動化スクリプト導線が `pnpm indexes:rebuild` のみであるか、新規タスク登録専用コマンドが必要か
- 改善提案がない場合も「観察事項のみ・改善提案なし」を明記

### Task 6: `outputs/phase-12/phase12-task-spec-compliance-check.md`

- 本 phase 配下 7 ファイル（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md 自身）の実体存在チェックリスト
- Phase 11 evidence（curl log / screenshot）は **planned evidence** として spec_created PR の存在チェック対象外
- aiworkflow-requirements current task inventory への登録状態（done）と runtime docs pending の境界

## 不変条件 trace

| 不変条件 | 本 phase での扱い | 反映ファイル |
| --- | --- | --- |
| #5 public/member/admin boundary | implementation-guide の経路図で apps/web→apps/api→D1 のみを記述 | implementation-guide.md |
| #6 apps/web から D1 直接アクセス禁止 | grep 検証手順を記述、smoke でも違反検知可能であることを明示 | implementation-guide.md, system-spec-update-summary.md |
| #8 localStorage / GAS prototype を正本にしない | `/register` 経路で responderUrl のみ参照することを再確認 | implementation-guide.md |
| #14 Cloudflare free-tier | `bash scripts/cf.sh d1 info` で usage 確認可能であることを runbook 反映候補に記載 | system-spec-update-summary.md |

## Issue #273 の取り扱い

- Issue #273 は **CLOSED のまま再オープンしない**
- changelog / PR 本文では `Refs #273` のみ使用、`Closes #273` 不使用
- documentation-changelog.md と Phase 13 の PR 本文でこの方針を明示

## 多角的チェック観点

- 中学生レベル説明が比喩として成立しているか（具体物 = 倉庫 / 鍵 / 試運転）
- 技術者レベル説明が `apps/web` `apps/api` `D1` の 3 層を独立に説明しているか
- system-spec-update-summary が pending と done を分離しているか
- skill feedback / unassigned が 0 件でも出力されているか
- Phase 11 planned evidence と Phase 12 実体ファイルが compliance check で混同されていないか

## サブタスク管理

- [ ] `outputs/phase-12/main.md` を 7 ファイル index として作成
- [ ] `outputs/phase-12/implementation-guide.md` Part 1 / Part 2 を作成
- [ ] `outputs/phase-12/system-spec-update-summary.md` で pending / done を分離
- [ ] `outputs/phase-12/documentation-changelog.md` に 本 PR 追加ファイル一覧を記載
- [ ] `outputs/phase-12/unassigned-task-detection.md` を 0 件でも生成
- [ ] `outputs/phase-12/skill-feedback-report.md` を 改善なしでも生成
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` で 7/7 OK を記録
- [x] aiworkflow-requirements current task inventory 登録 done と runtime docs pending を分離して記録

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 完了条件

- [ ] 7 ファイルが `outputs/phase-12/` 配下に実体存在
- [ ] compliance check が 7/7 OK（Phase 12 ファイルのみ。Phase 11 planned evidence は実行未完として分離）
- [ ] system spec の実更新は workflow inventory 登録 done、runtime runbook 反映は pending（Phase 11 実 smoke 後の別 PR）
- [ ] skill feedback / unassigned detection が 0 件でも出力済み
- [ ] documentation-changelog.md に Phase 1〜13 全ファイルが列挙済み
- [ ] `Refs #273` 表記のみ使用、`Closes #273` 不使用

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスク `06a-followup-001` の復活ではなく VISUAL モード follow-up gate になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ次を引き渡す:

- 7 ファイルの実体 path
- pending / done の境界（system spec 実更新は別 PR）
- documentation-changelog.md の change-summary 抜粋（Phase 13 の PR 本文用）
- `Refs #273` 表記方針
