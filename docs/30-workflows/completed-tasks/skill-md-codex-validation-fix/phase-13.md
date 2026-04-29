# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 名称 | PR 作成 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | blocked |
| blocker | user の明示承認が必要 |

## 目的

ユーザー承認後にのみ、3 Lane の変更を単一 PR として作成する。承認前はコミット、push、PR 作成を行わない。

## ⚠️ 重要

**PR 作成は user の明示承認後のみ実施する。本仕様書は事前承認を含まない。**

## 単一 PR 構成

本タスクの全 Lane（A / B / C）を単一 PR にまとめる。

### PR タイトル案

```
fix(skills): SKILL.md Codex 検証エラーの恒久対策（既存 3 件是正 + skill-creator ガード追加）
```

### PR 本文テンプレート

```markdown
## Summary

- Codex CLI / Claude Code 起動時の `Skipped loading N skill(s) due to invalid SKILL.md files` 警告を 0 件化
- 既存違反 3 件（aiworkflow-requirements / automation-30 / skill-creator）を是正
- テストフィクスチャの拡張子を `.fixture` に変更してスキル走査から物理除外
- skill-creator 改修により新規スキル生成時の同種失敗を **書き込み前** にブロック

## 変更内容

### Lane A: 既存 SKILL.md 是正
- aiworkflow-requirements / automation-30 / skill-creator の description を圧縮
- 退避先 references/ ファイルを新規作成

### Lane B: テストフィクスチャ拡張子変更
- 28 件以上のフィクスチャを `SKILL.md` → `SKILL.md.fixture` にリネーム
- テストヘルパー `loadFixture` を追加、既存テストを読み替え
- `.gitignore` 追加

### Lane C: skill-creator 改修
- description 事前ゲート（length / YAML 構文 / escape）
- Anchors / Trigger keywords の自動退避（5 / 15 件上限）
- 共通バリデータ `utils/validate-skill-md.js` 抽出
- writeFile 直前ゲート（init_skill.js）

## 受入条件達成

- AC-1: Codex / Claude Code 起動時警告 0 件 ✅
- AC-2〜AC-8: 全件 PASS（詳細は `docs/30-workflows/skill-md-codex-validation-fix/outputs/phase-10/final-review-result.md`）

## Test plan

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] skill-creator 自動テスト全件 Green
- [ ] Codex CLI 起動で警告 0 確認
- [ ] Claude Code 新規セッション起動で warning 出ないこと
- [ ] mirror parity (`.claude` ↔ `.agents`) 0 diff
- [ ] フィクスチャ移行後も既存テストが Green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 事前確認

- [ ] Phase 1-12 の成果物が全件揃っている
- [ ] artifacts.json `phase13: pending` → user 承認後に `completed`
- [ ] git status クリーン（追跡対象外ファイルなし）
- [ ] mirror sync 完了

## ブランチ命名

`feat/skill-md-codex-validation-spec`（仕様書フェーズ）
→ 実装段階で `fix/skill-md-codex-validation`（任意で変更）

> 本タスクは仕様書のみのため、現時点のブランチ `feat/skill-md-codex-validation-spec` のまま PR 出すか、実装完了後に統合 PR とするかは user 判断。

## ロールバック方針

- Lane A 単独で問題発生: 該当 SKILL.md のみ revert（references/ 新規ファイルは無害なので残置可）
- Lane B 問題発生: rename を revert、テストヘルパーは無害化（呼び出されない）
- Lane C 問題発生: utils/ 削除、generate_skill_md.js / init_skill.js を以前の状態に revert

## 受入条件（Phase 13 完了条件）

- [ ] user の明示承認を得ている
- [ ] PR が単一で 3 Lane の差分が共存
- [ ] CI が Green
- [ ] レビュアー指定（solo 開発のため省略可）

## 成果物

- PR URL（`outputs/phase-13/pr-url.md`）

## 実行タスク

- ユーザー承認を得るまで待機する。
- 承認後、3 Lane の差分が単一 PR に含まれることを確認する。
- PR URL とチェック結果を `pr-url.md` に記録する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 design | `outputs/phase-2/design.md` | PR scope |
| Phase 5 diff | `outputs/phase-5/diff-summary.md` | PR diff |
| Phase 6 tests | `outputs/phase-6/extended-tests.md` | test evidence |
| Phase 7 coverage | `outputs/phase-7/coverage-report.md` | coverage evidence |
| Phase 8 refactor | `outputs/phase-8/refactor-report.md` | refactor evidence |
| Phase 9 QA | `outputs/phase-9/qa-result.md` | QA evidence |
| Phase 10 review | `outputs/phase-10/final-review-result.md` | final review |
| Phase 11 manual | `outputs/phase-11/main.md` | manual evidence |
| Phase 12 | `phase-12.md` | close-out 結果 |
| index | `index.md` | PR 方針 |

## 完了条件

- [ ] user の明示承認がある
- [ ] PR が単一で 3 Lane の差分を含む
- [ ] PR URL が成果物に記録されている

## タスク100%実行確認【必須】

- [ ] Phase 13 の成果物と artifacts.json の登録が一致している
