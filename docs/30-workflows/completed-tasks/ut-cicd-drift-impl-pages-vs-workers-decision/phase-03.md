# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 2（設計 - ADR ドラフト & 判断軸） |
| 次 Phase | 4（検証戦略 - ADR 整合チェック手順） |
| 状態 | spec_created |
| タスク分類 | docs-only（design review gate） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した (1) `adr-draft.md` / (2) `decision-criteria.md` / (3) `cutover-vs-hold-comparison.md` に対し、案 X (cutover) / 案 Y (保留) / 案 Z (段階移行) の 3 案を 6 判断軸で比較し、4 条件（価値性 / 実現性 / 整合性 / 運用性）+ 観点別（不変条件 #5 / #6、関連タスク 2 件との重複/統合判断、三者整合、`@opennextjs/cloudflare` 互換、保留維持コスト）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。本 Phase で **base case を最終確定**（cutover / 保留 / 段階移行 のいずれか）し、ADR Decision セクションの TBD を解消する。

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 当該観点で base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念あり（例: ドキュメント文言追補で解消可能 / 後続 Phase で吸収可能） | base case 維持。Phase 4-5 で追補メモ化 |
| **MAJOR** | 不変条件違反 / 採択理由が代替案で覆る / 関連タスクとの責務破綻 / `@opennextjs/cloudflare` 互換不適合 | **Phase 2 に差し戻し**。ADR ドラフト / 判断軸 / 比較表のいずれかを再起草 |

> **MAJOR が 1 件でも検出された場合、Phase 4 へ進まず Phase 2 に戻す**。MINOR のみであれば次 Phase へ進行可。

## 代替案比較（最低 2 案以上）

### 軸 A: deploy target 決定

| 案 | 概要 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **案 X (cutover)** | wrangler.toml を Workers 形式へ書き換え + web-cd.yml を `wrangler deploy` 切替 + Cloudflare 側 project / script 切替（別タスク） | CLAUDE.md 宣言と一致。Cloudflare features の利用範囲拡大。`@opennextjs/cloudflare` 採用方針の正当化 | rollout cost M〜L。三者同期作業が必須（別タスク 2-3 件起票） | （Phase 3 で確定） |
| **案 Y (保留)** | Pages 形式維持。CLAUDE.md スタック表現を「Cloudflare Pages + Next.js」に修正、judgment table も Pages を canonical と宣言 | rollout cost S。実体に対する文言補正のみで完結 | CLAUDE.md / OpenNext 記述を消すと `@opennextjs/cloudflare` 採用前提が崩れる。Workers 機能の将来採用余地が制限される | （Phase 3 で確定） |
| **案 Z (段階移行)** | dev 環境のみ先行で Workers 形式に cutover、production は Pages 維持 | 実環境差分のリスクを段階的に検証可能 | 環境間 drift が常態化。CI / wrangler config の二重管理コスト | （Phase 3 で確定） |

**判定**: Phase 3 実施時に Phase 2 比較マトリクスの 18 セルを根拠に base case を確定する。Phase 2 完了時点では仮で **案 X (cutover) 優位** が想定されるが、`@opennextjs/cloudflare` バージョン互換結果次第で案 Y (保留) に倒す可能性も残す。

### 軸 B: ADR 配置先

| 案 | 配置 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **B-1: `docs/00-getting-started-manual/specs/adr/`** | specs 配下に adr/ 新設 | specs 体系と統一。発見性高 | adr/ ディレクトリ新設の管理コスト | 候補 1 |
| B-2: 既存 ADR ディレクトリ（存在する場合） | 既存統合 | 体系の一貫性 | 既存 ADR の連番規則に従う必要 | 候補 2 |

**判定**: Phase 3 実行時に `find docs -type d -name 'adr*'` 相当で既存 ADR ディレクトリ有無を確認し、存在すれば B-2 / 不在なら B-1 を採択。

### 軸 C: 関連タスク 2 件との関係

| 案 | 関係 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **C-1: 分離（本タスク = ADR 起票 / migration-001 = 実 cutover / UT-GOV-006 = canonical sync ガバナンス）（base case）** | 責務分離 | 本タスクが docs-only に閉じる。後続 2 件の独立価値が維持。blocks / related の依存関係が明確 | タスク 3 件の進行管理が必要 | ✅ |
| C-2: 統合（本タスクで実 cutover まで実施し migration-001 を close） | 1 タスクで完結 | タスク数削減 | 本タスクが docs-only から外れ taskType 違反。ADR の決定根拠と実装証跡が混在し読解困難 | - |
| C-3: 本タスクを close し migration-001 / UT-GOV-006 のいずれかに ADR 起票も内包させる | 統合先側で ADR | 本タスク自体不要 | ADR が「ガバナンス記録」または「実装記録」と混在し source of truth が曖昧 | - |

**判定**: C-1 PASS（C-2 は taskType 違反で MAJOR、C-3 は ADR の source of truth 性が曖昧化で MAJOR）。

### 軸 D: 不変条件 #5 維持戦略

| 案 | 戦略 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **D-1: cutover 採択時も apps/web/wrangler.toml に `[[d1_databases]]` を絶対追加しない（base case）** | apps/api 経由のみ | 不変条件 #5 維持。境界明示 | apps/web から D1 を直接読みたい誘惑が将来発生する可能性（ADR で禁止明記が抑止力） | ✅ |
| D-2: cutover を機に apps/web からも D1 binding 直接参照を解禁 | binding 自由化 | 一部実装が単純化 | 不変条件 #5 違反。apps/api 閉じ込め原則が崩壊 | - |

**判定**: D-1 PASS（D-2 は不変条件違反で MAJOR）。

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | ADR 起票で四者参照点の drift を根本解消する経路が確立。後続 2 件の判断軸が線形化 |
| 実現性 | PASS | 文書化のみ。CLI / wrangler / migration 実行不要。判断軸 6 セル評価が Read で完結 |
| 整合性 | PASS | 不変条件 #5（apps/web に D1 binding を置かない）/ #6（GAS 影響なし）を維持。関連タスク 2 件との責務分離も C-1 で確定 |
| 運用性 | PASS | ADR が source of truth となり、judgment table / CLAUDE.md / wrangler.toml / web-cd.yml の四者が ADR を参照する構造が確立 |

## レビュー観点別判定

| 観点 | 判定 | 根拠・残課題 |
| --- | --- | --- |
| 不変条件 #5（apps/web に D1 binding を置かない） | PASS | D-1 採択により ADR Consequences で明文化される |
| 不変条件 #6（GAS 影響なし） | PASS | 本タスク範囲に GAS prototype 関連記述なし |
| 関連タスク重複/統合（migration-001） | PASS | C-1 採択により本タスク = ADR 起票 / migration-001 = 実 cutover で分離。本タスクが blocks |
| 関連タスク重複/統合（UT-GOV-006） | PASS | C-1 採択により ADR を canonical sync 対象として参照。related |
| 三者整合（wrangler.toml / web-cd.yml / Cloudflare 側） | （案採択次第）PASS or MINOR | 案 X (cutover) 採択時は ADR Consequences で「三者同期は別タスクで実施」を明記すれば PASS。明記漏れの場合 MINOR |
| `@opennextjs/cloudflare` 互換 | （Phase 2 結果次第）PASS or MAJOR | 現行版で Workers 形式 cutover 不適合判定なら案 Y (保留) に倒す。互換確認結果が `decision-criteria.md` 末尾に固定されているか確認 |
| 保留維持コスト顕在化 | PASS | 案 Y (保留) でも CLAUDE.md / judgment table 修正が必要な点が比較表に明記されていれば PASS |

## 着手可否ゲート

- すべての軸（A / B / C / D）と観点が **PASS**: Phase 4 へ GO + ADR Decision セクションを base case で確定。
- いずれかが **MINOR**: 残課題として記録し Phase 4 へ GO（Phase 5 runbook で追補吸収）。
- いずれかが **MAJOR**: NO-GO。Phase 2 に差し戻し当該成果物を再起草。

## 残課題（open question）

| # | 内容 | 委譲先 |
| --- | --- | --- |
| 1 | （案 X 採択時）apps/web/wrangler.toml の Workers 形式書き換え | task-impl-opennext-workers-migration-001（別タスク / Phase 12 で同期 PR タスク仕様起票） |
| 2 | （案 X 採択時）.github/workflows/web-cd.yml の `wrangler deploy` 切替 | 同上（同期 PR タスク） |
| 3 | （案 X 採択時）Cloudflare 側 Pages project → Workers script 切替 | 別タスク（手動運用 runbook 化） |
| 4 | judgment table（deployment-cloudflare.md）への決定反映 | 本タスク Phase 12（documentation-changelog で差分指示） |
| 5 | CLAUDE.md スタック表現の確認（cutover 採択 = 維持 / 保留採択 = Pages 表記に修正） | 本タスク Phase 12（documentation-changelog で差分指示） |
| 6 | UT-GOV-006 の canonical sync ガバナンス対象に ADR を組み込む | UT-GOV-006（related） |

## 実行タスク

1. 軸 A / B / C / D それぞれで最低 2 案の代替案比較表を `outputs/phase-03/main.md` に記述する（完了条件: 各軸 2 案以上 + base case フラグ + 利点 / 欠点が表形式 / 軸 A は 3 案）。
2. 4 条件 PASS / MINOR / MAJOR 判定を根拠付きで記述する（完了条件: 4 セルすべてに判定 + 根拠）。
3. 観点別判定（不変条件 #5 / #6、関連タスク 2 件、三者整合、`@opennextjs/cloudflare` 互換、保留維持コスト）を表化する（完了条件: 7 観点すべてに判定）。
4. 着手可否ゲート判定を実施し、GO / NO-GO を明示する（完了条件: 判定結果が文書化）。
5. base case を最終確定し、ADR ドラフト Decision セクションの TBD を実値で置換する指示を記録する（完了条件: 採択案が main.md に記述）。
6. 残課題を別タスク・別 Phase に振り分ける（完了条件: open question 表で委譲先が明示）。
7. MAJOR 検出時の Phase 2 戻しトリガを定義する（完了条件: 「MAJOR 1 件で戻し」基準が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/phase-02.md | レビュー対象設計 |
| 必須 | outputs/phase-02/adr-draft.md | base case の ADR ドラフト |
| 必須 | outputs/phase-02/decision-criteria.md | 6 判断軸 + 現状スナップショット + `@opennextjs/cloudflare` バージョン互換結果 |
| 必須 | outputs/phase-02/cutover-vs-hold-comparison.md | 3 案 × 6 軸比較マトリクス |
| 必須 | apps/web/wrangler.toml | 現状確認 |
| 必須 | .github/workflows/web-cd.yml | 現状確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 判定表更新方針 |
| 必須 | CLAUDE.md | スタック表現確認 |
| 参考 | task-impl-opennext-workers-migration-001 起票文書 | C 軸判定根拠 |
| 参考 | UT-GOV-006-web-deploy-target-canonical-sync 起票文書 | C 軸判定根拠 |

## 完了条件チェックリスト

- [ ] 軸 A / B / C / D それぞれで最低 2 案の代替案比較が記述（軸 A は 3 案）
- [ ] 4 条件評価マトリクスに空セルゼロ
- [ ] 観点別判定 7 件（不変条件 #5 / #6、migration-001、UT-GOV-006、三者整合、`@opennextjs/cloudflare`、保留維持コスト）すべてに判定
- [ ] PASS / MINOR / MAJOR の判定基準が文書化
- [ ] 着手可否ゲート（GO / NO-GO）が明示
- [ ] base case 最終確定（cutover / 保留 / 段階移行 のいずれか）が記述
- [ ] MAJOR 検出時の Phase 2 戻しトリガが定義
- [ ] 残課題が委譲先付きで列挙
- [ ] 不変条件 #5 / #6 違反ゼロ
- [ ] 関連タスク 2 件との責務侵食ゼロ

## 多角的チェック観点

- **代替案網羅性**: 案 Y (保留) / 案 Z (段階移行) の各リスクが本 Phase で**明示的に評価されている**こと（暗黙却下は不可）。C-2 / C-3 / D-2 のリスクも明示却下。
- **直交性**: `task-impl-opennext-workers-migration-001` / `UT-GOV-006` の起票仕様 `スコープ含まない` セクションと突き合わせ、本タスクが他タスクの責務を侵食していないこと。
- **三者整合明示**: 案 X (cutover) 採択時に「ADR は決定のみ。実 cutover は別タスク」が ADR Consequences と Phase 12 documentation-changelog で二重に記録されていること。
- **`@opennextjs/cloudflare` 互換の決定的役割**: バージョン互換結果が PASS を強制するか MAJOR で差し戻すかの分岐点になることを Phase 3 文書で明示。
- **保留 = 何もしないではない**: 案 Y 採択時も CLAUDE.md / judgment table の修正が別途必要である点が残課題で言及されていること。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 軸 A 代替案比較（cutover / 保留 / 段階移行） | 3 | pending | 3 案 |
| 2 | 軸 B 代替案比較（ADR 配置先 2 案） | 3 | pending | 既存 adr/ 有無確認 |
| 3 | 軸 C 代替案比較（関連タスク分離 / 統合） | 3 | pending | C-1 採択 |
| 4 | 軸 D 代替案比較（#5 維持 / 解禁） | 3 | pending | D-1 採択 |
| 5 | 4 条件再評価 | 3 | pending | 全 PASS |
| 6 | 観点別判定（7 件） | 3 | pending | 全 PASS or MINOR |
| 7 | base case 最終確定 + ADR Decision 値の指示 | 3 | pending | TBD 解消 |
| 8 | 着手可否ゲート判定 | 3 | pending | GO / NO-GO 明示 |
| 9 | 残課題の委譲先確定 | 3 | pending | migration-001 / UT-GOV-006 / 別 Phase |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビューゲート結果（代替案比較 / 4 条件 / 観点別判定 / GO-NO-GO / base case 確定 / 残課題） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created` へ遷移
- 軸 A / B / C / D の代替案比較がすべて 2 案以上（軸 A は 3 案）
- 4 条件評価が全 PASS
- 観点別判定 7 件が全件評価済み
- base case 最終確定が記述
- MAJOR ゼロ（MINOR は許容）
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略 - ADR 整合チェック手順）
- 引き継ぎ事項:
  - 軸 A / B / C / D の base case 最終確定（cutover / 保留 / 段階移行 のいずれか / ADR 配置先 / 関連タスク分離 / #5 維持）
  - 4 条件評価 全 PASS
  - 残課題（同期 PR タスク × 2 / Cloudflare 側切替 runbook / judgment table 反映 / CLAUDE.md 確認 / UT-GOV-006 連携）の委譲先
  - ADR Decision セクションの実値（TBD 解消後）
- ブロック条件:
  - MAJOR 検出時 → Phase 2 戻し
  - 4 条件いずれかが MAJOR
  - 観点別判定で不変条件違反 / 責務侵食
  - 代替案比較が 2 案未満（軸 A は 3 案未満）
  - `@opennextjs/cloudflare` 互換確認漏れ

## 統合テスト連携

Phase 3 は decision gate であり、統合テスト追加は行わない。決定後の deploy smoke は migration task に委譲する。
