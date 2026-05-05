# Phase 3 成果物: 設計レビューゲート（main）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13（設計レビューゲート） |
| 前提 | Phase 2 で `adr-draft.md` / `decision-criteria.md` / `cutover-vs-hold-comparison.md` が完成 |
| 判定 | GO (PASS) — Phase 4 へ進行 |
| 実施日 | 2026-05-01 |

## ゲート判定基準（再掲）

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念（ドキュメント追補で解消可能） | base case 維持・後続 Phase で吸収 |
| **MAJOR** | 不変条件違反 / 採択理由が代替案で覆る / 関連タスク責務破綻 / `@opennextjs/cloudflare` 互換不適合 | Phase 2 戻し |

MAJOR 1 件で Phase 2 戻し。

## 軸 A: deploy target 決定（cutover / 保留 / 段階移行）

| 案 | 概要 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- | --- |
| **案 X (cutover)** | Workers + `@opennextjs/cloudflare` 採用。`web-cd.yml` を `wrangler deploy --env <env>` へ置換。Cloudflare side は手動切替 | 既成事実（wrangler.toml 既移行）/ CLAUDE.md と整合 / Cloudflare features 自由度高 / `@opennextjs/cloudflare@1.19.4` 実証済 | 三者同期作業の分散実行リスク / Cloudflare side 手動 runbook 必要 | **PASS（base case 採択）** |
| 案 Y (保留) | Pages 形式維持。wrangler.toml ロールバック + CLAUDE.md 書き換え | 文書補正最小（の名目）/ GHA 触り直し不要 | wrangler.toml ロールバック追加コスト / CLAUDE.md 書き換え必要 / `@opennextjs/cloudflare` 採用方針崩壊 / 議論風化 | 不採用 |
| 案 Z (段階移行) | dev = Workers / prod = Pages | 環境差分の段階検証 | 二重管理 / wrangler.toml 既移行のため意味薄 | 不採用 |

**base case: 案 X (cutover) PASS** — wrangler.toml が既に Workers 形式に移行済の既成事実が決定的根拠。

## 軸 B: ADR 配置先

| 案 | 配置 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- | --- |
| **B-1: `docs/00-getting-started-manual/specs/adr/`** | specs 配下に新規 adr/ ディレクトリ | specs 体系統一 / 発見性高 / 連番管理 | adr/ 新設の管理コスト | **PASS（採択）** |
| B-2: 既存 ADR ディレクトリ | 既存統合 | 体系の一貫性 | 既存 ADR ディレクトリ不在（`find docs -type d -iname '*adr*'` 結果は `docs/30-workflows/completed-tasks/task-husky-rejection-adr` のみ。これは task 単位の ADR 記録であり集約場所ではない） | 不採用 |

**判定**: B-1 採択。`docs/00-getting-started-manual/specs/adr/` を新設し、既存 specs 命名（連番なし）と区別するため `adr/NNNN-pages-vs-workers-deploy-target.md` 形式で起票する。NNNN は新設のため `0001` から開始。

## 軸 C: 関連タスク 2 件との関係

| 案 | 関係 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- | --- |
| **C-1: 分離（本 ADR / migration-001 / UT-GOV-006 の 3 タスク責務分離）** | 責務分離 | 本タスク docs-only 維持 / 後続 2 件の独立価値維持 / blocks/related 依存関係明確 | タスク 3 件の進行管理 | **PASS（採択）** |
| C-2: 統合（本タスクで実 cutover まで実施） | 1 タスク完結 | タスク数削減 | docs-only 違反 / ADR と実装証跡が混在 | 不採用 (MAJOR) |
| C-3: 本タスク close + migration-001 / UT-GOV-006 のいずれかに ADR 内包 | 統合先で ADR | 本タスク不要化 | source of truth 曖昧化 | 不採用 (MAJOR) |

**判定**: C-1 PASS。C-2 / C-3 は MAJOR ブロッカーで明示却下。

## 軸 D: 不変条件 #5 維持戦略

| 案 | 戦略 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- | --- |
| **D-1: cutover 採択時も apps/web に `[[d1_databases]]` を絶対追加しない** | apps/api 経由のみ | 不変条件 #5 維持 / 境界明示 | apps/web 直接アクセス誘惑への抑止が ADR 明記必須 | **PASS（採択）** |
| D-2: cutover を機に apps/web からも D1 binding 直接参照を解禁 | 自由化 | 一部実装単純化 | 不変条件 #5 違反 / 閉じ込め原則崩壊 | 不採用 (MAJOR) |

**判定**: D-1 PASS。D-2 は MAJOR ブロッカーで明示却下。

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | ADR 起票で四者参照点 drift を根本解消。後続 cutover タスクの判断軸が線形化 |
| 実現性 | PASS | 文書化のみ。CLI / wrangler / migration 実行不要。判断軸 6 セル評価が Read で完結 |
| 整合性 | PASS | 不変条件 #5 / #6 を維持。関連タスク 2 件との責務分離も C-1 で確定 |
| 運用性 | PASS | ADR が source of truth となり、judgment table / CLAUDE.md / wrangler.toml / web-cd.yml 四者が ADR を参照 |

## レビュー観点別判定（7 観点）

| 観点 | 判定 | 根拠・残課題 |
| --- | --- | --- |
| 不変条件 #5 | PASS | D-1 採択。ADR Consequences に必須記載 |
| 不変条件 #6 | PASS | GAS 関連記述なし |
| 関連タスク重複（migration-001） | PASS | C-1 採択。本 ADR が blocks |
| 関連タスク重複（UT-GOV-006） | PASS | C-1 採択。related で ADR を sync 対象に追加 |
| 三者整合（wrangler.toml / web-cd.yml / Cloudflare side） | PASS | ADR Consequences で「三者同期は別タスクで実施」を明記済（adr-draft.md） |
| `@opennextjs/cloudflare` 互換 | PASS | `1.19.4` で実証済（wrangler.toml が既に Workers 形式で動作） |
| 保留維持コスト顕在化 | PASS | 比較表で wrangler.toml ロールバック追加コストを明示 |

## 着手可否ゲート

**判定: GO (PASS)** — Phase 4 へ進行 + ADR Decision セクションを **案 X (cutover)** で確定。

- MAJOR: 0 件
- MINOR: 0 件
- 軸 A / B / C / D すべて PASS
- 観点 7 件すべて PASS

## base case 最終確定

| 軸 | 採択結果 |
| --- | --- |
| A: deploy target | **案 X (cutover)** |
| B: ADR 配置先 | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` |
| C: 関連タスク関係 | C-1（分離） |
| D: 不変条件 #5 維持戦略 | D-1（apps/web に `[[d1_databases]]` を絶対追加しない） |

ADR Decision セクションの TBD は **「案 X (cutover) を採択し、Cloudflare Workers + `@opennextjs/cloudflare` を canonical deploy target とする。`web-cd.yml` の `pages deploy` → `wrangler deploy --env <env>` 切替および Cloudflare side Pages project → Workers script 切替は別タスク `task-impl-opennext-workers-migration-001` で実施する」** に置換する（Phase 5 runbook 適用時）。

## 残課題（open question）

| # | 内容 | 委譲先 |
| --- | --- | --- |
| 1 | `web-cd.yml` の `wrangler deploy --env <env>` 切替 | task-impl-opennext-workers-migration-001（unassigned-task として既起票済） |
| 2 | Cloudflare side Pages project → Workers script 切替手動 runbook | 別タスク（Phase 12 unassigned-task-detection.md current 候補） |
| 3 | `deployment-cloudflare.md` 判定表「現状 / 将来 / 根拠リンク / 更新日」更新 | 本タスク Phase 12（documentation-changelog Step 2） |
| 4 | `CLAUDE.md` スタック表現確認（cutover 採択 = 維持） | 本タスク Phase 12（変更不要を確認） |
| 5 | UT-GOV-006 への canonical sync 対象追加 | UT-GOV-006（related） |
| 6 | `@opennextjs/cloudflare` メジャーアップデート時の再評価 | baseline 候補（Phase 12 unassigned-task-detection baseline） |

## 完了条件チェックリスト

- [x] 軸 A / B / C / D すべて 2 案以上比較（軸 A は 3 案）
- [x] 4 条件評価 4 セル全 PASS
- [x] 観点別判定 7 件すべて PASS
- [x] 判定基準（PASS / MINOR / MAJOR）明文化
- [x] 着手可否ゲート GO 明示
- [x] base case 最終確定（案 X cutover / B-1 / C-1 / D-1）
- [x] MAJOR 検出時の Phase 2 戻しトリガ定義
- [x] 残課題 6 件が委譲先付きで列挙
- [x] 不変条件 #5 / #6 違反ゼロ
- [x] 関連タスク責務侵食ゼロ

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略）
- 引き継ぎ事項: base case 確定（案 X cutover / B-1 / C-1 / D-1）/ 4 条件全 PASS / 残課題 6 件 / ADR Decision 実値（cutover 採択文言）
