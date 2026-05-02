# Cloudflare Pages プロジェクト dormant 経過後の物理削除 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | task-issue-355-pages-project-delete-after-dormant-001                                 |
| GitHub Issue | #419 (`Refs #355`)                                                                    |
| 親 Issue     | #355 (CLOSED — reopen 禁止、`Refs #355` のみ使用)                                     |
| タスク名     | OpenNext Workers cutover 後の Cloudflare Pages プロジェクト削除運用                    |
| 分類         | 運用 / 破壊的クリーンアップ (operation / destructive cleanup)                         |
| 対象機能     | Cloudflare Pages プロジェクト（apps/web 旧 deploy 先）                                |
| 優先度       | 中 (medium) — Workers cutover 完了 + dormant 観察期間経過後にのみ着手                  |
| 見積もり規模 | 小規模（実作業）+ 観察期間あり                                                        |
| ステータス   | 未実施 (open / pending dormant period)                                                |
| 親タスク     | `task-impl-opennext-workers-migration-001` (Workers cutover 実装 follow-up)           |
| 発見元       | `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/unassigned-task-detection.md` U-3 |
| 発見日       | 2026-05-02                                                                            |
| 承認         | 削除実行前にユーザーの明示承認が必須（destructive operation）                          |

---

## 背景 / Why

OpenNext Workers cutover (Issue #355) と Cloudflare Pages プロジェクトの物理削除は、同一 wave で実行してはならない。
Workers route / custom domain / smoke evidence が安定する前に Pages を削除すると、緊急 rollback の戻り先が失われ、
復旧不能リスクが発生する。Pages を dormant 状態（無トラフィック・無デプロイ）でしばらく保持し、観察期間を
経た上で削除する分離運用が必要。

## スコープ

### 含む

- Issue #355 implementation follow-up の Workers deploy / route cutover 完了確認。
- Cloudflare Pages プロジェクトが dormant（custom domain detach 済 / 新規 deploy 停止済 / トラフィック 0）であることの確認。
- dormant 観察期間（例: 2 週間）の運用記録。
- Workers route / custom domain mapping が Pages に依存していないことの再確認。
- `bash scripts/cf.sh` 経由での Pages プロジェクト削除（ユーザーの明示承認後）。
- redacted evidence の保存と `aiworkflow-requirements` 正本仕様の同 wave 更新。

### 含まない

- Web CD の Workers deploy 実装（U-1: `task-impl-opennext-workers-migration-001` で扱う）。
- custom domain の Workers 側 cutover 実装（同上）。
- Cloudflare API token の払い出し / scope 変更。
- Workers 側の Logpush / observability 切替（U-4: 既存 Logpush diff 系列で扱う）。

## 受け入れ基準（AC）

| AC   | 要件                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| AC-1 | Workers production route と staging/production smoke evidence が完了している                               |
| AC-2 | Pages プロジェクトに active な custom domain attachment が存在しない                                       |
| AC-3 | dormant 観察期間（開始日 / 終了日 / 観察結果）が記録されている                                             |
| AC-4 | 削除操作にユーザーの明示承認が記録されている（PR description / Issue comment いずれか）                    |
| AC-5 | evidence に Cloudflare API token / account secret / Logpush sink URL query / OAuth value が含まれていない  |
| AC-6 | `aiworkflow-requirements` 正本仕様の Pages 言及箇所が削除済みステータスへ更新されている                    |

## 苦戦箇所【記入必須】

本未タスクは Issue #355 の Phase 12 unassigned-task-detection (U-3) で formalize された。
親仕様 `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/` の作成過程で発生した
苦戦箇所を後続実装に申し送る。

- 対象: `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-11/`
- 症状: implementation / NON_VISUAL / deploy-deferred の三重条件で「設計 PASS」と「runtime PASS」が
  混同されやすい。Phase 11 の declared evidence file（`web-cd-deploy-log.md` / `wrangler-deploy-output.md` /
  `staging-smoke-results.md` 等）は spec_created 時点で `PENDING_IMPLEMENTATION_FOLLOW_UP` contract として
  実体化しないと、後続 wave で「Phase 11 完了 = 実測 PASS」と誤読される。
- 参照: `outputs/phase-12/skill-feedback-report.md` F-1, F-3 / `outputs/phase-12/implementation-guide.md`「Phase 11 evidence 境界」

- 対象: `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/index.md`
- 症状: Issue #355 が CLOSED 状態のため reopen せず spec_created workflow を作る分岐が必要だった。
  PR description / commit message では `Refs #355` を使い、`Closes #355` を**書かない**運用を徹底しないと、
  GitHub UI 上で再 close 動作が発生し得る。
- 参照: `outputs/phase-12/skill-feedback-report.md` F-4

- 対象: Cloudflare Pages → Workers cutover の rollback readiness
- 症状: rollback の戻り先は (1) Workers の前 VERSION_ID と (2) Pages dormant プロジェクトの 2 段で扱う必要がある。
  Pages を早期削除すると 2 段目の retreat path が消失する。本未タスク（dormant 経過後削除）の存在意義そのもの。
- 参照: `outputs/phase-12/skill-feedback-report.md` F-3 / `outputs/phase-12/implementation-guide.md` rollback section

## リスクと対策

| リスク                                                                          | 対策                                                                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers cutover 不完全な状態で Pages を削除し、本番 down 時の rollback 不能化   | AC-1 を gate 化し、`scripts/cf.sh` 経由で Workers production route の `wrangler deployments list` と staging/production smoke ログを事前取得・添付する        |
| custom domain が Pages 側にまだ attach されたまま削除を試行し API エラー        | 削除前に `bash scripts/cf.sh` 経由 Cloudflare API で Pages project の domain attachment を取得し、空であることを確認する（AC-2）                                |
| dormant 観察期間が短すぎて edge cache / DNS propagation の遅延 issue を見逃す   | 観察期間を最低 2 週間とし、開始日 / 終了日 / Workers 側 4xx・5xx 推移を `outputs` evidence に記録する（AC-3）                                                  |
| 破壊的削除がユーザー承認なしで実行される                                        | `bash scripts/cf.sh` 削除コマンドは PR description / Issue comment に明示承認文言を確認してから実行する。Claude Code は単独で削除を行わない（AC-4）            |
| evidence に Cloudflare API token / Logpush sink URL query が混入する            | `bash scripts/cf.sh` 出力を保存する前に `rg` で `CLOUDFLARE_API_TOKEN` / `Bearer ` / `?token=` 等を grep し redact する（AC-5）                                  |
| Pages 削除後も `aiworkflow-requirements` references / docs に Pages 記述が残存  | 同 wave で `.claude/skills/aiworkflow-requirements/references/` と関連 docs を更新し、Pages 言及を「削除済み（YYYY-MM-DD）」へ書き換える（AC-6）                |

## 検証方法

### 事前確認（dormant 開始時 / 削除実行前）

```bash
# Workers cutover 完了確認（AC-1）
bash scripts/cf.sh whoami
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
# Workers production の deployment 履歴と最新 VERSION_ID
# (実コマンドは scripts/cf.sh の deployments サブコマンドに委譲する)

# Pages プロジェクトの dormant 状態確認（AC-2）
# - 直近 deploy が cutover 以前であること
# - custom domain attachment が空であること
# (実コマンドは scripts/cf.sh の pages list / pages domain サブコマンドに委譲する)
```

### 削除実行後の検証

- Cloudflare ダッシュボード上で Pages プロジェクトが消滅していること（手動確認 + redacted screenshot）。
- Workers production route が継続して 200 OK を返すこと（staging / production smoke 再実行）。
- `aiworkflow-requirements` の Pages 言及箇所が「削除済み（YYYY-MM-DD）」へ書き換わっていること
  （`rg "Cloudflare Pages" .claude/skills/aiworkflow-requirements/` で残存箇所を確認）。
- evidence に token / secret 流出がないこと（`rg -i "(token|bearer|sink|secret)" outputs/`）。

### 期待結果

- 削除コマンドの exit code = 0。
- 削除後 1 時間以内の Workers production smoke が PASS。
- `outputs/` 配下に dormant 開始日 / 終了日 / 削除日 / 承認者 / VERSION_ID の append-only 記録が存在。

## 実行手順（概要）

1. **Pre-flight**: AC-1 / AC-2 を満たすことを `bash scripts/cf.sh` で確認し evidence 化。
2. **Dormant period 開始**: 観察開始日を記録し、最低 2 週間 Workers 側のエラー率 / latency を観察。
3. **Dormant period 終了**: 観察結果を記録し、ユーザーへ削除可否を問い合わせる。
4. **承認取得**: PR description / Issue comment にユーザーの明示承認を残す（AC-4）。
5. **削除実行**: `bash scripts/cf.sh` 経由で Pages プロジェクト削除コマンドを実行。
6. **事後検証**: 検証方法セクションの事後検証を全件 PASS 化。
7. **正本仕様更新**: `aiworkflow-requirements` references を更新し、AC-6 を満たす。
8. **完了タスク移動**: 本未タスクファイルを `docs/30-workflows/completed-tasks/` 配下に移動。

## 関連ドキュメント

- `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/` — 親仕様（OpenNext Workers CD cutover）
- `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/unassigned-task-detection.md` — U-3 起票元
- `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/implementation-guide.md` — rollback / Phase 11 evidence 境界
- `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` — U-1 (Workers cutover 実装)
- `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` — U-4 (Logpush diff)
- `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` — Pages vs Workers ADR
- `CLAUDE.md` — Cloudflare CLI 実行ルール（`bash scripts/cf.sh` のみ使用）

## 申し送り

- 本未タスクは **dormant 観察期間が前提**のため、Workers cutover 完了直後に着手しないこと。
- 削除は **destructive かつ revert 不可**。`bypassPermissions` モードでも単独実行せず、必ずユーザー承認を取得する。
- 親 Issue #355 は CLOSED のため、本未タスクから新規 Issue をフォークする際は `Refs #355` のみ使用し、
  `Closes #355` を書かない（CLOSED Issue の再 close 動作を避ける）。
