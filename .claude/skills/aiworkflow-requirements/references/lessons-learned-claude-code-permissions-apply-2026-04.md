# Lessons Learned — Claude Code permissions 実機反映（2026-04-28）

> task-claude-code-permissions-apply-001（implementation / NON_VISUAL / host 環境書き換え）の Phase 1〜13 完了に伴う苦戦箇所と再発防止知見。
> 関連正本: `references/claude-code-settings-hierarchy.md` / `doc/00-getting-started-manual/claude-code-config.md`
> 出典タスク: `docs/30-workflows/task-claude-code-permissions-apply-001/`（クローズ時に `completed-tasks/` 配下へ移動予定）
> 期間: 2026-04-28（TS=`20260428-192736`）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `LOGS.md` / `indexes/topic-map.md`（後段の generate-index.js で再生成）

---

## 教訓一覧

### L-CCP-APPLY-001: NON_VISUAL タスクで `screenshots/` を物理的に作らない

- **状況**: 設定ファイル変更（CLI / settings.json / zshrc）のみで UI 変更ゼロのため、`screenshots/.gitkeep` を残していたが Phase 11 で意味不明な空ディレクトリとして検出された。
- **原因**: `validate-phase-output.js` が screenshots/ の存在を画面証跡有とみなし、`visualEvidence: NON_VISUAL` の宣言と矛盾した。
- **教訓 / How to apply**:
  1. NON_VISUAL タスクでは `screenshots/` を作らない（`.gitkeep` も置かない）。CLI 出力テキストを主証跡とする。
  2. `validate-phase-output.js` 側を「`visualEvidence=NON_VISUAL` の場合は screenshots ディレクトリ不要」と判定するよう既に修正済み。
- **適用条件**: `taskType: docs-only || implementation` かつ `visualEvidence: NON_VISUAL`
- **具体パス**: `.claude/skills/task-specification-creator/scripts/validate-phase-output.js`

### L-CCP-APPLY-002: host 環境書き換えタスクは backup-manifest / runbook-execution-log / manual-smoke-log の 3 点セットを必須化

- **状況**: `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.json` / `~/.zshrc` の 4 ファイル書き換えで、backup なしに編集すると rollback 不能となるリスクがあった。
- **教訓 / How to apply**:
  - `outputs/phase-11/` に以下の 3 点セットを必須成果物として配置する:
    - `backup-manifest.md`: backup ファイルパス・サイズ・hash・TS 一覧
    - `runbook-execution-log.md`: runbook の Step 単位の実行結果（時刻・コマンド・stdout/stderr 抜粋）
    - `manual-smoke-log.md`: TC 実行結果（CLI テキストを主証跡）
  - これは host 環境書き換え系の標準テンプレとして設計タスク仕様書に組込む。
- **適用条件**: `~/.{claude,zshrc,config/zsh}` 等の host 環境ファイル書き換え系タスク全般
- **将来的な再利用ポイント**: `task-claude-code-permissions-deny-bypass-verification-001`、`task-claude-code-permissions-project-local-first-comparison-001`、shell 設定変更系タスク

### L-CCP-APPLY-003: タイムスタンプ `TS` の sticky 化（Phase 5 冒頭で発行 → 一貫使用）

- **状況**: backup ファイル名・rollback 手順・Phase 11 メタで TS が揺れると（個別に再発行したり）、どの backup が正本か判別不能になる。
- **教訓 / How to apply**:
  - Phase 5 runbook 冒頭で `TS=$(date +%Y%m%d-%H%M%S)` を 1 度だけ発行し、以降の backup ファイル名（`*.bak.${TS}`）・rollback 手順・Phase 11 メタすべてで同じ値を再利用する。
  - 実行記録ノートに `${TS}` を即時転記してフローから外れない仕組みにする。
- **適用条件**: backup を伴う host 環境書き換え系タスク
- **具体例**: `TS=20260428-192736` を runbook → backup-manifest → manual-smoke-log で同一に保つ

### L-CCP-APPLY-004: FORCED-GO + TC BLOCKED 経路の標準化（前提タスク未実施でも判定可能なフロー）

- **状況**: 前提タスク `task-claude-code-permissions-deny-bypass-verification-001`（bypass 下 deny 実効性検証）が未完了のまま本タスクを進める判断を行った。TC-05（bypass 下の deny 実効性確認）は前提結論未取得のため実行できず、BLOCKED と記録した。
- **教訓 / How to apply**:
  - **FORCED-GO + TC BLOCKED 経路** を標準フローとして採用する:
    1. 前提タスクをスキップする際は `forced-go-rationale.md`（Phase 10 内）に GO 判定根拠を明記
    2. 前提結論が必要な TC は `manual-smoke-log.md` に **BLOCKED** ステータスで記録（PASS / FAIL と区別）
    3. Phase 10 review 判定は「BLOCKED は FAIL ではない」前提で **Go** を出す
    4. Phase 12 メタを `completed（TC-XX BLOCKED 注記付き）` で確定し、注記なしの `completed` と区別する
  - 元タスクの skill-feedback-report.md にも「実反映完了（TC-05 BLOCKED 注記付き）」を追記する。
- **適用条件**: 前提タスクが unassigned のまま、後段タスクが時間制約等で先行実装される場面
- **将来的な再利用ポイント**: 同様に依存検証タスクが残るアプリケーション系タスク全般
- **詳細**: `references/claude-code-settings-hierarchy.md` §「FORCED-GO + TC BLOCKED 経路」

### L-CCP-APPLY-005: zsh conf.d 経路（`~/.zshrc` 直書き禁止 / `~/.config/zsh/conf.d/` 配置 / 個別 source）

- **状況**: `cc` alias を `~/.zshrc` に直書きすると、tool 別の alias 群（`cc` / `cf` / 他 CLI ラッパー）が混ざり、責務分離が破れて保守性が下がる。
- **教訓 / How to apply**:
  - alias は `~/.config/zsh/conf.d/79-aliases-tools.zsh` に配置する命名規約 `<priority>-<scope>-<topic>.zsh` を採る
  - `~/.zshrc` からは `for f in ~/.config/zsh/conf.d/*.zsh; do source "$f"; done` の単一 loader のみ
  - 競合検出は `grep -nE '^alias cc=' ~/.zshrc ~/.config/zsh/conf.d/*.zsh` を実行し 1 行のみであることを TC-R-01 として強制
- **適用条件**: zsh ユーザーで複数 CLI ラッパー alias を持つ環境
- **具体パス**: `~/.config/zsh/conf.d/79-aliases-tools.zsh`
- **詳細**: `references/claude-code-settings-hierarchy.md` §「zsh conf.d 経路」

### L-CCP-APPLY-006: settings.json 階層優先順位の運用適用（projectLocal > project > globalLocal > global）

- **状況**: 3 層 settings の `defaultMode` 不整合（global=`acceptEdits`, globalLocal=`bypassPermissions`, project=`bypassPermissions`）状態で「どの値が effective か」が公式 docs で即決できず、起動条件によって effective mode が揺れた。
- **教訓 / How to apply**:
  - 階層優先順位は **projectLocal > project > globalLocal > global**（上層が下層を完全上書き、配列マージはしない）
  - 信頼境界が確立された開発環境では 3〜4 層すべてを `bypassPermissions` で揃えることで揺れを根絶
  - 信頼境界が確立できないプロジェクトは projectLocal を `acceptEdits` にして上層を抑制（project-local-first 案）
  - settings 編集後は 4 ファイルすべてに JSON validity 検証を必須化（`node -e "JSON.parse(...)"`）
- **適用条件**: Claude Code の起動 mode 不整合トラブル切り分け / 別 worktree や別マシンへの settings 移植時
- **具体パス**: `references/claude-code-settings-hierarchy.md` §1

### L-CCP-APPLY-007: bypass 下でも deny は継続適用（Anthropic 仕様 / claude-code-config.md 注記化）

- **状況**: `--dangerously-skip-permissions` 下で `permissions.deny` が実効するか不明瞭なため、危険コマンド（`git push --force` 等）が deny を素通りするリスクが残っていた。
- **教訓 / How to apply**:
  - Anthropic 公式仕様に基づき **bypass 下でも `permissions.deny` は継続適用される**（claude-code-config.md に注記済み）。
  - ただし実機での再現確認は別タスク `task-claude-code-permissions-deny-bypass-verification-001` で実施する（本タスクでは TC-05 BLOCKED として保留）。
  - alias から `--dangerously-skip-permissions` を外すか否かの判断は、上記検証タスクの結論を必ず待つ。
- **適用条件**: bypass mode を採用するすべての Claude Code 利用者
- **具体パス**: `doc/00-getting-started-manual/claude-code-config.md`（注記済み）

---

## 申し送り（open / baseline 未タスク）

- **U2**（unassigned 配置済み）: bypass × deny 実効性検証 — `docs/30-workflows/unassigned-task/task-claude-code-mcp-hook-permission-verification-001.md`（部分包含）
- **U3**（unassigned 配置済み）: project-local-first 比較設計 — 同 `unassigned-task/` 配下
- **U6**（LOW）: `Edit` / `Write` の whitelist 化 — Phase 10 MINOR として保留中
- **B-1**（baseline）: 各 worktree への conf.d 経路 reinstall runbook 運用化

---

## 関連 references

- `references/claude-code-settings-hierarchy.md`（階層優先順位 / FORCED-GO + TC BLOCKED 経路 / zsh conf.d 経路）
- `doc/00-getting-started-manual/claude-code-config.md`（適用先正本 / bypass 下 deny 注記）
- `references/lessons-learned-lefthook-unification-2026-04.md`（DevEx wave 同源タスク）
