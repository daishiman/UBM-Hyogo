# MCP server / hook の permission 挙動検証 - タスク指示書

## メタ情報

| 項目         | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| タスクID     | task-claude-code-mcp-hook-permission-verification-001             |
| タスク名     | MCP server / hook の permission 挙動検証                          |
| 分類         | 検証                                                              |
| 対象機能     | Claude Code permission system（MCP / hook 経路）                  |
| 優先度       | 中                                                                |
| 見積もり規模 | 中規模                                                            |
| ステータス   | 未実施                                                            |
| 発見元       | task-claude-code-permissions-project-local-first-comparison-001 Phase 12 |
| 発見日       | 2026-04-28                                                        |
| 関連 Issue   | #167（既存・OPEN・本タスクで仕様書本体を充実化）                  |
| visualEvidence | NON_VISUAL                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-project-local-first-comparison-001` のスコープは **`Bash` / `Edit` / `Write` 系の通常 tool に対する 4 層 settings の挙動比較** に限定された。同タスクの `index.md` §2.3「含まないもの」で「MCP server / hook の permission 挙動検証（U4 候補）」が明示的に分離され、Phase 12 `unassigned-task-detection.md` で未タスク化候補 #4 として記録されている。

MCP server（`mcp__*` で始まる tool）と hook（`PreToolUse` / `PostToolUse` / `UserPromptSubmit` 等）は permission 評価経路が通常 tool と異なる可能性があり、`bypassPermissions` モード下でも:
- MCP tool は `permissions.deny` の対象になるか
- hook 実行時に shell コマンドが個別に permission 評価されるか
- `--dangerously-skip-permissions` が MCP / hook を含めて全スキップするのか

が現時点では未確認である。

### 1.2 問題点・課題

- 採用案（ハイブリッド）が MCP / hook に対しても期待通りに動くかが未検証
- bypass モード下で意図せず MCP tool 経由の機微操作（Gmail / Drive / Notion など）がスキップされるリスク
- hook で `wrangler` を直接呼ぶようなコマンドが評価対象外になっていないか（CLAUDE.md `wrangler` 直接実行禁止ルールとの整合）
- 公式仕様の記載が tool 種別ごとに散在しており、1 箇所にまとまっていない

### 1.3 放置した場合の影響

- bypass 運用下で MCP tool が想定外に許可され、外部システム（Gmail / Drive / Notion / Calendar）への意図しないアクセスを招く
- hook 経由のコマンド実行が `Bash(wrangler *)` deny を回避し、CLAUDE.md ルールが実効性を失う
- 採用案の rollback コスト見積もり（Phase 5 §3）が MCP / hook 分の漏れにより過小評価のままになる

---

## 2. 何を達成するか（What）

### 2.1 目的

MCP server / hook 経路の permission 評価挙動を、4 層 settings 採用案（ハイブリッド）と `--dangerously-skip-permissions` の組み合わせ別に検証し、追加の deny / allow ルールが必要かを確定する。

### 2.2 最終ゴール

- MCP tool が `permissions.deny` / `permissions.allow` の評価対象になるか YES/NO で確定
- hook 経由コマンドが Bash 系 deny ルールの評価対象になるか YES/NO で確定
- bypass / `--dangerously-skip-permissions` 下での MCP / hook 挙動が表で整理
- 必要な追加ルール（例: `mcp__*` の deny テンプレ）が apply タスクへハンドオフ可能な粒度で記述

### 2.3 スコープ

#### 含むもの

- MCP tool（`mcp__*`）に対する settings 4 層の評価挙動の実機検証
- hook（`PreToolUse` / `PostToolUse` / `UserPromptSubmit`）が起動するコマンドの permission 評価挙動の実機検証
- `bypassPermissions` モードと `--dangerously-skip-permissions` flag の差異整理
- 採用案ハイブリッドにおける追加 deny ルール候補の提案

#### 含まないもの

- 通常 tool（`Bash` / `Edit` / `Write` 等）の挙動検証（comparison-001 で完了済み）
- 実 `~/.claude/settings.json` / `~/.zshrc` の書き換え（`task-claude-code-permissions-apply-001`）
- `--dangerously-skip-permissions` の deny 実効性検証（`task-claude-code-permissions-deny-bypass-verification-001`、ただし MCP / hook 観点での補完を本タスクで行う）
- 新規 MCP server の選定 / 構築

### 2.4 成果物

- MCP / hook permission 挙動マトリクス（settings 階層 × bypass モード × `--dangerously-skip-permissions`）
- 公式仕様引用または実機ログ（NON_VISUAL の `manual-smoke-log.md` 形式）
- 追加 deny / allow ルール案（apply タスクへのハンドオフ箇条書き）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-apply-001` の採用案が確定し実 settings に反映されていること（または fresh 環境で再現可能なこと）
- 検証対象 MCP server が少なくとも 1 つ動作していること（現環境で利用可能な `mcp__claude_ai_*` 系）
- 検証用 hook を一時的に追加してよい sandbox / fresh プロジェクトが用意できること

### 3.2 検証シナリオ（案）

| シナリオ | 設定 | 実行 | 期待 / 確認 |
| --- | --- | --- | --- |
| S1 | project.local: `defaultMode: bypassPermissions` | `mcp__*` tool 呼び出し | bypass がかかるか / deny ルールが効くか |
| S2 | global: `permissions.deny: ["mcp__claude_ai_Gmail__*"]` | 同 MCP tool 呼び出し | deny が効くか |
| S3 | hook (`PreToolUse`) で `wrangler` を呼ぶ | tool 実行時に hook 起動 | hook 内 `wrangler` が `Bash(wrangler *)` deny の対象になるか |
| S4 | `--dangerously-skip-permissions` flag 起動 | 上記 S1〜S3 を再実行 | flag が MCP / hook をスキップするか |
| S5 | project: `permissions.allow: ["mcp__*"]` のみ | 任意 MCP tool 呼び出し | 階層優先順位が MCP にも適用されるか |

### 3.3 想定される苦戦箇所（次回への知見）

- **公式 docs の散在**: MCP / hook の permission 挙動は通常 tool と別ページに散らばっている可能性が高く、引用元の網羅に時間がかかる
- **fresh 環境の準備**: 既存 settings 履歴が混入すると検証結果が汚染されるため、別ホーム or サンドボックスでの fresh 検証が必要
- **MCP server 認証フローの副作用**: `mcp__claude_ai_*` 系は OAuth が必要で、検証中に認証 token を取得・破棄する手順が増える。CLAUDE.md「API Token を出力やドキュメントに転記しない」ルール準拠が必須
- **hook の副作用伝播**: 検証用 hook が他タスクのコミット履歴に混ざらないよう、検証ブランチを切って終了時に削除する運用が要る
- **`scripts/cf.sh` ラッパーとの整合**: hook 経由で `wrangler` を呼ぶシナリオを試す際、CLAUDE.md の `wrangler` 直接実行禁止ルールに違反しないよう「検証目的の例外であることを明示」する必要がある

### 3.4 受入条件 (AC)

- AC-1: シナリオ S1〜S5 の実行ログが `manual-smoke-log.md` 形式で記録されている
- AC-2: MCP tool が `permissions.deny` / `permissions.allow` の対象か YES/NO が結論として明記
- AC-3: hook 経由コマンドが Bash 系 deny の対象か YES/NO が結論として明記
- AC-4: bypass モードと `--dangerously-skip-permissions` の差異が表で整理されている
- AC-5: 追加 deny / allow ルール案が apply タスクへのハンドオフ箇条書きで揃う
- AC-6: 公式仕様引用または fresh 実機ログのいずれかが各結論の根拠として記載
- AC-7: `wrangler` 直接実行 / `.env` 中身読み取り / API token 転記など CLAUDE.md 禁止事項を踏まないこと

---

## 4. 関連タスク

| タスクID | 関係 |
| --- | --- |
| task-claude-code-permissions-project-local-first-comparison-001 | 起票元（U4 候補） |
| task-claude-code-permissions-apply-001 | 前提（採用案反映後の検証） |
| task-claude-code-permissions-deny-bypass-verification-001 | 並行（通常 tool 側の deny 検証） |
| task-new-worktree-claude-settings-template-001 | 並行（worktree 初期化） |

## 5. 参照資料

- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/index.md` §2.3（含まないもの）
- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-12/unassigned-task-detection.md`（候補 #4）
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`（settings 4 層）
- `CLAUDE.md`（`wrangler` 直接実行禁止 / シークレット管理）
- Anthropic 公式 docs（MCP server / hook / permission 仕様）

## 6. 苦戦箇所（将来の同種タスクへの知見）

本未タスクの仕様化過程で気付いた事項:

- **「含まないもの」の明示が次タスク発見の起点**: 起票元タスクの §2.3 で「含まないもの」を明確にしておくと、本タスクのように後続未タスクが粒度を保ったまま分離できる。逆に「全部やる」スコープにすると比較設計と挙動検証が混ざり、Phase 5 比較表の鋭さが失われる。
- **MCP / hook と通常 tool の deny ルールは別系統で考える**: 通常 tool の `Bash(...)` パターンと MCP の `mcp__*` パターンはマッチング規則が異なる可能性が高く、deny ルールを統合的に書く前に評価経路の差を確認しないと誤った deny を書きやすい。
- **NON_VISUAL の証跡形態**: 検証は CLI 経路で完結するため screenshots は不要。`manual-smoke-log.md` に「コマンド / 期待 / 実結果 / 差分」を 1 行ずつ書く形式が最も再現性が高い。
- **OAuth トークン取り扱い**: MCP 系検証では一時 token が発生する。検証ログに token 値・refresh token を絶対に貼らない運用を Phase 1 で明文化する必要がある（CLAUDE.md 準拠）。
