# Phase 8: DRY 化分析（TECH-M-01）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タイトル | DRY 化分析 / 既存「docs-only / spec_created 必須3点」と新規「docs-only / NON_VISUAL 縮約テンプレ」の統合計画 |
| 状態 | completed |
| 作成日 | 2026-04-29 |
| 入力 Phase | Phase 5（実装ランブック） / Phase 7（AC マトリクス）|
| 出力対象 | `outputs/phase-08/main.md` |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| 追跡 ID | TECH-M-01 |

## 1. 背景

`phase-template-phase11.md` には Phase 5 完了後に 2 つのセクションが共存する：

| セクション | 由来 | 役割 |
| --- | --- | --- |
| 既存「docs-only / spec_created 必須3点」 | 既存 skill の従来記述 | docs-only タスクで Phase 11 outputs を `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点に固定 |
| 新規「docs-only / NON_VISUAL 縮約テンプレ」 | 本タスク Phase 5 で追記 | `visualEvidence == NON_VISUAL` を発火条件として 3 点固定を再表現 + screenshot 不要を明文化 |

両者は **必須 3 点固定** という核を共有するが、発火条件・対象状態（`spec_created` vs `NON_VISUAL`）の表現粒度が異なるため、Phase 5 追記直後は重複と表記揺れを抱える。本 Phase で重複箇所を抽出し、単一正本へ集約する統合計画を確定する。

## 2. 重複箇所一覧

| # | 観点 | 既存セクション側 | 縮約テンプレ側 | 重複度 |
| --- | --- | --- | --- | --- |
| D-1 | 必須 3 点列挙（`main.md` / `manual-smoke-log.md` / `link-checklist.md`） | あり | あり | 高（一字一句一致が必須）|
| D-2 | screenshot 不要の明文化 | 暗黙（記述なし or 弱い） | 明示 | 中（既存は弱記述） |
| D-3 | 発火条件 | `taskType == docs-only` && `状態 == spec_created` | `visualEvidence == NON_VISUAL` && `taskType == docs-only` | 中（条件が 2 系統並走） |
| D-4 | 自己適用第一例リンク | なし | あり（ut-gov-005 リンク）| 低（縮約側のみ）|
| D-5 | 既存 NON_VISUAL evidence プレイブック（`phase-11-non-visual-alternative-evidence.md`）との境界記述 | 一部（暗黙） | あり（境界明示）| 中 |
| D-6 | 「別セット / 混在させない」表記 | 暗黙 | 明示 | 中 |
| D-7 | mirror 同期コマンド | あり（既存セクション内） | あり（縮約テンプレ内） | 中（コマンド本体は同一） |

## 3. 統合方針

### 3.1 単一正本（Single Source of Truth）戦略

| 項目 | 正本配置 | 他箇所の扱い |
| --- | --- | --- |
| 必須 3 点固定リスト | `phase-template-phase11.md` 縮約テンプレセクション | 既存セクションは「縮約テンプレ §X を参照」とリンク化し、artefact 名の再列挙を削除 |
| 発火条件 | `SKILL.md` タスクタイプ判定フロー（`visualEvidence == NON_VISUAL` && `taskType == docs-only` を 1 箇所で結合）| 縮約テンプレ側は「発火条件は SKILL.md §タスクタイプ判定フロー参照」とリンク化 |
| screenshot 不要 | 縮約テンプレセクション | 既存セクション側に同記述があれば削除 |
| 状態（`spec_created` / `completed`）分離 | `phase-12-completion-checklist.md` docs-only ブランチ | `phase-template-phase11.md` 既存セクションからは「状態分離は compliance-check §Z 参照」 |
| mirror 同期コマンド | Phase 2 設計 / Phase 9 / Phase 11 smoke で **同表記** を維持（コマンド重複は許容、表記揺れ禁止）| ─ |
| 自己適用第一例リンク | 縮約テンプレセクション内 | ─ |

### 3.2 統合後のセクション構造（提案）

```
phase-template-phase11.md
├─ §A 共通: Phase 11 outputs の役割
├─ §B docs-only / NON_VISUAL 縮約テンプレ（正本）
│    ├─ B.1 発火条件 → SKILL.md 判定フローへリンク
│    ├─ B.2 必須 3 点固定（main.md / manual-smoke-log.md / link-checklist.md）
│    ├─ B.3 screenshot 不要 + 既存 NON_VISUAL プレイブックとの境界
│    └─ B.4 自己適用第一例（ut-gov-005-...）
└─ §C docs-only / spec_created 必須3点（既存）
     └─ §B 縮約テンプレへリンクのみ（artefact 再列挙は削除）
```

### 3.3 表記統一ルール

| 用語 | 正本表記 |
| --- | --- |
| 必須 artefact | `main.md` / `manual-smoke-log.md` / `link-checklist.md` |
| 発火条件 | `visualEvidence == "NON_VISUAL"` && `taskType == "docs-only"` |
| 同期コマンド | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` |
| 状態分離 | `workflow_state`（root）/ `phases[].status`（Phase 別） |

`rg` で表記揺れを 0 件にする：

```bash
rg -n "main\.md.*manual-smoke-log\.md.*link-checklist\.md" .claude/skills/task-specification-creator/
rg -n "diff -qr" .claude/skills/task-specification-creator/
rg -n "NON_VISUAL" .claude/skills/task-specification-creator/
```

## 4. 副作用範囲

| 影響対象 | 種別 | 対応 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | 軽微（リンク化のみ） | 判定フロー本体は SKILL.md に集約済のため変更最小 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 中（既存セクション縮約 + 縮約テンプレ追記）| 本 Phase の主編集対象 |
| `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | 軽微 | 5 項目詳述があればリンク化に置換 |
| `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | 軽微 | 状態分離が正本であることを明示する見出しを追加 |
| `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | なし | 境界明示は縮約テンプレ側で行うため変更不要 |
| `.agents/skills/task-specification-creator/` | 中（mirror 反映） | 上記編集後に Phase 5 Step 6 の `cp` ループ再実行 → `diff -qr` 0 確認 |
| 本ワークフロー Phase 11 outputs | なし | 縮約テンプレ参照リンクが安定見出し（テキスト引用）であれば影響なし |
| ランタイムコード（apps/web, apps/api）| なし | docs-only のため非対象 |

## 5. AC への影響確認

| AC | DRY 化前 | DRY 化後 | 検証 |
| --- | --- | --- | --- |
| AC-1 | GREEN | GREEN | TC-2-1, TC-2-2, TC-2-3（縮約テンプレ正本側に 3 点記述） |
| AC-2 | GREEN | GREEN | TC-1-2, TC-2-4（SKILL.md と縮約テンプレに NON_VISUAL 記述） |
| AC-3 | GREEN | GREEN | TC-3-1, TC-3-2 |
| AC-4 | GREEN | GREEN | TC-3-3, TC-3-4（compliance-check 正本化） |
| AC-5 | GREEN | GREEN | DRY 編集後に mirror 再同期 → `diff -qr` 0 |
| AC-6 | GREEN | GREEN | TC-4-1, TC-4-2 |
| AC-7 | GREEN | GREEN | jq |
| AC-8 | Phase 11 で GREEN | Phase 11 で GREEN | リンク先見出しの安定性確認 |
| AC-9 | GREEN | GREEN | review |
| AC-10 | GREEN | GREEN | jq |

DRY 化適用で AC のいずれも regress しない見込み。

## 6. リスクと注意

- **過剰 DRY**: 5 行未満の短セクションは明示性優先で重複許容。SKILL.md ↔ references の往復が増えると Phase 11 / 12 実行コストが上がる。
- **リンク切れ**: `§X` 表記でなく **見出しテキスト引用** にすることで、見出し変更時に grep で検出可能にする。
- **mirror 波及忘れ**: 本 Phase で skill 本体を編集する場合は本 Phase 内で `.agents/` 同期まで完了させ、Phase 9 持ち越し禁止。
- **自己適用との衝突**: 本ワークフロー Phase 11 が縮約テンプレを参照するため、リンク先見出しの安定性を Phase 11 着手前に確認する。

## 7. TECH-M-01 完了条件

- [ ] 重複箇所 D-1〜D-7 が main.md に記録（本書で完了）
- [ ] 統合方針が表形式で確定（本書 §3 で完了）
- [ ] 副作用範囲が main.md に記載（本書 §4 で完了）
- [ ] AC 維持確認表が記載（本書 §5 で完了）
- [ ] 表記揺れ 0 件の grep コマンド提示（本書 §3.3 で完了）
- [ ] 実適用は Phase 5 へのフィードバックループまたは本 Phase 内編集で実施（適用結果は Phase 9 で再検証）

## 8. 次 Phase への引き継ぎ

- Phase 9（品質保証）で `diff -qr` / `pnpm typecheck` / `pnpm lint` / `jq` 整合を再確認
- Phase 10（最終レビュー）で AC-9 PASS 維持を確認
- Phase 11（自己適用）でリンク先見出し安定性の最終 smoke
