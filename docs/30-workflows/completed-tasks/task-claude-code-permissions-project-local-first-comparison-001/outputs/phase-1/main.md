# Phase 1 Output: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 上流 | - |
| 下流 | Phase 2（設計） |
| 状態 | pending → completed（本ファイル生成時点） |
| visualEvidence | NON_VISUAL |
| タスク種別 | docs-only / spec_created |

## 0. 結論サマリ

本タスクは **設計のみ**（`spec_created` / `docs-only` / `NON_VISUAL`）の比較設計タスクであり、
実 `~/.claude/settings.json` / `~/.zshrc` / 各プロジェクト `.claude/settings*.json` の書き換えは
行わない。書き換えは後続の `task-claude-code-permissions-apply-001` で行う。

ゴールは、Claude Code 4 層 settings 階層の責務を確定し、prompt 復帰防止のための
3 候補（案 A / 案 B / ハイブリッド）を 5 評価軸で比較する **設計枠組みを Phase 2 へ
引き渡せる粒度で固定** すること。

## 1. 真の論点（5 個）

要件定義の真の論点は以下に集約される。Phase 2 / Phase 3 で各論点に 1 結論を出すことが
本タスクの完了条件である。

1. **層責務の明文化**: `global` / `global.local` / `project` / `project.local` の各層が
   「誰の」「どの判断」を表現する層か（マシン横断既定 / 実機固有 override / リポジトリ共有 / 個人 override）。
2. **project-local-first（案 B）単独での再発防止可否**: 新規 worktree / fresh プロジェクトで
   `bypassPermissions` を維持できるかを、公式仕様引用または読み取り専用観測で 1 結論として記録できるか。
3. **案 A（global + shell alias 強化）の他プロジェクト副作用**: `scripts/cf.sh`（Cloudflare CLI ラッパー）、
   `op run --env-file=.env`（1Password による secret 動的注入）、他 worktree の権限評価に副作用を与えないか。
4. **fresh 環境の許容可否**: `global.local` / `project.local` 未配置の fresh 環境で
   常時 bypass が適用されるリスクを、個人開発マシン限定という前提で許容できるか。
5. **rollback 経路の確定**: global を変更する案を採用する場合、差分保存と復元コマンドを
   実書き換え前に確定できているか。

## 2. P50 チェック

| 項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | No | 本タスクは spec のみ。実装は apply タスク |
| upstream にマージ済みか | No | 該当なし |
| 前提タスクが完了済みか | Yes | `task-claude-code-permissions-decisive-mode` Phase 3 / 12 を入力に使用 |

> `workflow: spec_created` / `taskType: docs-only` / `visualEvidence: NON_VISUAL`。
> コードは書かず比較設計ドキュメントのみを作成する。

## 3. 現状ダンプ要件（読み取りのみ・キー名のみ）

実値（API token 値、OAuth token 値、`.env` 中身、`apiKey` フィールド値）は
AI コンテキストへ持ち込まないため記録しない。**抽出するのはキー名のみ**。

| 階層 | パス | 抽出するキー名（値は記録しない） |
| --- | --- | --- |
| global | `~/.claude/settings.json` | `defaultMode`, `permissions.allow`（配列キー存在のみ）, `permissions.deny`, `env`（キー名のみ） |
| global.local | `~/.claude/settings.local.json` | 同上 |
| project | `<project>/.claude/settings.json` | 同上 |
| project.local | `<project>/.claude/settings.local.json` | 同上 |
| シェル | `~/.zshrc` および `~/.config/zsh/conf.d/*-claude.zsh` | `cc` 関連 alias 行の有無のみ |
| 他プロジェクト | `~/dev/**/.claude/settings.json` | `defaultMode` 明示プロジェクトの件数（`grep` メタ情報のみ） |

> CLAUDE.md の禁止事項に従い、`.env` の中身を `cat` / `Read` / `grep` で表示・読み取らない。
> API Token 値・OAuth トークン値を出力やドキュメントに転記しない。

## 4. 既知の前提

- `task-claude-code-permissions-decisive-mode` Phase 3（`main.md` / `impact-analysis.md`）と Phase 12 成果物が参照可能。
- 案 A は同タスク Phase 3 にて **CONDITIONAL ACCEPT**（個人開発マシン限定 / R-2 BLOCKER 解消が前提）。
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §1 に
  4 階層の優先順位が `projectLocal > project > globalLocal > global` と記録されている。
- 同 §3 で `--dangerously-skip-permissions` 併用案が示されているが、`permissions.deny` 実効性は
  `task-claude-code-permissions-deny-bypass-verification-001` で確認するまで未確定。
- 個人開発マシン上で各層 settings の **読み取り** 権限はある（書き換えはしない）。

## 5. 機能要件

| ID | 内容 | 受入条件への紐付け |
| --- | --- | --- |
| F-1 | 4 層（global / global.local / project / project.local）の責務・優先順位・想定利用者・変更頻度・git 管理可否・担当キーを 1 表に集約する設計を確定する | AC-1 |
| F-2 | project-local-first 単独での再発有無を「公式仕様引用」または「fresh プロジェクト読み取り専用観測」で判定する手順を確定する | AC-2 |
| F-3 | 案 A / 案 B / ハイブリッドの trade-off を 5 評価軸（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動）で比較する設計を確定する | AC-3, AC-6, AC-7 |
| F-4 | 採用案を 1 つに確定し `task-claude-code-permissions-apply-001` 指示書の参照欄に本ドキュメントを追記する依頼を Phase 12 で残す | AC-4, AC-9 |
| F-5 | global 採用時の rollback 手順（差分保存 / 復元コマンド）を Phase 5 比較表に併記する設計を確定する | AC-5 |

## 6. 非機能要件

| ID | 内容 |
| --- | --- |
| N-1 | 設計のみで完結し、実コードや実 settings ファイルを本タスクで書き換えない（spec_only） |
| N-2 | `.env` 実値や API token を一切ドキュメントに残さない（CLAUDE.md ルール準拠） |
| N-3 | 他プロジェクトへの影響を Phase 3 で評価可能な粒度（件数 + 一覧）で記述する |
| N-4 | 比較表の各セルに出典スロット（公式 docs / 実機ログ / Phase 3 シナリオ）を 1 つ以上紐付ける |
| N-5 | Phase 3 シナリオ A〜D との対応を比較表で明示する（AC-7） |
| N-6 | `wrangler` 直接実行は勧めない。Cloudflare CLI 文脈に触れる場合は `scripts/cf.sh` 経由を前提とする |

## 7. スコープ外（明示的に含まない）

- 実 `~/.claude/settings.json` / `~/.zshrc` への書き込み（→ `task-claude-code-permissions-apply-001`）
- bypass モード下の `permissions.deny` 実効性検証（→ `task-claude-code-permissions-deny-bypass-verification-001`）
- MCP server / hook の permission 挙動検証（U4 候補・unassigned）
- Claude Code SDK のソース変更
- CI / pre-commit hook の追加変更
- secrets 管理（`.env` / 1Password）の改修

## 8. タスク分類

- タスク種別: `docs-only` / `spec_created`
- 視覚証跡: `NON_VISUAL`（Phase 11 はスクリーンショット不要、`manual-smoke-log.md` を主証跡とする）
- 証跡の主ソース: `phase-05/comparison.md`（比較表本体）/ `phase-12/implementation-guide.md` /
  `phase-11/manual-smoke-log.md`

## 9. 受入条件（再掲）

`index.md` の AC-1〜AC-10 を本 Phase の対象とする。本 Phase 単独での完了条件は以下。

- [x] 「真の論点」が 5 件として記載されている
- [x] 「現状ダンプ要件（キー名のみ）」が記録されている
- [x] 「前提条件」が引用元と共に記録されている
- [x] 「機能要件 / 非機能要件」が ID 付きで記録され受入条件に紐付いている
- [x] 「スコープ外」が明示されている

## 10. 次 Phase へのハンドオフ

Phase 2 へ申し送るアイテム:

1. **4 層責務表の暫定列構成**（階層 / パス / 想定利用者 / 変更頻度 / git 管理可否 / 担当キー）を Phase 2 設計入力として渡す。
2. **5 評価軸**（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動）を Phase 2 比較軸決定入力として渡す。
3. **推奨アプローチ**: 「案 B（project-local-first）を default、案 A を fresh 環境補強の fallback とする
   ハイブリッド」を起点に評価する旨を Phase 2 へ申し送る（`claude-code-settings-hierarchy.md` §3 の
   blocker 状態を踏まえた防御的アプローチ）。
4. **読み取り専用観測のみ許可**: Phase 2 の 4 層責務表ドラフト作成にあたっても、実値の転記は禁止。

apply タスクへ申し送るアイテム（Phase 12 にて文書化予定）:

- 採用案決定後、apply タスク指示書の「参照」欄に本タスク outputs（特に Phase 5 `comparison.md` /
  Phase 3 `impact-analysis.md`）を追記する依頼を `documentation-changelog.md` または
  `unassigned-task-detection.md` に内包する。

## 11. 参照資料

- `index.md`（本タスク）
- `phase-01.md`（本 Phase 仕様）
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §1, §3
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`
- `CLAUDE.md`（プロジェクトルート / 「Claude Code 設定」「シークレット管理」節）
