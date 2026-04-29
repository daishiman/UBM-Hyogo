# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| Issue | #142（CLOSED のまま運用） |

## NON_VISUAL 宣言

- **タスク種別**: 比較設計（spec_only / docs-only）。実 settings / shell alias の書き換えは行わない
- **非視覚的理由**: UI 変更なし。証跡は CLI 出力テキスト（`cat ~/.claude/settings.json | jq '.defaultMode'` 等）と公式仕様引用のみで取得可能
- **代替証跡**: `outputs/phase-11/manual-smoke-log.md`（読み取り専用 CLI 観測ログ）と `outputs/phase-11/link-checklist.md`（参照リンクチェック）

> **本タスクは `workflow: spec_only`**。Phase 11 は **シナリオ設計と読み取り専用検証ログの確定**に限定する。実書き換えは `task-claude-code-permissions-apply-001` で行う。
> SKILL.md の docs-only NON_VISUAL ルールに従い、`screenshots/` は作成しない（`screenshots/.gitkeep` も置かない）。

## 証跡の主ソース

| 項目 | 値 |
| --- | --- |
| 主ソース | `manual-smoke-log.md`（読み取り専用 CLI 出力チェックリスト） |
| 補助ソース | `link-checklist.md`（参照リンク疎通） |
| スクリーンショット非取得理由 | UI 表示変更がなく、`defaultMode` の値・公式 docs 引用文・他プロジェクト `.claude/settings.json` の grep 結果で判定可能 |
| 実施情報 | ソース MD §6 の TC-01〜TC-04 を実機読み取りで実行（書き換え禁止） |

## テストシナリオ実行計画（ソース §6 由来）

ソース MD §6 のテストケースを以下の順序で実行する。すべて読み取り専用（書き換えなし）。

| 順序 | TC | 概要 | 期待 |
| --- | --- | --- | --- |
| 1 | TC-01 | project-local-first 単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか（仕様 or 実機） | 仕様 / 実機ログから 1 結論で判定 |
| 2 | TC-02 | 案 A 適用後、他プロジェクトの最終 `defaultMode` が変化しないことをシナリオ A / B で確認（読み取り模擬） | 変化なしと予測される根拠が文書化 |
| 3 | TC-03 | 案 A 適用後、fresh 環境（シナリオ C）で意図せず bypass 化することの許容判断 | 採否判断と理由が記録 |
| 4 | TC-04 | rollback 手順を dry-run で読み合わせ（実書き換えは禁止） | 手順に欠落なし |

## 読み取り専用検証コマンド（書き換え禁止）

```bash
# 現状値の参照のみ
cat ~/.claude/settings.json | jq '.defaultMode'
ls -la ~/.claude/settings.local.json 2>/dev/null
grep -r "defaultMode" ~/dev/**/.claude/settings.json 2>/dev/null

# 比較表のレビュー
$EDITOR docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-5/comparison.md
```

> **禁止コマンド**: `~/.claude/settings.json` および `~/.zshrc` への `>` リダイレクト / `sed -i` / `jq --arg ... | sponge` による書き換え。書き換えは `task-claude-code-permissions-apply-001` 専管。

## 結果記録フォーマット

各 TC について `manual-smoke-log.md` に以下を記録:

```markdown
### TC-XX: <名称>
- 実施日時: YYYY-MM-DD HH:MM
- 実行コマンド: `<読み取り専用コマンド>`
- 期待結果: <expected>
- 実観測結果 / 引用元: <actual or 公式 docs URL>
- 判定: PASS | FAIL | BLOCKED
- 備考: <env blocker / 補足>
```

## 既知の制限

- 本タスクは spec_only。書き換えを伴う実観測は `task-claude-code-permissions-apply-001` で実施
- `task-claude-code-permissions-deny-bypass-verification-001` の結果が未着の場合、TC に「deny 実効性」軸は含めない（Phase 9 で Phase 8 にループバックする条件として残す）

## 主成果物

- `outputs/phase-11/main.md`（実行計画と Go/NoGo 判定の入口）
- `outputs/phase-11/manual-smoke-log.md`（TC-01〜TC-04 の読み取り専用ログ・チェックリスト）
- `outputs/phase-11/link-checklist.md`（参照リンクチェック結果）

## 完了条件

- [ ] skill 準拠の完了条件を満たす
- [ ] TC-01〜TC-04 が `manual-smoke-log.md` に記録されている（読み取り専用結果または公式仕様引用）
- [ ] `link-checklist.md` で全リンク疎通確認済み
- [ ] 書き換え実行が 0 件であることを `git diff -- ~/.claude` 模擬または手順記録で確認

## Skill準拠補遺

## 目的

本 Phase の目的は、上記本文で定義した責務を skill 準拠の成果物へ固定することである。NON_VISUAL かつ docs-only / spec_only のため、SKILL.md の Phase 11 ルールに従いスクリーンショットは作成しない。

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する

## 参照資料

- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`（§6 検証方法）
- Phase 1〜10: `outputs/phase-1/` 〜 `outputs/phase-10/`
- Phase 1: `outputs/phase-1/`
- Phase 2: `outputs/phase-2/`
- Phase 5: `outputs/phase-5/`
- Phase 6: `outputs/phase-6/`
- Phase 7: `outputs/phase-7/`
- Phase 8: `outputs/phase-8/`
- Phase 9: `outputs/phase-9/`
- Phase 10: `outputs/phase-10/`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 統合テスト連携

本タスクは docs-only / NON_VISUAL / spec_only のため、統合テストは `task-claude-code-permissions-apply-001` で実行する。ここでは手順、証跡名、リンク整合を固定する。
