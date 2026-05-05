# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| Wave | 1 |
| 実行種別 | parallel（task-impl-opennext-workers-migration-001 / UT-GOV-006 と並列着手可能） |
| 前 Phase | なし |
| 次 Phase | 2（設計 - ADR ドラフト & 判断軸） |
| 状態 | spec_created |
| タスク分類 | docs-only（ADR 起票の文書化のみ。コード変更なし） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #287（CLOSED 維持・参照のみ） |
| 親タスク | UT-CICD-DRIFT（docs-only drift 解消は完了） |

## 目的

`apps/web` の deploy topology（Cloudflare Pages 形式 vs Cloudflare Workers + OpenNext 形式）の決定を ADR として固定するため、Phase 2 で代替案比較が一意に絞れる粒度の入力（真の論点 / 既存 4 者参照点の差分 / 判断軸 / 苦戦箇所 / 4 条件評価 / AC）を作成する。本 Phase は決定そのものを行わず、Phase 2 の ADR ドラフトが基づくべき制約と論点を文書化することに徹する。

## 真の論点 (true issue)

「`wrangler.toml` の Pages 形式リテラルを Workers 形式（`main = ".open-next/worker.js"` + `[assets]` binding）に書き換えること」ではない。本タスクの本質は **`apps/web` の deploy topology を ADR で固定し、(1) `CLAUDE.md` のスタック表記述 / (2) `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表 / (3) `apps/web/wrangler.toml` の構文 / (4) `.github/workflows/web-cd.yml` の deploy step の四者参照点を一意化すること** にある。

四者のうちいずれか 1 点だけを書き換えると、残り 3 点との drift が再発する。本タスクは「決定」を ADR に書くことで参照点を 1 つ追加し、四者すべてが ADR を source of truth として参照する状態を docs-only で確立する。実書き換えは別タスク。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は ADR / 判断軸 / 比較表の Markdown のみ。UI スクリーンショット・実 deploy 画面なし |
| 成果物の物理形態 | テキスト（Markdown） | `outputs/phase-01/main.md` ほか |
| 検証方法 | 既存 4 者参照点の grep（Read のみ）/ 表形式レビュー / ADR と判定表の整合突合 | 実 deploy・実 cutover は対象外 |

artifacts.json の `metadata.visualEvidence` は `NON_VISUAL` で固定済み。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-CICD-DRIFT（親 / docs-only drift 解消完了） | `deployment-gha.md` / `deployment-cloudflare.md` の現行記述 | 実体側（`wrangler.toml` / `web-cd.yml`）との drift 残課題 |
| 並列 | task-impl-opennext-workers-migration-001 | OpenNext Workers 移行実装の起票内容 | 重複/統合 or 棲み分け判断（Phase 3 で確定） |
| 並列 | UT-GOV-006-web-deploy-target-canonical-sync | web deploy target の canonical sync ガバナンス起票 | 重複/統合 or 棲み分け判断（Phase 3 で確定） |
| 下流 | （cutover 決定時）apps/web/wrangler.toml 同期 PR タスク | ADR 決定 + 同期 PR タスクテンプレ | 別タスクとして起票（本タスクでは仕様書のみ） |
| 下流 | （cutover 決定時）.github/workflows/web-cd.yml 同期 PR タスク | ADR 決定 + 同期 PR タスクテンプレ | 別タスクとして起票（本タスクでは仕様書のみ） |
| 下流 | deployment-cloudflare.md 判定表更新 | ADR 決定 | 判定表差分の指示（本タスク Phase 12 で記述） |

## 既存差分の前提（Phase 2 入力）

| 参照点 | 現状の記述・実体 | 差分 | 出典 |
| --- | --- | --- | --- |
| `CLAUDE.md` スタック表 | `Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)` | Workers 形式を宣言 | プロジェクト直下 `CLAUDE.md` |
| `apps/web/wrangler.toml` | `pages_build_output_dir = ".next"`（Pages 形式） | Pages 形式の実体 | `apps/web/wrangler.toml` |
| `.github/workflows/web-cd.yml` | `wrangler pages deploy` 系の deploy step | Pages 形式の deploy 経路 | `.github/workflows/web-cd.yml` |
| `deployment-cloudflare.md` 判定表 | Pages / Workers の両論併記（決定なし） | 決定の不在 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |

CLAUDE.md は Workers 宣言、wrangler.toml / web-cd.yml は Pages 実体、judgment table は両論併記 — この三者ねじれの解消が本タスクの帰結。

## 苦戦箇所【記入必須】

deploy target の判断は単独設定ファイルの書き換え問題ではなく、四者参照点 + Cloudflare 側 project / script + 関連起票タスクとの整合問題である。Phase 2 が見落とした場合の事故シナリオを 5 件明示する。

1. **三者整合の崩壊（wrangler.toml / web-cd.yml / Cloudflare ダッシュボード）**: cutover 判定を急いで `wrangler.toml` のみ Workers 形式に書き換えると、`web-cd.yml` は依然 `wrangler pages deploy` を呼び、Cloudflare 側は Pages project のままで deploy が静かに失敗する（Pages project に Workers script を流す mismatch）。本 ADR は「三者を同期させる別タスクが必須」と明示する必要がある。
2. **不変条件 #5 への抵触リスク**: `apps/web` cutover 時に「Workers なら D1 binding を直接書ける」と判断して `[[d1_databases]]` を `apps/web/wrangler.toml` に追加すると、apps/web から D1 直接アクセス可能になり不変条件 #5 が破れる。ADR で「Workers 形式 cutover 時も apps/web には D1 binding を置かない（apps/api 経由のみ）」を明記する必要がある。
3. **重複起票リスク（task-impl-opennext-workers-migration-001 / UT-GOV-006）**: 本タスクと両者が重複定義されると、ADR が複数経路で書かれ「どの ADR が最新か」の drift が再発する。Phase 3 ゲートで「本タスク = ADR 起票 / task-impl-opennext-workers-migration-001 = 実 cutover / UT-GOV-006 = canonical sync ガバナンス」の責務分離を明示確定する必要がある。
4. **`@opennextjs/cloudflare` バージョン互換不確定**: Workers cutover 案を ADR で採るには、`@opennextjs/cloudflare` の現行バージョンが Next.js App Router / 既存 middleware / 静的アセット配信を本プロジェクト構成で動かせるかを Phase 2 で確認する必要がある。確認なしで採択するとロールバック工程が肥大化する。
5. **保留判断の継続維持コスト看過**: 「保留」を選ぶ場合でも、CLAUDE.md と wrangler.toml の文言乖離は残る。保留を ADR で正当化するには「CLAUDE.md スタック表現を Pages 表記に修正する」or「judgment table で Pages を canonical と宣言する」のいずれかを別タスクとして起票せねばならず、保留 = 何もしないではない点を Phase 2 で言語化する必要がある。

## 価値とコスト

- 価値: 四者参照点の drift を ADR 起票（docs-only）で根本解消する経路を確立。`task-impl-opennext-workers-migration-001` の着手判断が線形化される。CLAUDE.md と現実体の表現乖離が AI コンテキストへ与える誤誘導リスクを低減。
- コスト: 文書化のみ。Phase 2-3 の ADR ドラフト + 判断軸検討時間が主コスト。実コードに触らないため revert コストはゼロ。
- 機会コスト: 本タスクを skip して `task-impl-opennext-workers-migration-001` が先行すると、ADR 不在のまま `wrangler.toml` 書き換えが起票され、判断軸の記録が失われる。後年「なぜ Workers にしたか / Pages のままにしたか」が再議論される。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 四者参照点の drift を ADR 起票で根本解消し、後続 cutover タスクの判断軸を線形化できる。docs-only で最小コスト |
| 実現性 | PASS | Read / Grep による既存 4 者参照点抽出と Markdown 起票のみで完結。CLI / wrangler / migration 実行は不要 |
| 整合性 | PASS | 不変条件 #5（apps/web に D1 binding を置かない）/ #6（GAS 関連影響なし）に沿う設計が可能。`task-impl-opennext-workers-migration-001` / `UT-GOV-006` との責務分離も Phase 3 で確定可能 |
| 運用性 | PASS | ADR が source of truth となり、judgment table / CLAUDE.md / wrangler.toml / web-cd.yml の四者は ADR を参照する形に揃う。本 Phase で AC を index.md と完全一致で固定するため Phase 2 以降の判断ブレがない |

## 受入条件（AC）

index.md と完全一致。

- [ ] AC-1: ADR が `docs/00-getting-started-manual/specs/` 配下、または該当 ADR ディレクトリに起票される
- [ ] AC-2: 決定（cutover / 保留）が `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表に反映される
- [ ] AC-3: cutover 決定時は `apps/web/wrangler.toml` / `.github/workflows/web-cd.yml` の同期 PR タスク仕様（別タスク）が起票される
- [ ] AC-4: 不変条件 #5（D1 への直接アクセスは apps/api に閉じる）抵触なし
- [ ] AC-5: `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync` との重複/統合判断が明示される
- [ ] AC-6: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS で根拠付き
- [ ] AC-7: Phase 12 で canonical 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が揃う

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence が `NON_VISUAL` で固定確認済み
- [ ] 真の論点が「wrangler.toml 書き換え」ではなく「四者参照点を ADR で一意化」に再定義されている
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 1 / 並列 2 / 下流 3 すべて前提と出力付きで記述
- [ ] 既存差分前提表（CLAUDE.md / wrangler.toml / web-cd.yml / judgment table）が出典付きで記述
- [ ] 苦戦箇所 5 件（三者整合 / 不変条件 #5 / 重複起票 / @opennextjs/cloudflare 互換 / 保留維持コスト）が明示
- [ ] AC-1〜AC-7 が index.md と完全一致
- [ ] 不変条件 #5 / #6 への影響方針が示されている

## 実行手順

### ステップ 1: 親タスク UT-CICD-DRIFT 仕様の写経確認

- 親タスクの完了済み成果物（`deployment-gha.md` / `deployment-cloudflare.md` の docs-only drift 解消結果）を Read し、本タスクが残課題（実体側 drift）の正しい後継であることを確認する。
- 齟齬があれば本 Phase 仕様を親タスク成果物に合わせる。

### ステップ 2: 既存 4 者参照点の grep 範囲の確定

Phase 2 で以下のコマンド相当の検証を実施する旨を引き継ぐ。

```
rg -n "pages_build_output_dir|^main\s*=|\[assets\]|wrangler deploy|pages deploy" \
  apps/web/wrangler.toml \
  .github/workflows/web-cd.yml \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
```

- 出力結果は `outputs/phase-02/decision-criteria.md` の冒頭に「現状スナップショット」として固定する。
- CLAUDE.md スタック表現も Read で抽出（gp-rep でなく Read で原文確認）。

### ステップ 3: 関連タスク 2 件との責務分離の言語化

- `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync` の起票文書を Read し、本タスクとの責務境界を `outputs/phase-01/main.md` で 3 列対比表に整理する（本タスク = ADR 起票 / migration-001 = 実 cutover / UT-GOV-006 = canonical sync ガバナンス）。

### ステップ 4: 4 条件と AC のロック

- 4 条件すべて PASS で固定されていることを確認。
- AC-1〜AC-7 を index.md と完全一致で `outputs/phase-01/main.md` に列挙。

## 多角的チェック観点

- 不変条件 #5: ADR の決定がいずれを採っても、`apps/web/wrangler.toml` に `[[d1_databases]]` を追加しない方針が維持されているか。
- 不変条件 #6: GAS prototype に関する記述が混入していないか（影響なしを明示）。
- 直交性: 本タスクが `task-impl-opennext-workers-migration-001`（実 cutover）/ `UT-GOV-006`（canonical sync ガバナンス）の責務を侵食していないか。
- 起票仕様一致: GitHub Issue #287 の AC / リスク / スコープと一字一句の論理矛盾がないか。
- ドキュメントオンリー性: 実 deploy / 実書き換えを要求する記述が混入していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | visualEvidence = NON_VISUAL の確定 | 1 | pending | artifacts.json と同期 |
| 2 | 真の論点を「四者参照点を ADR で一意化」に再定義 | 1 | pending | main.md 冒頭 |
| 3 | 依存境界（上流 1 / 並列 2 / 下流 3）の固定 | 1 | pending | 別タスク起票 interface |
| 4 | 既存差分前提表の固定（CLAUDE.md / wrangler.toml / web-cd.yml / judgment table） | 1 | pending | 出典付き |
| 5 | 苦戦箇所 5 件の言語化 | 1 | pending | 三者整合 / #5 / 重複起票 / @opennextjs/cloudflare / 保留 |
| 6 | 4 条件 PASS 根拠の固定 | 1 | pending | 全件 PASS |
| 7 | AC-1〜AC-7 の確定 | 1 | pending | index.md と完全一致 |
| 8 | 不変条件 #5 / #6 への影響方針記述 | 1 | pending | apps/web の D1 binding 禁止 / GAS 影響なし |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点 / 依存境界 / 苦戦箇所 / 4 条件評価 / AC） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created` へ遷移
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 5 件すべてが Phase 2 の決定論点に対応している
- artifacts.json の `phases[0].status` が `spec_created`
- artifacts.json の `metadata.visualEvidence` が `NON_VISUAL`
- GitHub Issue #287 と AC / 背景 / スコープが一致

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - ADR ドラフト & 判断軸）
- 引き継ぎ事項:
  - 真の論点 = 四者参照点を ADR で一意化
  - 既存差分前提表（CLAUDE.md / wrangler.toml / web-cd.yml / judgment table）
  - 苦戦箇所 5 件（三者整合 / 不変条件 #5 / 重複起票 / @opennextjs/cloudflare 互換 / 保留維持コスト）
  - 関連タスク 2 件との責務分離 3 列対比表
  - 不変条件 #5 / #6 を満たす設計上の制約
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-7 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - GitHub Issue #287 との論理矛盾

## 実行タスク

1. ADR 判断に必要な四者参照点を確認する。
2. docs-only / NON_VISUAL 境界を固定する。
3. AC と不変条件を Phase 2 以降へ渡す。

## 参照資料

- `CLAUDE.md`
- `apps/web/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`

## 統合テスト連携

docs-only ADR タスクのため統合テスト追加は行わない。不変条件 #5 とリンク死活を NON_VISUAL evidence として扱う。
