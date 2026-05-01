# aiworkflow-requirements deployment-cloudflare.md 責務分離 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| タスクID     | issue-112-followup-001-deployment-cloudflare-split                                            |
| タスク名     | `references/deployment-cloudflare.md` を responsibilities ごとに分割（CONST_002 500行制約遵守）|
| 分類         | 改善 / refactor (skill canonical doc)                                                          |
| 対象機能     | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`                   |
| 優先度       | 低                                                                                            |
| 見積もり規模 | 小規模                                                                                        |
| ステータス   | unassigned                                                                                    |
| 発見元       | issue-112-02c-followup-api-env-type-helper Phase 12 close-out 検証時                            |
| 発見日       | 2026-05-01                                                                                    |

## Canonical Workflow Status

- 後継 workflow: 未作成（本ファイルが正本）
- Issue: 未起票
- 状態: `unassigned`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

aiworkflow-requirements skill の `references/deployment-cloudflare.md` は本タスク以前から既に **541 行** で、CLAUDE.md の CONST_002（各ドキュメントは 500 行以内、超過する場合は責務ごとに分離）を満たしていなかった。Issue #112 の Worker Env 型 SSOT 同期で 11 行追加した結果 552 行となり、超過幅が拡大した。

### 1.2 問題点・課題

- 1 ファイルに「OpenNext Workers ビルド」「UT-06 deploy gate」「Worker Env 型同期ルール」「rollback 手順」「monitoring」「troubleshooting」など複数 responsibility が混在
- semantic filename レベルでは既に `deployment-cloudflare-opennext-workers.md` / `deployment-cloudflare-ut06-gate.md` の補助分割が始まっており、本体も同方向で分離する余地がある
- 500行超過のまま放置すると後続タスクで追記する都度 CONST_002 違反が累積する

### 1.3 放置した場合の影響

- skill canonical doc の鮮度確認・該当箇所検索コストが増加
- 新規追記時に「責務超過」を理由に reviewer がブロックすることが恒常化
- classification-first 原則の信頼性が低下

---

## 2. 何を達成するか（What）

- `deployment-cloudflare.md` を responsibility 別に分割し、各ファイルを 500 行以内に収める
- 既存の補助ファイル（`deployment-cloudflare-opennext-workers.md` / `deployment-cloudflare-ut06-gate.md`）と整合する semantic filename 体系を確定
- `indexes/resource-map.md` / `indexes/quick-reference.md` / `indexes/topic-map.md` を同一 wave で更新
- 旧 filename → 新 filename 対応を `legacy-ordinal-family-register.md` に追記

## 3. スコープ外

- skill 内容そのものの修正（記述のリライト・追加情報の発掘）。本タスクは純粋な責務分離 refactor に限定する
- 他 references/ ファイルの行数監査（独立タスク）

## 4. 受入条件（AC）

- AC-1: `deployment-cloudflare.md` 本体が 500 行以内
- AC-2: 全分割ファイルが 500 行以内
- AC-3: `indexes/resource-map.md` の current canonical set に新ファイルが登録され、旧 filename が削除されている
- AC-4: `indexes/quick-reference.md` の参照リンクが新 filename を指している
- AC-5: `legacy-ordinal-family-register.md` に旧 → 新 mapping が追記されている
- AC-6: `validate-structure.js` / `generate-index.js` が PASS
- AC-7: ドキュメント外（`docs/30-workflows/**`）から本ファイルへの link が破損していない

## 5. 関連ファイル

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-ut06-gate.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/legacy-ordinal-family-register.md`
