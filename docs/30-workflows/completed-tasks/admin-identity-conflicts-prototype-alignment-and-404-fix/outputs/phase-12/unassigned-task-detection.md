# Unassigned task detection

本サイクル内で完了させず、follow-up unassigned-task として後段に切り出すべき項目の確認結果 (CONST_007 遵守)。

結論: 本サイクルの完了条件 ((A) UI prototype alignment + (B) staging 404 修復) に対する未タスク化はなし。下表は本タスクの完了条件外で independent scope を持つ候補のみ。

## 候補一覧と採否

| ID | 内容 | 採否 | 根拠 (CONST_007 例外条件 / 独立スコープ理由) |
|----|------|------|----------------------------------------------|
| FU-AIDC-001 | visual baseline (Linux) regeneration を CI bot で 3 枚自動 push | **採用 → 本サイクル内で実施** | Phase 10 §4 / Phase 11 §2.3 に手順あり。AC-1〜AC-6 の visual evidence と直結するため独立化禁止 |
| FU-AIDC-002 | merge / dismiss 監査ログの admin UI 表示 (現状 audit log は server log のみ) | **未採用 (本サイクル外)** | 表示要件が未確定 (FilterByActor / FilterByConflictId 等の UI 設計が separate scope)。CONST_007 例外: 機能要件の独立性 (admin/audit page 側で扱うべき) |
| FU-AIDC-003 | staging 認証後 visual smoke の取得と staging-curl evidence | **未採用 (user-gated)** | CONST_007 例外: runtime / governance boundary (admin cookie 入手・staging deploy 確認は user 操作必須) |
| FU-AIDC-004 | merge confirm の optimistic update (現状は server round-trip 完了まで spinner) | **未採用 (post-MVP)** | UX 改善であり機能要件不変。independent scope (UX 改善 PR で扱う) |
| FU-AIDC-005 | identity-conflicts schema 拡張 (例: `manualMergeReason` 任意フィールド追加) | **未採用 (schema change)** | 不変条件「Google Form schema 外データは admin-managed として分離」と CONST_007「schema 変更は independent PR」適用 |
| FU-AIDC-006 | (B) で H1 (build 未デプロイ) が真因の場合の deploy pipeline 改善 | **条件付き採用 → GitHub Issue 化推奨** | 本 workflow の AC-7 が deploy log で満たされる場合のみ発生。発生時に Issue を起票 (deploy pipeline は独立 scope) |
| FU-AIDC-007 | `admin_fetch_404` Sentry alert policy IaC 化 | **未採用 (observability scope)** | 既存 sentry alert IaC workflow (issue-863 系) で扱う independent scope。Phase 8 で tag scheme は固定済 |

## CONST_007 例外条件適合性

- FU-AIDC-002: 機能要件未確定 (admin UI design 必要) = 同サイクル完了不可
- FU-AIDC-003: runtime / governance boundary (user-gated) = 技術的に同サイクル完了不可
- FU-AIDC-004: post-MVP / UX 改善 = independent scope
- FU-AIDC-005: schema change = independent PR 要請
- FU-AIDC-006: 真因依存・条件付き = Issue 起票で track
- FU-AIDC-007: observability scope 独立 = 既存 IaC workflow に集約

「分量が多い」「念のため」での先送りはなし。FU-AIDC-001 のみ本サイクルに internalize し、他はすべて独立スコープでの分離。

## ユーザーへのエスカレーション (CONST_007 後段要件)

- FU-AIDC-003 (staging visual smoke): merge 後 user 操作で実施 (Phase 13 §7 に手順)
- FU-AIDC-006 (deploy pipeline): (B) 真因確定後に発生有無を判定し、必要なら GitHub Issue 起票
- 他 (002 / 004 / 005 / 007): バックログ任意タイミング

## 検出方法 (CONST_007 detection report)

- TODO / FIXME / `it.skip` / `describe.skip` 残留 grep を Phase 11 evidence で取得し、本サイクル diff 内に 0 件であることを確認
- OPEN Issue (`gh issue list --label area/admin-ui --state open`) を 1 回参照し、本 workflow と重複する OPEN がないことを確認
