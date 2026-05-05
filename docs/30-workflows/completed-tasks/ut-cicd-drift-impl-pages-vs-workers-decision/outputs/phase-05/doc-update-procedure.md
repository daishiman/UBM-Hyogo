# Phase 5 成果物: 関連 doc 更新手順

> base case = 案 X (cutover) で確定（Phase 3）。各 base case 別の差分は表化して残す（runbook の base case 非依存化）。

## A. `deployment-cloudflare.md` 判定表更新手順

| Step | 操作 | 期待差分 |
| --- | --- | --- |
| 1 | 「現状（YYYY-MM-DD）」列を `2026-05-01` で更新 | `apps/web/wrangler.toml` は **Workers 形式（`main = ".open-next/worker.js"` + `[assets]`）に移行済** と表記 |
| 2 | 「将来」列を更新 | cutover 進行中：`web-cd.yml` の `wrangler deploy --env <env>` 切替および Cloudflare side Pages project → Workers script 切替が残作業（`task-impl-opennext-workers-migration-001`） |
| 3 | 判定根拠列に ADR 参照リンクを追加 | `→ docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` |
| 4 | 更新日カラムを `2026-05-01` に更新 | - |

該当箇所:
- L41-42 / L78 / L84-85 / L443 / L453（`outputs/phase-02/decision-criteria.md` 現状スナップショット参照）

## B. `CLAUDE.md` 更新手順

| base case | スタック表「Web UI」行（L19）の更新 | 補足記述 |
| --- | --- | --- |
| **cutover（base case）** | 既存記述「`Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)`」を **維持**（変更不要） | 不変条件セクションへの追記は不要（既に「`apps/web/` は Cloudflare Workers」表記済 L37）。ADR 参照リンクの脚注追加は任意 |
| 保留（参考） | `Cloudflare Pages + Next.js App Router` へ修正、`@opennextjs/cloudflare` 記述を将来仕様に格下げ | 「将来仕様」根拠として ADR リンク必須 |
| 段階移行（参考） | dev / production 環境別の表記に分割 | 環境差分の運用注意 |

**cutover 採択につき、本タスクでは CLAUDE.md は変更不要**（ADR 参照脚注追加は任意改善）。

## C. cutover 採択時の連動タスク stub（記述のみ・実起票は Phase 12）

| stub | 担当タスク | 内容概要 |
| --- | --- | --- |
| stub-1 | `task-impl-opennext-workers-migration-001`（既起票済 unassigned-task） | `.github/workflows/web-cd.yml` の `command: pages deploy .next ...` → `command: deploy --env <env>` 置換（staging/production 両 job） |
| stub-2 | （stub-1 と同一タスクで吸収可） | wranglerVersion / workingDirectory / secrets / variables の再配線確認 |
| stub-3 | 別タスク（手動 runbook） | Cloudflare ダッシュボード上の Pages project (`CLOUDFLARE_PAGES_PROJECT`) → Workers script への切替手順 + dev/main の DNS / カスタムドメイン整合 |

> stub の **実起票は Phase 12** `unassigned-task-detection.md` で実施。Phase 5 では記述のみ。

## D. 不変条件 #5 必須化（Consequences への固定）

ADR Consequences セクションに以下を **必須**項目として記載：

> `apps/web/wrangler.toml` に `[[d1_databases]]` セクションを追加してはならない。Cloudflare Workers 形式 cutover 後も apps/web から D1 への直接アクセスは禁止し、`apps/api` 経由のみとする。Phase 4 検証コマンド #3 で Phase 9 / Phase 11 / 後続タスク全 Phase で再実行確認。

## E. Refs vs Closes の運用

| 項目 | 値 |
| --- | --- |
| Issue #287 状態 | CLOSED（維持） |
| ADR 本文内 Issue 参照 | `Refs #287` のみ |
| commit メッセージ | `Refs #287` のみ |
| PR description | `Refs #287` のみ |
| 禁止 | `Closes #287` 形式の使用（Issue は CLOSED 維持・reopen ループ回避） |

## 完了確認

- [x] 判定表更新 4 Step
- [x] CLAUDE.md 更新 base case 3 ケース対応（cutover は変更不要を確認）
- [x] cutover 連動タスク stub 3 件
- [x] 不変条件 #5 必須化 Consequences 固定
- [x] `Closes #287` 禁止 / `Refs #287` 強制
- [x] stub の実起票は Phase 12 `unassigned-task-detection.md` で実施を明記
