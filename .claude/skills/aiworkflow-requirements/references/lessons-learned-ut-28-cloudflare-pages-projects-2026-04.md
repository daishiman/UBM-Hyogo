# Lessons Learned — UT-28 Cloudflare Pages Projects Creation (Phase 12 close-out)

> 2026-04-29 新規作成: UT-28 Cloudflare Pages production / staging 2 プロジェクト作成タスクの Phase 12 close-out 苦戦箇所を分離記録する。`lessons-learned.md` hub にエントリを追加し、parent に直接追記しない（child companion 方針）。
> 関連: `references/deployment-cloudflare.md`（§UT-28 Cloudflare Pages project creation contract）/ `references/deployment-gha.md`（`CLOUDFLARE_PAGES_PROJECT` semantics）/ `references/deployment-secrets-management.md`（base project 名のみ保持）/ `indexes/quick-reference.md`（§UT-28 Cloudflare Pages Projects Creation）/ `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/`
> 出典: `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/`（implementation-guide / system-spec-update-summary / skill-feedback-report / unassigned-task-detection）

---

## L-UT28-001: `production_branch` 逆配線で本番が preview 化する事故を防ぐ

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | deployment / Cloudflare Pages / branch wiring |
| 症状       | `ubm-hyogo-web` の `production_branch` を `dev` に、`ubm-hyogo-web-staging` を `main` に設定すると、production プロジェクトが preview デプロイ扱い、staging が本番扱いになり、URL は同じまま意味だけが反転する |
| 原因       | Cloudflare Pages は `production_branch` をプロジェクト単位で 1 本しか持たず、Web UI では入れ替えに気付きにくい。命名 (`-staging` suffix) と branch の対応は **契約として別管理**しないとどちらが正しいか CI から判定できない |
| 解決策     | UT-28 の canonical contract を `deployment-cloudflare.md` で固定: production=`ubm-hyogo-web` + `production_branch=main`、staging=`ubm-hyogo-web-staging` + `production_branch=dev`。`pages project create` 実行時に `--production-branch` を必ず明示し、後から手動編集しない |
| 再発防止   | Phase 13 apply-runbook に `pages project list` の出力差分チェックを必須化し、`production_branch` 列が想定と一致することをログ証跡として残す。Pages Dashboard の手動編集 drift は UT-29 post-CD smoke で再検出する |
| 関連タスク | UT-28 / Phase 12 implementation-guide §Edge Cases / Phase 13 apply-runbook |

## L-UT28-002: GitHub Variable には base name のみ保持し、`-staging` suffix は workflow 側で derive する

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | CI/CD / GitHub Actions / variable contract |
| 症状       | `CLOUDFLARE_PAGES_PROJECT=ubm-hyogo-web-staging` を誤って Variable に書くと、staging job が `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` を評価して `ubm-hyogo-web-staging-staging` を生成し、存在しないプロジェクトに deploy 試行する |
| 原因       | Variable に環境別 suffix を含めるか、workflow 側で suffix 連結するか、選択を後者に固定しないと両側で文字列を組み立てる二重定義になる |
| 解決策     | Variable は **production base name のみ** (`ubm-hyogo-web`) を保持し、`web-cd.yml` の staging job が `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` の式で derive する。production job は無修飾でそのまま使う。`deployment-gha.md` / `deployment-secrets-management.md` 双方にこの規約を明記する |
| 再発防止   | UT-27（GitHub Secrets / Variables placement）受け入れ時、value が `-staging` suffix を含む場合は ❌ で reject。CI 側に Variable validation step を入れる選択肢は UT-27 のスコープに分離 |
| 関連タスク | UT-28 / UT-27 / `references/deployment-gha.md` / `references/deployment-secrets-management.md` |

## L-UT28-003: Pages Git Integration を OFF に固定し、deploy initiator を GitHub Actions に一本化する

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | deployment / dual-source guard / observability |
| 症状       | Pages の Git Integration が ON のまま GitHub Actions も deploy すると、同じ commit が二重に deploy 対象になり、どちらの run がライブを更新したかログから一意に決まらない。rollback 対象が曖昧になる |
| 原因       | Cloudflare Pages のデフォルト挙動は Git Integration ON で、プロジェクト作成時に明示 OFF にしないと CI 経路と並走する。CI 側だけ整備しても Pages 側の挙動を上書きしない |
| 解決策     | `pages project create` 完了直後に Git Integration を OFF にし、`deployment-cloudflare.md` の UT-28 contract に「GitHub Actions only / Pages Git Integration OFF」を明記。Phase 13 apply-runbook で Dashboard の Integration セクションが OFF であることを smoke 前提条件に組み込む |
| 再発防止   | UT-29 post-CD smoke で `wrangler pages deployment list` の `source` 列を確認し、`ci` 以外の値（`git`）が出たら fail close。drift 検出は同 smoke の責務とする |
| 関連タスク | UT-28 / UT-29 / Phase 12 implementation-guide §Edge Cases |

## L-UT28-004: `compatibility_date` と `compatibility_flags` を Pages / Workers で同一値に固定する

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | runtime contract / Cloudflare Workers / Pages |
| 症状       | `apps/api/wrangler.toml` の `compatibility_date` を bump しても Pages 側に反映していないと、API と Web のランタイム挙動 (Node.js 互換 API、Web Crypto の挙動) が分裂し、再現困難な regression が発生する |
| 原因       | Pages の `compatibility_date` は Workers と独立した設定で、CI / CD で同期する仕組みがないと手動 drift する |
| 解決策     | UT-28 contract で `compatibility_date=2025-01-01` / `compatibility_flags=["nodejs_compat"]` を `apps/api/wrangler.toml` と Pages 双方で固定し、`deployment-cloudflare.md` の bump SOP セクションに「両方を同 wave で更新」を明記 |
| 再発防止   | `apps/api/wrangler.toml` の `compatibility_date` を変更する PR は、Pages の同期を Phase 13 apply-runbook で必須項目化。01b Cloudflare base bootstrap の手順にも `compatibility_date` 同期確認を追記する派生タスクを残す |
| 関連タスク | UT-28 / 01b / `apps/api/wrangler.toml` / `references/deployment-cloudflare.md` |

## L-UT28-005: OpenNext output-form 不整合は UT-28 で patch せず、UT-05 / OpenNext migration task に link する

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | scope discipline / blocker handoff / OpenNext |
| 症状       | UT-28 の Phase 11 NON_VISUAL smoke で `pages_build_output_dir = ".next"` と OpenNext Workers contract (`.open-next/assets` + `_worker.js`) のミスマッチを検出すると、UT-28 で fix したくなるが、それは OpenNext 全体の output 形式判定を巻き込み、UT-28 の 単一責務（プロジェクト作成）から逸脱する |
| 原因       | Pages プロジェクト作成と OpenNext deploy 形式判定は別タスク階層。UT-28 で混ぜると UT-05 / `task-impl-opennext-workers-migration-001` の責務境界が崩れ、判定根拠が分散する |
| 解決策     | UT-28 Phase 12 unassigned-task-detection で「既存タスクで吸収」と明記し、`docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` と `UT-GOV-006-web-deploy-target-canonical-sync.md` に block 関係を link。UT-28 自体は spec_created / Phase 13 user approval gate のままとし、real apply は OpenNext 判定が決まってから |
| 再発防止   | Phase 12 unassigned-task-detection の Four Design-Task Pattern Check で「Existing task can absorb finding」を最初に評価する流れを implementation-guide Part 2 に明記。新規タスク化は最後の手段 |
| 関連タスク | UT-28 / UT-05 / `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` / `docs/30-workflows/unassigned-task/UT-GOV-006-web-deploy-target-canonical-sync.md` |

---

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` — UT-28 Cloudflare Pages project creation contract（命名 / branch / compatibility / Git Integration OFF / OpenNext blocker）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` — `CLOUDFLARE_PAGES_PROJECT` Variable semantics と staging suffix derivation
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` — production base project name 保持の方針
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` — §UT-28 Cloudflare Pages Projects Creation 早見
- `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-10/handoff-to-ut27.md` — UT-27 への Variable handoff
- `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/implementation-guide.md` — Part 1 中学生レベル / Part 2 Technical Detail / Edge Cases
- `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-13/apply-runbook.md` — real `pages project create` と smoke の Phase 13 ゲート
