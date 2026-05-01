# Phase 1 成果物: 要件定義（main）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION |
| Phase | 1 / 13 |
| visualEvidence | NON_VISUAL |
| docsOnly | true |
| GitHub Issue | #287（CLOSED 維持・参照のみ） |
| 作成日 | 2026-05-01 |

## 真の論点（true issue）

「`wrangler.toml` の Pages 形式リテラルを Workers 形式に書き換えること」ではなく、**`apps/web` の deploy topology を ADR で固定し、(1) `CLAUDE.md` のスタック表記述 / (2) `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表 / (3) `apps/web/wrangler.toml` の構文 / (4) `.github/workflows/web-cd.yml` の deploy step の四者参照点を一意化すること** が本質。

四者のいずれか 1 点だけを書き換えると残り 3 点との drift が再発する。本タスクは「決定」を ADR に書くことで参照点を 1 つ追加し、四者すべてが ADR を source of truth として参照する状態を docs-only で確立する。

## visualEvidence 確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は ADR / 判断軸 / 比較表の Markdown のみ。UI / 実 deploy 画面なし |
| 物理形態 | Markdown | `outputs/phase-01/main.md` ほか |
| 検証方法 | grep（Read のみ）/ 表形式レビュー / ADR と判定表の整合突合 | 実 deploy / 実 cutover は対象外 |

`artifacts.json.metadata.visualEvidence` は `NON_VISUAL` 固定済み。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-CICD-DRIFT（親 / docs-only drift 解消完了） | `deployment-gha.md` / `deployment-cloudflare.md` の現行記述 | 実体側（`wrangler.toml` / `web-cd.yml`）との drift 残課題 |
| 並列 | task-impl-opennext-workers-migration-001 | OpenNext Workers 移行実装の起票内容 | 重複/統合 or 棲み分け判断（Phase 3 軸 C で確定） |
| 並列 | UT-GOV-006-web-deploy-target-canonical-sync | web deploy target の canonical sync ガバナンス起票 | 重複/統合 or 棲み分け判断（Phase 3 軸 C で確定） |
| 下流 | （cutover 採択時）apps/web/wrangler.toml 同期 PR タスク | ADR 決定 + 同期 PR テンプレ | Phase 12 で起票指示 |
| 下流 | （cutover 採択時）.github/workflows/web-cd.yml 同期 PR タスク | ADR 決定 + 同期 PR テンプレ | Phase 12 で起票指示 |
| 下流 | deployment-cloudflare.md 判定表更新 | ADR 決定 | Phase 12 documentation-changelog で差分指示 |

## 既存差分の前提（Phase 2 入力）

| 参照点 | 現状の記述・実体 | 差分 | 出典 |
| --- | --- | --- | --- |
| `CLAUDE.md` スタック表 L19 / L37 | `Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)` | Workers 形式を宣言 | プロジェクト直下 `CLAUDE.md` |
| `apps/web/wrangler.toml` L2-9 | `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"` + `binding = "ASSETS"` | **既に Workers 形式に移行済み** | `apps/web/wrangler.toml`（実測 2026-05-01） |
| `.github/workflows/web-cd.yml` L48 / L85 | `command: pages deploy .next --project-name=...` | **依然 Pages deploy 形式**（`wrangler-action@v3` 経由） | `.github/workflows/web-cd.yml`（実測 2026-05-01） |
| `deployment-cloudflare.md` 判定表 L78 | `current facts (UT-CICD-DRIFT / 2026-04-29)`: 「`apps/web/wrangler.toml` は Pages 形式」 | **陳腐化（2 日遅れ）**。実体は Workers 形式 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |

> **[Phase 1 注記]** 2026-04-29 時点では四者すべてが drift していたが、2026-05-01 時点で **`wrangler.toml` は Workers 形式に既に切り替わっている**。残る drift は (a) `web-cd.yml` の `pages deploy` 系 step / (b) `deployment-cloudflare.md` 判定表の `current facts` 表記の 2 点に縮小。CLAUDE.md と wrangler.toml は既に整合。

## 苦戦箇所（必須 5 件）

1. **三者整合の崩壊（wrangler.toml / web-cd.yml / Cloudflare 側）**: cutover 判定を急いで 1 ファイルだけ更新すると残り 2 ファイル + Cloudflare 側 project / script との不整合で deploy 失敗。本 ADR は「三者を同期させる別タスク必須」を明示する。
2. **不変条件 #5 への抵触リスク**: 「Workers なら D1 binding を直接書ける」と判断して `apps/web/wrangler.toml` に `[[d1_databases]]` を追加すると不変条件 #5 違反。ADR Consequences で「Workers 形式 cutover 後も apps/web に D1 binding を置かない（apps/api 経由のみ）」を必須記載。
3. **重複起票リスク**: 本タスク / `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync` が同一 ADR 決定を多重に書き込むと source of truth 分裂。Phase 3 軸 C で「本 ADR = 決定 / migration-001 = 実 cutover / UT-GOV-006 = canonical sync ガバナンス」の責務分離を確定する。
4. **`@opennextjs/cloudflare` バージョン互換不確定**: 現行 `1.19.4`（`apps/web/package.json`）で Workers 形式が動いている既成事実があるが、メジャーアップデート時の破壊的変更は ADR Consequences で再評価対象として明示。
5. **保留判断の継続維持コスト看過**: 「保留」を選ぶ場合、CLAUDE.md と wrangler.toml の表現乖離は残らないが、`web-cd.yml` の `pages deploy` 経路維持と `deployment-cloudflare.md` 判定表の整合補正コストは別タスクで発生する。「保留 = 何もしない」ではない。

## 価値とコスト

- **価値**: 四者参照点の drift を ADR 起票（docs-only）で根本解消する経路を確立。`task-impl-opennext-workers-migration-001` の着手判断が線形化。CLAUDE.md と現実体の表現乖離が AI コンテキストへ与える誤誘導リスクを低減。
- **コスト**: 文書化のみ。Phase 2-3 の ADR ドラフト + 判断軸検討時間が主コスト。実コードに触らないため revert コストはゼロ。
- **機会コスト**: 本タスクを skip して `migration-001` が先行すると、ADR 不在のまま `web-cd.yml` 書き換えが起票され、判断軸の記録が失われる。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 四者参照点の drift を ADR 起票で根本解消し、後続 cutover タスクの判断軸を線形化できる。docs-only で最小コスト |
| 実現性 | PASS | Read / Grep による既存 4 者参照点抽出と Markdown 起票のみで完結。CLI / wrangler / migration 実行は不要 |
| 整合性 | PASS | 不変条件 #5（apps/web に D1 binding を置かない）/ #6（GAS 関連影響なし）に沿う設計が可能。`migration-001` / `UT-GOV-006` との責務分離も Phase 3 軸 C で確定可能 |
| 運用性 | PASS | ADR が source of truth となり、judgment table / CLAUDE.md / wrangler.toml / web-cd.yml の四者は ADR を参照する形に揃う。AC を index.md と完全一致で固定するため Phase 2 以降の判断ブレなし |

## 受入条件（AC）

index.md と完全一致。

- [ ] AC-1: ADR が `docs/00-getting-started-manual/specs/` 配下、または該当 ADR ディレクトリに起票される
- [ ] AC-2: 決定（cutover / 保留）が `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表に反映される（更新差分の指示が文書化）
- [ ] AC-3: cutover 決定時は `apps/web/wrangler.toml` / `.github/workflows/web-cd.yml` の同期 PR タスク仕様（別タスク）が起票される
- [ ] AC-4: 不変条件 #5（D1 への直接アクセスは apps/api に閉じる）抵触なし
- [ ] AC-5: `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync` との重複/統合判断が明示される
- [ ] AC-6: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS で根拠付き
- [ ] AC-7: Phase 12 で canonical 7 ファイルが揃う

## 関連タスク責務分離 3 列対比表

| 軸 | 本タスク（UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION） | task-impl-opennext-workers-migration-001 | UT-GOV-006-web-deploy-target-canonical-sync |
| --- | --- | --- | --- |
| 責務 | ADR 起票（決定確定） | 実 cutover（wrangler.toml / web-cd.yml の実書き換え） | canonical sync ガバナンス（正本 doc 1 本化） |
| 出力 | ADR + 判定表更新指示 | コード差分（wrangler.toml / web-cd.yml / `.open-next/` 配信化） | canonical document 単一化 + 参照リンク集約 |
| taskType | docs-only | implementation | docs / governance |
| 本タスクからの依存 | source of truth として上流 | blocks（本タスクが先行） | related（本タスク ADR を canonical sync 対象に追加） |

## 不変条件への影響

| # | 不変条件 | 取り扱い |
| --- | --- | --- |
| 5 | D1 への直接アクセスは `apps/api` に閉じる | ADR Decision 内で「cutover 採択後も `apps/web/wrangler.toml` に `[[d1_databases]]` を追加しない」を Consequences に必須記載 |
| 6 | GAS prototype を本番昇格しない | 本タスクは Cloudflare deploy target の判断のみ。GAS 関連影響なし（明示） |

## 完了条件チェックリスト

- [x] artifacts.json.metadata.visualEvidence が `NON_VISUAL`
- [x] 真の論点が「四者参照点を ADR で一意化」に再定義
- [x] 4 条件評価が全 PASS で根拠付き
- [x] 依存境界表に上流 1 / 並列 2 / 下流 3 すべて記述
- [x] 既存差分前提表が出典付きで記述
- [x] 苦戦箇所 5 件が明示
- [x] AC-1〜AC-7 が index.md と完全一致
- [x] 不変条件 #5 / #6 への影響方針が示されている

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - ADR ドラフト & 判断軸）
- 引き継ぎ事項:
  - 真の論点 = 四者参照点を ADR で一意化
  - 既存差分前提表（**2026-05-01 実測**: wrangler.toml は Workers 形式に既に移行済み。残 drift は web-cd.yml と判定表 current facts）
  - 苦戦箇所 5 件
  - 関連タスク責務分離 3 列対比表
  - 不変条件 #5 / #6 を満たす設計上の制約
