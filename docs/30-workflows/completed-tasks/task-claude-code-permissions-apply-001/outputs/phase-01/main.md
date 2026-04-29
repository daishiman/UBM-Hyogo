# Phase 1 main: 要件定義サマリ

## 確定メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | `implementation`（host 環境ファイル書き換え） |
| visualEvidence | `NON_VISUAL`（CLI 出力テキスト主証跡） |
| docsOnly | false（実機反映を含む。ただし Phase 1〜3 は調査・設計のみ） |
| 実行種別 | `completed_with_blocked_followup`（Phase 3 ユーザー強行承認により実機反映完了、TC-05 は前提結論未取得のため継続管理） |
| user_approval_status | 選択肢 C（前提タスクスキップ）でユーザー強行承認済 |

## 機能要件 (F)

- **F-1**: settings 3 層の `defaultMode` を `bypassPermissions` で統一
  - ただし実機 inventory（Phase 1）で **`defaultMode` は root 直下ではなく `permissions.defaultMode` 配下に置かれている**ことが判明。Phase 2 で正本キーパスを確定する（論点 P-1）
- **F-2**: `cc` alias を `CC_ALIAS_EXPECTED = "claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions"` に正準化
  - 実機正本ファイルは **`~/.config/zsh/conf.d/79-aliases-tools.zsh`**（`~/.zshrc` ではない）
- **F-3**: `<project>/.claude/settings.json` の `permissions.allow` / `deny` を current canonical（`claude-code-settings-hierarchy.md` §4）に整合させる
  - whitelist-design.md（旧設計）と current canonical で **顕著な差分**あり（Phase 2 topology.md / Phase 3 impact-analysis.md で明示）
- **F-4**: backup（`*.bak.<TS>` / TS=`%Y%m%d-%H%M%S`）と rollback 手順を整備

## 非機能要件 (N)

- **N-1**: `.env` 実値・API token・OAuth token を成果物・log に記録しない（キー名のみ可）
- **N-2**: グローバル `~/.claude/settings.json` 変更による他 project 波及を最小化（影響範囲を Phase 3 で明文化）
- **N-3**: NON_VISUAL 主証跡（screenshot 不要、CLI 出力ログを正本とする）

## スコープ

含む: E-1（settings 3 層）/ E-2（`cc` alias）/ E-3（whitelist allow/deny）/ backup・rollback。
含まない: bypass 下 deny 実効性検証・project-local-first 比較・MCP/hook 検証・`Edit`/`Write` whitelist 化・enterprise managed settings。

## 後続 Phase への引き渡し

- Phase 2 設計入力: `inventory.md` の現値 + `whitelist-design.md` と current canonical §4 の差分注記
- Phase 3 レビュー観点: 必須前提タスク 2 件未実施 + ユーザー強行承認 → FORCED-GO 判定の根拠記録
- Phase 4 以降は本タスクではなく別エージェントが実機書き換えを担う（Phase 5 runbook）

## artifacts.json 整合確認

- `phases[0].outputs` = `["outputs/phase-01/main.md", "outputs/phase-01/inventory.md", "outputs/phase-01/carry-over.md"]` と完全一致
