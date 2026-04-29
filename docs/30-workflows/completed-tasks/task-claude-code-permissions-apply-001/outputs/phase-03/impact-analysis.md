# Phase 3 impact-analysis: 影響分析

## 1. 必須前提タスク 2 件の結論サマリ

| タスクID | 完了状態 | 結論 | 取り扱い |
| --- | --- | --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` | **未実施** | bypass 下 deny 実効性 = **UNKNOWN** | **BLOCKED** として記録。ユーザー選択肢 C 承認により FORCED-GO |
| `task-claude-code-permissions-project-local-first-comparison-001` | **未実施** | 案 A vs 案 B trade-off = **UNDETERMINED** | **BLOCKED** として記録。ユーザー選択肢 C 承認により FORCED-GO |

→ 通常運用での Phase 3 ゲートは No-Go だが、本タスクではユーザーが選択肢 C で前提スキップを明示承認したため **FORCED-GO** 扱い。Phase 4 着手の判定上は Go だが、Phase 4 以降の実機書き換えは index.md `block_reason` に従い別途 blocked のまま。

## 2. R-1: 他 project 影響範囲評価

> Phase 1 inventory §4 から再整理。`permissions.defaultMode` を nested で扱う方針のため評価対象は同列のキー。

| project | 現値 (`permissions.defaultMode`) | 案 A 適用後の実効値 | 判定 |
| --- | --- | --- | --- |
| `~/.claude/settings.json`（global） | `bypassPermissions` | `bypassPermissions` | 不変・許容 |
| AutoForgeNexus（`.claude/settings.json` + `.local`） | `acceptEdits`（明示 override） | `acceptEdits` | project 層が勝つ・許容 |
| Skill | null（未定義） | global 継承 → `bypassPermissions` | **副作用あり**・ユーザー承認で許容 |
| AIWorkflowOrchestrator | null | global 継承 → `bypassPermissions` | **副作用あり**・ユーザー承認で許容 |
| senpAI | null | global 継承 → `bypassPermissions` | **副作用あり**・ユーザー承認で許容 |
| UBM-Hyogo（main + worktree） | `bypassPermissions` | 不変 | 許容 |
| n8n | null | global 継承 → `bypassPermissions` | **副作用あり**・ユーザー承認で許容 |
| ObsidianMemo | `bypassPermissions` | 不変 | 許容 |

### R-1 判定

- **PASS（条件付き）**
- 副作用 4 project の bypass 化を **ユーザー強行承認**でカバー
- ただし、本タスクでは global の `permissions.defaultMode` は **既に `bypassPermissions`** であり F1 は実質 no-op。実害はゼロ
- グローバル `permissions.allow` / `deny` には追記しない方針 → 他 project への whitelist 波及はなし

## 3. R-2: `--dangerously-skip-permissions` + `permissions.deny` 実効性

| 項目 | 値 |
| --- | --- |
| 公式 docs 引用 | **未取得**（前提タスク #1 で確認予定だった） |
| 実機検証ログ | **未取得**（前提タスク #1 で取得予定だった） |
| 結論 | **UNKNOWN** |
| 取り扱い | **BLOCKED → FORCED-PASS（ユーザー承認）** |

### R-2 判定

- 通常運用なら FAIL → No-Go
- ユーザー選択肢 C 承認により **FORCED-PASS**
- 派生条件: Phase 5 実機書き換え時、deny を「保険」として宣伝する記述を runbook / documentation-changelog に書かない（実効性が確認されていないため）

## 4. R-3: project-local-first 比較

| 項目 | 値 |
| --- | --- |
| 比較表 | **未作成**（前提タスク #2 で作成予定だった） |
| 採用根拠 | 元タスク decisive-mode Phase 3 の CONDITIONAL ACCEPT のみ |
| 結論 | 案 A 維持（fallback 案 B は未評価） |
| 取り扱い | **BLOCKED → FORCED-PASS（ユーザー承認）** |

### R-3 判定

- 通常運用なら FAIL → No-Go
- ユーザー選択肢 C 承認により **FORCED-PASS**
- 派生条件: 案 A が他 project 副作用で問題化した場合の rollback ガイドを Phase 12 documentation-changelog に明記する想定

## 5. R-4: whitelist 衝突

### 既存 project allow/deny サマリ（再掲）

- 既存 allow: 139 件
- 既存 deny: 13 件
- 既存 ask: 3 件

### whitelist-design.md と current canonical §4 の差分（AC-2 対応・必須記載）

| 項目 | whitelist-design.md（旧設計） | claude-code-settings-hierarchy.md §4（current canonical） | 差分 |
| --- | --- | --- | --- |
| allow `Bash(pnpm install)` 等 | `Bash(pnpm *)` 広範 | 個別列挙（install/typecheck/lint/test） | 粒度差 |
| allow `Bash(mise *)` | あり | なし | 旧のみ |
| allow `Bash(gh *)` | あり | なし | 旧のみ |
| allow `Bash(bash scripts/cf.sh *)` | あり | なし | 旧のみ |
| allow `Read(*) / Edit(*) / Write(*)` | あり | なし | 旧のみ |
| allow `Bash(git status)` | `Bash(git *)` 包含 | 明示列挙 | 粒度差 |
| deny `Bash(wrangler *)` | あり | なし | 旧のみ |
| deny `Read(.env)` | あり | なし | 旧のみ |
| deny `Bash(rm -rf /*)` | あり | `Bash(rm -rf /:*)` | 記法差 |
| deny `Bash(curl * | sh:*)` | なし | あり | §4 のみ |

### 既存 project allow/deny との衝突

| 項目 | 既存 (139/13) | §4 (7/4) | 衝突 | 解消方針 |
| --- | --- | --- | --- | --- |
| `Bash(pnpm install)` | 既存 `Bash(pnpm:*)` で包含 | §4 個別 | 衝突なし | 既存維持 |
| `Bash(git push --force:*)` | 既存 deny に `Bash(git push --force:*)` あり | §4 deny に同一 | 一致 | 維持 |
| `Bash(rm -rf /:*)` | 既存 deny に `Bash(rm -rf /:*)` あり | §4 deny に同一 | 一致 | 維持 |
| `Bash(curl * | sh)` | 既存 deny に `Bash(curl * | sh)` あり | §4 deny に同一 | 一致 |
| `Bash(curl * | bash)` | 既存 deny にあり | §4 になし | 既存追加項目 | 維持（CLAUDE.md 準拠の安全項目） |

### R-4 判定

- **PASS（採用候補 (b)）**
- 既存 139 allow / 13 deny を維持し、§4 の minimum guarantee（allow 7 + deny 4）はすべて既存に包含 or 一致
- 衝突件数 = 0
- whitelist-design.md（旧設計）は採用しない（粒度が広く、既存と矛盾する `Bash(wrangler *)` deny も含むため）

## 6. R-5: 不変条件チェック

| 項目 | 結果 | 根拠 |
| --- | --- | --- |
| グローバル波及が `impact-analysis.md` に明文化 | **PASS** | §2 の表で 13 ファイル全件評価済 |
| 平文 `.env` / API token / OAuth token 不記録 | **PASS** | inventory.md の `env` 配下はキー名のみ。`cat ~/.env` は不実施 |
| `wrangler` 直接実行禁止違反なし | **PASS** | 本タスクで wrangler 未呼出。topology.md でも `Bash(wrangler *)` を直接 allow に追加していない |
| `~/Library/Preferences/.wrangler/config/default.toml` の OAuth 残置を持ち込まない | **PASS** | 本タスクは Cloudflare 認証を一切扱わない |

### R-5 判定

- **PASS（4/4）**

## 7. 総合判定

| 観点 | 判定 |
| --- | --- |
| R-1 | PASS（条件付き・ユーザー承認） |
| R-2 | BLOCKED → FORCED-PASS |
| R-3 | BLOCKED → FORCED-PASS |
| R-4 | PASS（候補 (b) 採用） |
| R-5 | PASS |

→ **FORCED-GO**（go-no-go.md で最終判定マトリクス記載）
