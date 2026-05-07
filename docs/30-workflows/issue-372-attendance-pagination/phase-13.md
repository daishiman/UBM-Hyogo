# Phase 13: PR 作成

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-13/phase-13.md` |

## 目的
`.claude/commands/ai/diff-to-pr.md` Phase 13 仕様に従い、commit / push / PR を作成する。**ユーザー明示承認なしに実行禁止**。

## ゲート構成
- G1: ローカル commit（typecheck / lint / test / build / coverage 全 PASS 確認後、ユーザー明示承認がある場合のみ）
- G2: push（feature ブランチ → origin、ユーザー明示承認がある場合のみ）
- G3: PR 作成（PR body に Phase 11 evidence パス・Phase 12 implementation-guide 主要見出しを反映。ユーザー明示承認がある場合のみ）

各ゲートは独立承認とし、合算承認は禁止する。

## PR body 必須項目
- 概要（Issue #372 リンク + 苦戦箇所要約）
- 変更ファイル一覧（`git diff main...HEAD --name-only` 全件）
- API 仕様変更（`/me/attendance` / `/admin/members/:memberId/attendance` 新設、`attendanceMeta` 追加）
- 後方互換性（`findByMemberIds` 無変更 / `attendance` 配列無変更）
- スクリーンショット 6 枚（Phase 11 outputs/phase-11/screenshots/）
- curl evidence 5 件（Phase 11 outputs/phase-11/evidence/）
- 検証ログリンク（Phase 9 logs）
- Test plan checklist

## 参照資料
- `outputs/phase-13/phase-13.md`
- `.claude/commands/ai/diff-to-pr.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-11/`（screenshots / evidence）

## 成果物
- `outputs/phase-13/pr-body.md`
- `outputs/phase-13/approval-log.md`
- PR URL（最終）

## 完了条件
- G1-G3 全承認済みの場合、PR URL が `approval-log.md` に記録され、PR body のスクリーンショット 6 枚と curl evidence 5 件のリンクが解決可能。
- 承認待ちの場合は `approval-log.md` に `blocked_pending_user_approval` を記録し、commit / push / PR は未実行のまま閉じる。

## 実行タスク
- [ ] G1: ローカル commit を作成（ユーザー承認後）。
- [ ] G2: push（ユーザー承認後）。
- [ ] G3: PR 作成（ユーザー承認後）。

## 統合テスト連携
- Phase 13 では実行済みローカル evidence と Phase 11 staging evidence を PR body に接続する。PR 作成はユーザー承認後のみ。
