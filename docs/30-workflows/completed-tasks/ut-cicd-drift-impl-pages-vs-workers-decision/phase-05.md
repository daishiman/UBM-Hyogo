# Phase 5: 仕様 runbook 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook 作成（ADR 本文 + 関連 doc 更新手順） |
| 作成日 | 2026-05-01 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 3 で確定した base case（cutover / 保留 / 段階移行 のいずれか）と Phase 2 の ADR ドラフトを基に、(1) ADR 本文を Phase 3 決定の配置先（軸 B 採択結果）に書き起こす runbook、(2) `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表「現状 / 将来」列の更新手順、(3) `CLAUDE.md` の `@opennextjs/cloudflare` 記述を ADR Decision に整合させる手順、(4) cutover 採択時のみ `task-impl-opennext-workers-migration-001` 連動タスクへ引き継ぐ stub 仕様を、再実行可能な手順書として確定する。本 Phase 自体は手順の **記述** のみで、実 doc 更新は Phase 12 documentation-changelog の指示として畳み込む。

## ADR 本文 runbook

### Step 1: 配置先確認

```bash
# Phase 3 軸 B 結果に従い配置先を確認
ls docs/00-getting-started-manual/specs/adr/ 2>/dev/null || mkdir -p docs/00-getting-started-manual/specs/adr/
```

### Step 2: ADR ファイル雛形を生成

ファイル名規約: `NNNN-pages-vs-workers-deploy-target.md`（NNNN は既存 ADR 連番の次番。Phase 3 軸 B で確定）。

セクション構成（MADR 簡略形式）:

| セクション | 必須内容 | 出典 |
| --- | --- | --- |
| Title | `Pages vs Workers deploy target for apps/web` | - |
| Status | `Accepted`（base case 確定済みのため） | Phase 3 結果 |
| Context | drift 4 ファイル（wrangler.toml / web-cd.yml / deployment-cloudflare.md / CLAUDE.md）の現状記述差分 + Issue #287 背景 | Phase 1 既存差分前提 + Phase 4 検証コマンド #1 結果 |
| Decision | 採択案（cutover / 保留 / 段階移行）+ 採択理由（4 条件 + 6 判断軸の主要根拠） | Phase 3 base case |
| Consequences | (a) 即時影響、(b) 別タスク委譲事項、(c) 不変条件 #5 維持の明文化、(d) `@opennextjs/cloudflare` バージョン互換前提 | Phase 2 cutover-vs-hold-comparison.md + Phase 3 残課題 |
| Related | task-impl-opennext-workers-migration-001（実 cutover）/ UT-GOV-006-web-deploy-target-canonical-sync（canonical sync）/ Refs #287 | Phase 1 関連タスク表 |

### Step 3: ADR レビューチェックリスト 7 項目（Phase 4）を満たすか確認

`outputs/phase-04/doc-consistency-checks.md` のチェックリストを ADR 本文に対し走らせる。FAIL 1 件でも残れば Phase 6（異常系）に格下げで処理せず Phase 5 内で修正完結。

## deployment-cloudflare.md 判定表 更新手順

| Step | 操作 | 期待差分 |
| --- | --- | --- |
| 1 | 「現状（YYYY-MM-DD）」列の更新 | base case が cutover なら Workers 形式に確定。保留なら Pages 形式維持を明記 |
| 2 | 「将来」列の更新 | base case が cutover/段階移行なら「将来は Workers 完全移行」を維持。保留なら「将来計画なし」または「再検討時期」を明記 |
| 3 | 判定根拠列に ADR への参照リンクを追加 | `→ docs/00-getting-started-manual/specs/adr/NNNN-pages-vs-workers-deploy-target.md` |
| 4 | 更新日カラムを 2026-05-01 に更新 | - |

## CLAUDE.md 更新手順

base case ごとの差分を明示する。

| base case | CLAUDE.md スタック表「Web UI」行の更新 | 補足記述 |
| --- | --- | --- |
| cutover | 既存記述「Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`」を維持 | 不変条件セクションに「cutover 後も apps/web に `[[d1_databases]]` を追加しない」追記 |
| 保留 | 「Cloudflare Pages + Next.js App Router」へ修正、`@opennextjs/cloudflare` 記述は「将来仕様（保留）」に格下げ | 「将来仕様」化の根拠として ADR リンクを記載 |
| 段階移行 | dev/production 環境別の表記に分割 | 環境差分の運用注意を追記 |

## cutover 採択時のみ: 連動タスク stub

cutover を採択した場合、本 Phase 5 で以下の別タスク仕様 stub を **記述のみ**生成し（起票は Phase 12 documentation-changelog の `unassigned-task-detection.md` で行う）：

| stub | 担当タスク | 内容概要 |
| --- | --- | --- |
| stub-1 | task-impl-opennext-workers-migration-001 | `apps/web/wrangler.toml` の Pages 形式 → Workers 形式書き換え + `[assets]` binding 追加 |
| stub-2 | task-impl-opennext-workers-migration-001（同タスクで吸収可） | `.github/workflows/web-cd.yml` の `wrangler pages deploy` → `wrangler deploy` 切替 |
| stub-3 | 別タスク（手動 runbook） | Cloudflare ダッシュボード上の Pages project → Workers script 切替手順 |

## 完了条件チェックリスト

- [ ] ADR 本文 runbook が 3 Step（配置先確認 / 雛形生成 / レビュー）で完結
- [ ] ADR セクション構成（Title / Status / Context / Decision / Consequences / Related）が表化
- [ ] deployment-cloudflare.md 判定表更新 4 Step が記述
- [ ] CLAUDE.md 更新が base case 3 ケース（cutover / 保留 / 段階移行）すべてに対応
- [ ] cutover 採択時の連動タスク stub 3 件が列挙
- [ ] Phase 4 レビューチェックリスト 7 項目を ADR 本文に走らせる手順が含まれる
- [ ] 不変条件 #5 維持の明文化が ADR Consequences に必須化されている

## 実行タスク

1. `outputs/phase-05/adr-runbook.md` に Step 1-3 + ADR セクション構成表を記述。
2. `outputs/phase-05/doc-update-procedure.md` に判定表更新手順 + CLAUDE.md 更新手順 + 連動タスク stub を記述。
3. base case 3 パターンの差分が doc-update-procedure.md で同一形式の表で記述されていることを確認。
4. cutover 採択時のみ生成される stub が「Phase 12 で起票」と明記されていることを確認。

## 多角的チェック観点

- **再実行性**: runbook は Phase 9 / Phase 11 で再走査され、同じ手順で同じ結果が得られること。
- **base case 非依存記述**: doc-update-procedure.md の表は cutover / 保留 / 段階移行 すべてに分岐記述があり、base case 確定前でも雛形として完成していること。
- **不変条件 #5 必須化**: ADR Consequences の「`[[d1_databases]]` を apps/web に追加しない」記述が **任意** ではなく **必須** として書かれていること。
- **`Refs #287` 強制**: ADR 本文 Related セクションに `Closes #287` を書かない（Issue は CLOSED 維持のため）。
- **stub の起票委譲**: cutover stub の実起票は Phase 12 の `unassigned-task-detection.md` で実施することが明示されていること（Phase 5 で起票しない）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | ADR 本文 runbook 3 Step 記述 | 5 | pending |
| 2 | ADR セクション構成表（6 セクション）記述 | 5 | pending |
| 3 | 判定表更新 4 Step 記述 | 5 | pending |
| 4 | CLAUDE.md 更新 base case 3 ケース対応 | 5 | pending |
| 5 | cutover 連動タスク stub 3 件記述 | 5 | pending |
| 6 | Phase 4 レビューチェックリスト走査手順の組み込み | 5 | pending |
| 7 | 不変条件 #5 必須化を Consequences に固定 | 5 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/adr-runbook.md | ADR 本文作成 runbook + セクション構成表 |
| ドキュメント | outputs/phase-05/doc-update-procedure.md | 判定表 / CLAUDE.md 更新手順 + 連動タスク stub |
| メタ | artifacts.json | Phase 5 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- ADR 本文 runbook が 3 Step で記述
- 判定表更新 4 Step が記述
- CLAUDE.md 更新が base case 3 ケース対応
- cutover stub 3 件が記述
- 不変条件 #5 必須化が Consequences に固定
- artifacts.json の `phases[4].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 6（異常系 / 落とし穴）
- 引き継ぎ事項:
  - ADR 本文 runbook（Phase 6 で異常系を ADR Consequences に追補）
  - 判定表 / CLAUDE.md 更新手順（Phase 12 で実施）
  - cutover 連動タスク stub（Phase 12 で起票）
  - Phase 4 レビューチェックリスト走査手順
- ブロック条件:
  - ADR セクション構成に Status / Decision / Consequences のいずれかが欠落
  - 不変条件 #5 必須化が任意項目に降格
  - cutover stub が Phase 5 で起票指示されている（Phase 12 が正）
  - `Closes #287` が runbook に混入

## 参照資料

- `outputs/phase-02/adr-draft.md`
- `outputs/phase-04/doc-consistency-checks.md`
- `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`

## 統合テスト連携

ADR 起票 runbook のため統合テスト追加は行わない。CLI / deploy smoke は migration task で実施する。
