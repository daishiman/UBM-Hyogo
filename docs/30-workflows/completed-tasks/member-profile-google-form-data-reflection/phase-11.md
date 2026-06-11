# Phase 11: 手動テスト（VISUAL / staging 復旧 before/after 視覚証跡）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 11 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| task 分類 | **VISUAL**（公開メンバー詳細ページの表示が空 → 反映に変わる） |
| capture 状態 | **pending**（実機操作・実 screenshot 取得は user-gated。本 phase では計画を確定し metadata を固定する） |
| 前提 | Phase 1-10 完了（Lane A/B 実装 GREEN・Lane C runbook 文書化済み） |
| 対象メンバー | `b0db428f-7dc0-4898-83f5-df31c7a04d69`（staging 実データで真因確定済みの当事者） |
| 対象 URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/b0db428f-7dc0-4898-83f5-df31c7a04d69` |

## 目的

Lane C の復旧 runbook を staging で実機実行し、公開メンバー詳細ページが「全項目空表示（"—"）」から「Google Form 実回答の反映表示」へ変わることを **before/after の視覚証跡**で確定する。3 層評価（Semantic / Visual / AI UX）の枠組みで合否を判定する。

> 本 phase の実機操作・実 screenshot 取得・staging mutation（schema sync / response sync）は **すべて user 明示承認後のみ実行**（不変条件 #6・CONST_002）。本仕様では実行計画・期待結果・canonical screenshot 名・capture metadata を確定し、実体取得は pending として残す。

## 実行タスク

### Task 11-1: before 証跡の取得（復旧前）

復旧操作の **前**に、現状の空表示を証跡として固定する。

- 対象 URL を開き、氏名・写真・ビジネス概要・タグ・パーソナル全項目（趣味／最近の関心／座右の銘／その他の活動）が全て `"—"`（空）であることを確認する。
- screenshot を canonical 名 `member-detail-before-recovery.png` で `outputs/phase-11/screenshots/` に保存する。

### Task 11-2: 復旧 runbook の実機実行（user-gated）

Lane C runbook（`outputs/phase-5/` の runbook 成果物 / index.md §「Lane C」）の手順を順序通り実行する。全操作は `bash scripts/cf.sh` ラッパー経由（`wrangler` 直呼び禁止・不変条件 #3）。

| 手順 | 操作 | コマンド / エンドポイント | 期待結果 |
|------|------|--------------------------|---------|
| ① schema 充足診断（read-only） | `schema_questions` 行数確認 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) AS n FROM schema_questions"` | 復旧前 `n=0`（真因 RC-3 を再確認） |
| ② schema sync 実行 | Google Form schema 取り込み | `POST /admin/sync/schema`（admin 経由） | `schema_questions` が充足（> 0 行） |
| ③ schema 充足再診断（read-only） | ① の再実行 | 同上 | `n > 0`（known stableKey 行が存在） |
| ④ response sync fullSync 実行 | 回答の全再取込 | `POST /admin/sync/responses?fullSync=true` | `result.status="succeeded"`・`fullyUnmappedResponses` が 0 もしくは大幅減 |
| ⑤ 反映データ診断（read-only） | `answers_json` / known `response_fields` 確認 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT answers_json FROM member_responses WHERE ..."` ／ known stableKey の `response_fields` 件数 | `answers_json` が `{}` でなく known stableKey（`fullName` 等）が 1 件以上 |
| ⑥ 詳細ページ確認 | 対象 URL を再読込 | ブラウザ | 氏名・写真・ビジネス概要・タグ・パーソナル各項目が実回答で表示される |

> 診断クエリ（①③⑤）は read-only で副作用なし。mutation（②④）は user 明示承認後のみ。`SELECT` の正確な列・WHERE 条件は Lane C runbook（phase-2 §4 / phase-5 runbook 成果物）の確定クエリに従う。

### Task 11-3: after 証跡の取得（復旧後）

- 手順 ⑥ の状態で screenshot を canonical 名 `member-detail-after-recovery.png` で `outputs/phase-11/screenshots/` に保存する。
- before と after を並べ、空項目 → 反映項目の差分を `manual-test-result.md` に記録する。

### Task 11-4: 3 層評価の記録

| 層 | 観点 | 合格基準 |
|----|------|---------|
| Semantic | データ意味の正しさ | known stableKey（`fullName` / `businessSummary` / 趣味 / 最近の関心 / 座右の銘 / その他の活動）が会員の実回答値と一致する。`__extra__:` 由来の欠落がない |
| Visual | 視覚的反映 | before（全 "—"）→ after（実値表示）の差分が screenshot で確認できる。レイアウト崩れ・文字化けがない |
| AI UX | 利用者体験 | 公開閲覧者が会員情報を読める状態になり、fail-silent（黙って空表示）が解消されている |

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| Lane C 復旧 runbook | `outputs/phase-5/`（実装 phase 成果物） / index.md §「Lane C」 | 復旧手順・確定診断クエリ |
| 設計（runbook 構成・閾値） | `phase-2.md` §4・§3 | 手順順序・fail-silent 検知挙動 |
| 真因（before 期待値） | `index.md` §2（RC-1〜RC-4） | before の空表示が真因に一致することの確認 |
| cf.sh ラッパー仕様 | `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」 | `wrangler` 直呼び禁止 |
| screenshot 命名規約 | task-specification-creator `references/phase-11-screenshot-guide.md` | canonical 名 `<component>-<state>.png` 一致 |

## 実行手順

1. Task 11-1: before screenshot 取得（user 承認後）。`member-detail-before-recovery.png`。
2. Task 11-2: runbook ①〜⑥ を順序実行（②④ mutation は user 承認後）。
3. Task 11-3: after screenshot 取得（user 承認後）。`member-detail-after-recovery.png`。
4. Task 11-4: 3 層評価を `manual-test-result.md` に記録。
5. `screenshot-plan.json` / `phase11-capture-metadata.json` を本 phase で確定（capture は pending、計画は確定）。

## 統合テスト連携

- Lane A/B の unit / integration test（Phase 4-7）が GREEN であることを前提に、Phase 11 は **staging 実機での end-to-end 反映**を視覚で最終確認する。
- after の `fullyUnmappedResponses` 観測値は Lane B の fail-silent 検知サマリー（phase-2 §3）が実機で機能している証跡として `manual-test-result.md` に記録する。

## 多角的チェック観点（AIが判断）

- **因果（バランスループ）**: schema_questions 充足（②③）→ qidMap 解決 → known stableKey 反映（⑤⑥）。before/after はこのループが断たれていた状態と修復された状態の対比である。
- **責務境界**: 本 phase は「データ復旧の結果として表示が変わる」ことの確認に閉じる。`apps/web` 表現層は無罪（不変条件 #1）であり、表現層のコード変更は証跡対象外。
- **運用性**: 診断クエリ（read-only）と mutation を明確に分離し、user 承認ゲートを mutation のみに限定する。

## サブタスク管理

| ID | 内容 | 状態 |
|----|------|------|
| P11-1 | before screenshot 計画・canonical 名固定 | 計画確定（capture pending） |
| P11-2 | 復旧 runbook 実機実行手順固定 | 計画確定（実行 user-gated） |
| P11-3 | after screenshot 計画・canonical 名固定 | 計画確定（capture pending） |
| P11-4 | 3 層評価枠組み記録 | 確定 |

## 成果物

- `outputs/phase-11/manual-test-result.md`（3 層評価・before/after 差分・runbook 実行記録欄）
- `outputs/phase-11/screenshot-plan.json`（`mode: "VISUAL"`・canonical 名一覧）
- `outputs/phase-11/phase11-capture-metadata.json`（`taskId=TASK-MEMBER-FORM-DATA-REFLECTION-001`・`mode=VISUAL`・各 screenshot の `tc` / `state` / `path`）
- `outputs/phase-11/screenshots/member-detail-before-recovery.png`（pending・user-gated）
- `outputs/phase-11/screenshots/member-detail-after-recovery.png`（pending・user-gated）

### canonical screenshot 名（4 か所一致）

phase spec（本ファイル）/ `screenshot-plan.json` / `phase11-capture-metadata.json` / Phase 12 `implementation-guide.md` の 4 か所で以下のセマンティック名を一致させる:

| canonical 名 | state | 説明 |
|--------------|-------|------|
| `member-detail-before-recovery.png` | before | 復旧前の全項目空表示（"—"） |
| `member-detail-after-recovery.png` | after | 復旧後の Google Form 実回答反映表示 |

## 完了条件

- [x] canonical screenshot 名 2 件が phase spec / screenshot-plan / capture-metadata / implementation-guide の 4 か所で一致している
- [x] `screenshot-plan.json` が `mode: "VISUAL"` で出力されている
- [x] `phase11-capture-metadata.json` の `taskId` が `TASK-MEMBER-FORM-DATA-REFLECTION-001`・`mode` が `VISUAL`
- [x] 復旧 runbook の実機実行手順（①〜⑥・read-only / mutation 分離）が記録されている
- [x] 3 層評価（Semantic / Visual / AI UX）の合格基準が記録されている
- [x] 実機操作・実 screenshot 取得・staging mutation が user-gated（pending）として明記されている

## タスク100%実行確認【必須】

- [x] Task 11-1〜11-4 の計画を確定した
- [x] `manual-test-result.md` / `screenshot-plan.json` / `phase11-capture-metadata.json` の作成計画が定義されている
- [x] capture（実画像取得）・staging mutation が user 承認まで pending であることを明記した

## 次Phase

Phase 12（ドキュメント更新）— 6 成果物を作成し、VISUAL のため Phase 11 screenshot 参照を implementation-guide に明記する。
