# Phase 2: 設計（ADR ドラフト & 判断軸）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（ADR ドラフト & cutover/保留 判断軸） |
| 作成日 | 2026-05-01 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| タスク分類 | docs-only（ADR ドラフトの文書化のみ。コード変更なし） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「四者参照点を ADR で一意化」要件を、(1) ADR ドラフト本体テンプレ / (2) 判断軸定義（rollout cost / Cloudflare features 利用範囲 / runtime parity / D1 binding 配置整合 / 既存 GHA 互換性 / `@opennextjs/cloudflare` バージョン互換） / (3) cutover vs 保留 vs 段階移行 比較表 の 3 成果物に分解し、Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力を作成する。実 cutover や `wrangler.toml` 書き換えは対象外。

## 設計判断（base case）

### 判断 1: ADR テンプレ採用 = MADR 形式の簡略版

| 項目 | 内容 |
| --- | --- |
| 採択形式 | MADR（Markdown Architectural Decision Records）相当の簡略テンプレ |
| 配置場所 | `docs/00-getting-started-manual/specs/` 配下に `adr/` サブディレクトリを新設 or 既存 ADR ディレクトリを Phase 3 で確定 |
| 必須セクション | Status / Context / Decision / Consequences / Alternatives Considered / Links |
| 命名規則 | `ADR-NNNN-apps-web-deploy-target.md`（連番は既存 ADR 群と揃える） |

採択理由: MADR は軽量で本プロジェクトの既存 docs 体系（Markdown / GitHub PR review）と相性が良く、追加ツール不要。

### 判断 2: 判断軸 = 6 軸（必須）

| # | 判断軸 | 評価方法 |
| --- | --- | --- |
| 1 | rollout cost | cutover に必要な作業量（wrangler.toml / web-cd.yml / Cloudflare 側 project 切替）を工数 S/M/L で評価 |
| 2 | Cloudflare features 利用範囲 | Workers 形式で得られるが Pages では制約される機能（Workers Bindings の柔軟性 / static assets binding / Smart Placement 等）を列挙 |
| 3 | runtime parity | Next.js App Router / middleware / server components が Pages 形式 / Workers 形式それぞれでどこまで等価に動くかを `@opennextjs/cloudflare` の実装上限で評価 |
| 4 | D1 binding 配置整合 | 不変条件 #5 を維持できるか（apps/web に `[[d1_databases]]` を置かない方針が両形式で守れるか）を評価 |
| 5 | 既存 GHA 互換性 | `web-cd.yml` の現行 step（`wrangler pages deploy`）から `wrangler deploy` への切替工数と secrets / variables の再配線範囲 |
| 6 | `@opennextjs/cloudflare` バージョン互換 | 現行 dependency 版での Workers 形式 cutover 適合性 / 破壊的変更の有無 |

各軸は cutover 案 / 保留案 / 段階移行案で個別に Pros / Cons を埋める。

### 判断 3: cutover / 保留 / 段階移行 の 3 案を比較

| 案 | 概要 | base case 候補 |
| --- | --- | --- |
| **案 X (cutover)** | `wrangler.toml` を Workers 形式（`main = ".open-next/worker.js"` + `[assets]`）に書き換え + `web-cd.yml` を `wrangler deploy` に切替 + Cloudflare 側 project / script 切替を別タスクで実施 | Phase 3 で base case 確定 |
| **案 Y (保留)** | Pages 形式維持。代わりに CLAUDE.md スタック表現を「Cloudflare Pages + Next.js」に修正、judgment table も Pages を canonical と宣言 | Phase 3 で base case 確定 |
| **案 Z (段階移行)** | dev 環境のみ先行で Workers 形式に cutover、production は Pages 維持。一定期間運用後に production も移行判断 | Phase 3 で base case 候補（リスク次第） |

> base case の最終確定は **Phase 3 ゲート**で行う。Phase 2 は 3 案すべての判断軸 6 セルを埋めることが責務。

### 判断 4: ADR 配置先決定方針

- 第一候補: `docs/00-getting-started-manual/specs/adr/ADR-NNNN-apps-web-deploy-target.md`
- 第二候補: 既存 ADR ディレクトリがあればそちらを優先（Phase 2 実行時に `find docs -type d -name 'adr*'` 相当で確認）
- 配置先確定は Phase 3 ゲートで最終判定。Phase 2 では候補 2 件をリストするのみ。

## ADR ドラフト構造

`outputs/phase-02/adr-draft.md` に以下構造で起草する。

```markdown
# ADR-NNNN: apps/web deploy target (Cloudflare Pages vs Workers)

## Status
Historical draft superseded by ADR-0001 Accepted (2026-05-01)

## Context
- CLAUDE.md は Workers + @opennextjs/cloudflare を宣言
- apps/web/wrangler.toml は Pages 形式（pages_build_output_dir = ".next"）
- .github/workflows/web-cd.yml は wrangler pages deploy 系
- deployment-cloudflare.md は両論併記
- → 四者参照点 drift

## Decision
（Phase 3 で確定。本ドラフトでは「TBD: cutover / hold / staged」のプレースホルダ）

## Consequences
- 不変条件 #5 維持: apps/web に [[d1_databases]] を追加しない
- 同期 PR タスク（別タスク）の起票が必要（cutover 採択時）
- judgment table 更新が必要

## Alternatives Considered
- 案 X (cutover) / 案 Y (保留) / 案 Z (段階移行)

## Links
- GitHub Issue #287
- 親タスク: UT-CICD-DRIFT
- 関連: task-impl-opennext-workers-migration-001 / UT-GOV-006-web-deploy-target-canonical-sync
```

## cutover vs 保留 比較表（骨子）

`outputs/phase-02/cutover-vs-hold-comparison.md` に以下表を起草する。

| 判断軸 | 案 X (cutover) | 案 Y (保留) | 案 Z (段階移行) |
| --- | --- | --- | --- |
| rollout cost | M〜L（4 者同期 + Cloudflare 側切替） | S（CLAUDE.md / judgment table 更新のみ） | L（dev/prod 二重管理） |
| Cloudflare features | 広い（Workers Bindings / static assets / Smart Placement） | 狭い（Pages の制約内） | 段階的に広がる |
| runtime parity | @opennextjs/cloudflare 実装上限に依存 | Pages の Next.js 公式サポート範囲 | 環境差分が発生 |
| D1 binding 配置整合 | apps/web に置かない方針で維持可能（要明示） | 維持容易（現状維持） | 維持可能（要 dev/prod 双方明示） |
| 既存 GHA 互換性 | wrangler deploy への切替工数あり | 変更なし | 環境別 step 分岐が必要 |
| @opennextjs/cloudflare 互換 | 現行版の互換確認必須 | 影響なし | dev で先行検証可能 |

## 関連タスク重複/統合判断（Phase 3 入力）

| タスク | 責務 | 本タスクとの関係 |
| --- | --- | --- |
| 本タスク（UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION） | ADR 起票（docs-only / 決定確定） | source of truth |
| task-impl-opennext-workers-migration-001 | OpenNext Workers 移行の実装（cutover 採択時） | 本タスクの ADR 決定を入力として実 cutover を担う後続。本タスクが blocks。 |
| UT-GOV-006-web-deploy-target-canonical-sync | web deploy target の canonical sync ガバナンス | 本タスクの ADR を canonical sync 対象として参照。related。 |

棲み分け（base case）: 統合せず分離。本タスクで ADR を起票し、後段 2 件は ADR を入力として独立に進める。Phase 3 で最終確定。

## 実行タスク

1. `outputs/phase-02/adr-draft.md` を起草し、MADR 簡略テンプレで Status / Context / Decision (TBD) / Consequences / Alternatives / Links を埋める（完了条件: 全セクション存在 + Decision は Phase 3 確定の TBD プレースホルダ）。
2. `outputs/phase-02/decision-criteria.md` を起草し、6 判断軸の定義 + 評価方法 + 現状スナップショット（grep 結果）を記述する（完了条件: 6 軸すべてに評価方法が明示）。
3. `outputs/phase-02/cutover-vs-hold-comparison.md` を起草し、案 X / Y / Z の 3 案 × 6 軸の比較マトリクスを埋める（完了条件: 18 セルすべてに Pros/Cons 記述）。
4. `@opennextjs/cloudflare` の現行 dependency バージョンを `apps/web/package.json` から Read で抽出し、Workers 形式 cutover 互換性メモを `decision-criteria.md` 末尾に添付する（完了条件: バージョン記載 + 互換性所見）。
5. 関連タスク 2 件（task-impl-opennext-workers-migration-001 / UT-GOV-006）の起票文書を Read し、責務分離 3 列対比表を `adr-draft.md` の Links セクション直前に挿入する（完了条件: 3 列対比表存在）。
6. 不変条件 #5 維持方針（cutover 後も apps/web に `[[d1_databases]]` を追加しない）を `adr-draft.md` Consequences セクションに明記する（完了条件: 該当文言存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/phase-01.md | 真の論点 / 苦戦箇所 5 件 / 既存差分前提表 |
| 必須 | apps/web/wrangler.toml | 現状 Pages 形式リテラル抽出（Read のみ） |
| 必須 | .github/workflows/web-cd.yml | 現状 deploy step 抽出（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 判定表現状記述 |
| 必須 | CLAUDE.md | スタック表記述抽出 |
| 必須 | apps/web/package.json | `@opennextjs/cloudflare` バージョン抽出 |
| 参考 | docs/30-workflows/unassigned-task/ 配下の task-impl-opennext-workers-migration-001 起票文書 | 責務分離判断 |
| 参考 | docs/30-workflows/ 配下の UT-GOV-006-web-deploy-target-canonical-sync 起票文書 | 責務分離判断 |

## 完了条件チェックリスト

- [ ] `adr-draft.md` が MADR 簡略テンプレで全セクション埋め済み（Decision は TBD プレースホルダ）
- [ ] `decision-criteria.md` に 6 判断軸の定義 + 評価方法 + 現状スナップショット（grep 結果）
- [ ] `cutover-vs-hold-comparison.md` に 3 案 × 6 軸 = 18 セルすべての Pros/Cons
- [ ] `@opennextjs/cloudflare` バージョン互換性メモが含まれる
- [ ] 関連タスク 2 件との責務分離 3 列対比表が `adr-draft.md` に含まれる
- [ ] 不変条件 #5 維持方針（apps/web に D1 binding 追加禁止）が `adr-draft.md` Consequences に明記
- [ ] ADR 配置先候補 2 件がリスト化されている

## 多角的チェック観点

- **代替案網羅**: cutover / 保留 / 段階移行 の 3 案すべてが 6 軸で埋まっていること（暗黙却下不可）。
- **不変条件 #5**: ADR の Consequences で「Workers 形式 cutover 後も apps/web に `[[d1_databases]]` を追加しない」が明文化されていること。
- **不変条件 #6**: GAS prototype 関連記述が混入していないこと。
- **直交性**: `task-impl-opennext-workers-migration-001`（実 cutover）/ `UT-GOV-006`（canonical sync ガバナンス）の責務を侵食していないこと。
- **保留案の追加コスト顕在化**: 案 Y（保留）でも CLAUDE.md / judgment table の修正が必要である点が比較表に明記されていること。
- **三者整合明示**: 案 X（cutover）採択時に `wrangler.toml` / `web-cd.yml` / Cloudflare 側 project / script の三者同期が別タスクで必要である点が ADR Consequences で明記されていること。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `adr-draft.md` 起草（MADR 簡略） | 2 | pending | Decision は TBD |
| 2 | `decision-criteria.md` 起草（6 軸） | 2 | pending | 評価方法 + grep スナップショット |
| 3 | `cutover-vs-hold-comparison.md` 起草（3 案 × 6 軸） | 2 | pending | 18 セル |
| 4 | `@opennextjs/cloudflare` バージョン互換確認 | 2 | pending | apps/web/package.json から抽出 |
| 5 | 関連タスク 2 件の責務分離 3 列対比表 | 2 | pending | 統合 vs 棲み分け |
| 6 | 不変条件 #5 維持方針の明文化 | 2 | pending | ADR Consequences |
| 7 | ADR 配置先候補 2 件のリスト化 | 2 | pending | Phase 3 で確定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/adr-draft.md | ADR ドラフト本体（MADR 簡略 / Decision は Phase 3 確定の TBD） |
| ドキュメント | outputs/phase-02/decision-criteria.md | 6 判断軸定義 + 評価方法 + 現状スナップショット |
| ドキュメント | outputs/phase-02/cutover-vs-hold-comparison.md | 3 案 × 6 軸の比較マトリクス |
| メタ | artifacts.json | Phase 2 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- 全成果物 3 ファイルが `outputs/phase-02/` 配下に配置済み
- 既存 4 者参照点の grep スナップショットが `decision-criteria.md` に固定
- 不変条件 #5 / #6 を侵さない設計
- artifacts.json の `phases[1].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - ADR ドラフト本体（Decision プレースホルダ）
  - 6 判断軸定義 + 現状スナップショット
  - 3 案 × 6 軸比較マトリクス（base case 候補）
  - `@opennextjs/cloudflare` バージョン互換性所見
  - 関連タスク 2 件との責務分離 3 列対比表
  - ADR 配置先候補 2 件
  - 不変条件 #5 維持方針
- ブロック条件:
  - 案が 2 案未満（必ず 3 案を埋める）
  - 18 セルのいずれかが空欄
  - `@opennextjs/cloudflare` バージョン互換確認漏れ
  - 関連タスク 2 件の責務境界が曖昧

## 統合テスト連携

docs-only ADR 比較のため統合テスト追加は行わない。後続 `task-impl-opennext-workers-migration-001` で staging / production smoke を扱う。
