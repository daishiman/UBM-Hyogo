# Phase 10 出力 — 最終レビュー結果

> 親: [phase-10.md](../../phase-10.md)。AC 充足判定・不変条件確認・blocker 有無・MINOR 未タスク化方針の確定記録。

## 1. AC 充足判定

| # | 受入条件（最適化後） | 判定 | 根拠 |
|---|----------------------|------|------|
| AC-1 | DB-level FK 不採用の意思決定 + 根拠 ADR・代替 app 層ガード | 充足 | Phase 2 §0 ADR-1119（6 観点比較）。D1 PRAGMA 確認は FK 非採用ゆえ N/A |
| AC-2 | `detectOrphanMemberTags` / `countOrphanMemberTags` で孤児を機械検出 | 充足 | Phase 2 §2 / Phase 4 TC-R / Phase 6 TC-E |
| AC-3 | INSERT 3 経路の tag_id 先在検証を回帰 baseline 化。`assignTagsToMember` helper 単体でも未定義 tag_id を skip | 充足 | Phase 6 §2 TC-X01〜X03 / TC-R08 |
| AC-4 | count guard（防止）と orphan detection（検出）の責務分離 | 充足 | Phase 2 §4 責務分離テーブル |
| AC-5 | `members.contract.spec.ts` の member_tags fixture は事前に tag_definitions 定義済みで孤児 0 | 充足 | Phase 2 §6 / members.contract focused PASS（fixture 差分なし） |
| AC-6 | `GET /admin/tags/orphans` 追加 + contract test | 充足 | Phase 2 §3 / Phase 4・6 TC-C01〜C03 |
| AC-7 | `countOrphanMemberTags()==0` 不変条件 + typecheck/lint/issue-1070 非破壊 | 充足 | Phase 6 §4 / Phase 9 §1・§2 |

## 2. 不変条件最終確認

| 不変条件 | 判定 |
|----------|------|
| invariant #5（D1 は apps/api に閉じる・apps/web 非接触） | 維持 |
| invariant #8（`*.spec.ts` のみ） | 維持 |
| invariant #13（member_tags write は assign* 限定・追加は read のみ） | 維持 |
| documented no-FK 架構（0022:4） | 維持・強化 |
| issue-1070 ガード非破壊 | 維持 |
| 新 migration / D1 schema 変更なし | 維持 |

## 3. blocker

**blocker なし。** AC-1〜AC-7 全充足・不変条件全維持。commit / PR は user-gated。

## 4. MINOR 指摘と未タスク化方針（unassigned-task-guidelines 準拠）

| MINOR-ID | 指摘 | 重大度 | 本タスク対応 | 未タスク化方針 |
|----------|------|--------|--------------|----------------|
| MINOR-1 | 孤児行の修復（削除 / 再割当）導線が無い（検出のみ） | MINOR | 非要件 | 修復 mutation は今回の「read-only 監査 surface」と別責務。現時点で未タスク化しない |
| MINOR-2 | 定期検出の admin UI / 通知が無い | MINOR | 非要件 | 本タスクは API surface まで。UI/通知は観測要件が出るまで未タスク化しない |
| MINOR-3 | `detectOrphanMemberTags` に pagination が無い | MINOR | 非要件 | 孤児は本来 0 件想定で YAGNI。現時点で未タスク化しない |

> MINOR-1〜3 は主目的（検出ギャップ解消）達成を妨げず、現時点では必要タスクとして検出していない。CONST_008 に従い、未タスク化による先送りは行わない。
