# Phase 12: ドキュメント更新

> workflow: mypage-prototype-alignment
> taskType: `implementation` / VISUAL
> 目的: spec_created close-out と実装サイクル完了後 close-out の両方で、Phase 12 strict 7 成果物を物理配置し、システム仕様同期・未タスク・skill feedback の境界を記録する。

## 12.0 着手前チェック（順序固定）

1. `outputs/artifacts.json` と各 `phase-*.md` の artifact 名を 1 対 1 で突合し、不一致があれば着手前に修正する（[Feedback 2]）。
2. Phase 1 §1.1 のタスク分類（**UI task / VISUAL**）を再確認する（[Feedback 3]）。分類変更なし。
3. `implementation-guide.md` を書く前に、実コードの adapter（`deriveVisibilityCounts` / `pickProfileSummary`）と編集導線（`editResponseUrl ?? fallbackResponderUrl`）の current contract を確認してから記述する。

## 12.1 必須 strict 7 成果物

| Task | 成果物 | 必須 | 主内容 |
|------|--------|------|--------|
| 12-0 | `main.md` | ✅ | Phase 12 サマリ、現在状態、strict 7 導線、4条件 |
| 12-1 | `implementation-guide.md` | ✅ | Part 1（中学生レベル概念説明）＋ Part 2（技術詳細）＋ 視覚証跡（Phase 11 screenshot 参照） |
| 12-2 | `system-spec-update-summary.md` | ✅ | Step 1-A〜1-C ＋ Step 2 判定 |
| 12-3 | `documentation-changelog.md` | ✅ | 変更ファイル / validator 結果 / workflow-local 同期と global skill sync を別ブロック |
| 12-4 | `unassigned-task-detection.md` | ✅ | **0 件でも出力**。Phase 10 MINOR ＋ スコープ外候補（UT-MYPAGE-01/02/03） |
| 12-5 | `skill-feedback-report.md` | ✅ | **改善点なしでも出力** |
| 12-6 | `phase12-task-spec-compliance-check.md` | ✅ | Task 12-1〜12-6 の準拠チェック（root evidence） |

> canonical N 成果物（Phase 11 の screenshot / capture-metadata 等）は `outputs/phase-12/` へコピーせず、相対パス参照（`../phase-11/...`）で引用する（P12-R2 対策）。

## 12.2 Task 12-1: implementation-guide.md（2 パート構成）

### Part 1（中学生レベル — 概念説明）

- 例え話で説明する。例:「マイページは、自分のプロフィール帳のようなもの。プロフィール帳の中身（名前・職業・連絡先）は、最初に書いた『申し込み用紙（Google フォーム）』からそのまま写されている。だから内容を変えたいときは、ページの中で書き換えるのではなく、もう一度フォームに書いて出し直す。新しい用紙が届くと、古い用紙は片付けられて、新しい用紙に自動で置き換わる。」
- 「なぜ必要か」→「何をするか」の順。例:「自分の情報が今どこまで他の人に見えているか分からないと不安。だから、公開／会員だけ／非公開の 3 つの箱に何件ずつ入っているかを一目で見せる。」
- 専門用語を使う場合は即座に言い換える（例: API → 「会員サーバーに情報を聞きに行く窓口」）。

### Part 2（技術者レベル — 技術詳細）

current contract を実コードから確認した上で記述する:

- **web 層 adapter（2 純粋関数）の公開経路**:
  - `deriveVisibilityCounts(sections: readonly MemberProfileSection[]): VisibilityCounts` — `apps/web/app/profile/_lib/visibility-counts.ts`。`profile.sections[].fields[].visibility` を public/member/admin で集計。未知値は無視（例外を投げない / [WEEKGRD-02]）。
  - `pickProfileSummary(sections)` — `apps/web/app/profile/_lib/profile-summary.ts`。displayName / subtitle / chips を `stableKey` 経由で抽出。欠損時は空表示。
- **データソース**: GET `/me`（SessionUser）、GET `/me/profile`（profile.sections / statusSummary / editResponseUrl / fallbackResponderUrl）。**API surface は変更していない**ことを明記。
- **編集導線**: RevalidateModal「フォームを開く」は `editResponseUrl ?? fallbackResponderUrl` を `target="_blank" rel="noopener noreferrer"` で開く。PATCH endpoint なし。
- **状態所有権**: profile データ = Server Component（page.tsx の fetchAuthed）/ Modal open = `EditCta.client` の `useState`。
- **コンポーネント topology**: Phase 2 §2.2 の構成（ProfileHeader / StatusBanner / VisibilitySummary / ProfilePreview / ProfileFields / RequestActionPanel / MemberHeader）を引用。識別子（props 名 / callback 名）は型定義から `grep` 確認した実値を記載する（identifier drift 防止 / [Feedback W1-02b-3]）。
- **エッジケース**: `editResponseUrl === null` / displayName 用 stableKey 欠損 / publishState 3 値（public / member_only / hidden）でのリンク挙動。

### 視覚証跡（VISUAL タスク）

`## 視覚証跡` セクションに Phase 11 の screenshot 参照を必ず明記する（NON_VISUAL ではないため固定フレーズは使わない）:

| screenshot | 参照パス | 確認内容 |
|------------|----------|----------|
| `profile-page-default.png` | `../phase-11/screenshots/profile-page-default.png` | 7 領域の prototype 準拠構成 |
| `status-banner-public.png` | `../phase-11/screenshots/status-banner-public.png` | 公開状態 banner（tone 連動） |
| `visibility-summary.png` | `../phase-11/screenshots/visibility-summary.png` | Stat grid-3 件数 |
| `revalidate-modal-open.png` | `../phase-11/screenshots/revalidate-modal-open.png` | 編集導線 Modal |
| `member-header-nav.png` | `../phase-11/screenshots/member-header-nav.png` | 共通動線 |

> screenshot 名は Phase 11 §11.2 / `phase11-capture-metadata.json` と完全一致させる。

## 12.3 Task 12-2: system-spec-update-summary.md（Step 1-A〜1-C + Step 2）

| Step | 内容 | 本タスクでの記録 |
|------|------|-----------------|
| Step 1-A | タスク完了記録（完了タスクセクション + 関連ドキュメントリンク + 変更履歴 + LOGS.md×2 + topic-map.md） | `/profile` prototype 整合タスクの完了をワークフロー仕様 + 関連 spec に記録 |
| Step 1-B | 実装状況テーブル更新 | 実装完了→`completed`（実装サイクル後）。仕様書段階では `spec_created` |
| Step 1-C | 関連タスクテーブル更新 | スコープ外候補（UT-MYPAGE-01/02/03）のステータスを current facts へ |
| Step 2 | システム仕様更新（新規インターフェース追加時のみ） | **下記判定参照** |

### Step 2 判定（条件付き — 本タスクの判定根拠）

**判定: Step 2 は原則 N/A（新規 IPC / 公開 API インターフェース追加なし）。ただし web 層 adapter 2 純粋関数の公開経路は記録する。**

判定根拠:
- 新規 API endpoint / IPC surface / D1 schema / Google Form schema の追加は **0 件**（不変条件 1）。既存 `/me/*` GET + POST を消費するのみ。
- 既存インターフェース（`MeProfileResponse` / `MemberProfileSection` / `MeProfileStatusSummary`）の変更も **0 件**（`@ubm-hyogo/shared` の型は参照のみ）。
- したがって aiworkflow-requirements 側のシステム仕様（API/IPC 契約）更新は **不要**。
- **記録対象**: web 層に新規追加した 2 純粋関数（`deriveVisibilityCounts` / `pickProfileSummary`）の公開経路（`apps/web/app/profile/_lib/` 配下、profile ページ内部に閉じた合成 component 用 utility であり、shared barrel への再エクスポートはしない）を `system-spec-update-summary.md` に「web 層内部 adapter（公開 API ではない）」として明記する。これは Step 2 の「新規インターフェース追加」には該当しないが、current facts として残す。

> 視覚証跡は Phase 11 の screenshot 参照（§12.2 視覚証跡表）を明記する。

## 12.4 Task 12-3: documentation-changelog.md

- 変更ファイル一覧（`apps/web/app/profile/` 配下の新規 / 変更ファイル）。
- validator 結果（`verify-design-tokens` / `typecheck` / `lint` / targeted test / Playwright smoke）。
- **workflow-local 同期**（本ワークフローの index.md / artifacts.json）と **global skill sync** を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。本タスクは新規 active workflow のため、aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory / SKILL-changelog / LOGS を同一 wave で同期する。
- 各 Step（1-A / 1-B / 1-C / Step 2）の結果を「該当なし」も含め個別に記録する。

## 12.5 Task 12-4: unassigned-task-detection.md（0 件でも出力）

設計タスクパターン 4 種（型定義→実装 / 契約→テスト / UI仕様→コンポーネント / 仕様書間差異→設計決定）をチェックした上で、Phase 10 §10.5 のスコープ外候補を「実装サイクル後に再判定する候補」と「今すぐ未タスク化する実不足」に分離する。

| 候補 ID | 項目 | 種別 | 優先度 | 状態 | 配置先 |
|---------|------|------|--------|------|--------|
| UT-MYPAGE-01 | Avatar 画像アップロード | UI仕様→API+コンポーネント | 低 | candidate_only | 現仕様では発行しない（API/product decision が必要な別スコープ） |
| UT-MYPAGE-02 | AttendanceList 視覚整備深掘り | UI仕様→コンポーネント | 中 | candidate_only | 実装後の Phase 10 MINOR 実測時のみ発行 |
| UT-MYPAGE-03 | インライン本文編集 | 設計決定（恒久スコープ外） | 対象外 | 記録のみ | 未タスク化しない（記録のみ） |

- Phase 10 で `MINOR` 判定が出た場合は MINOR 追跡テーブルへ追記する（実装サイクル後）。
- 仕様書作成時点では、実装差分から検出された unresolved follow-up は **0 件**。候補を open unassigned と誤分類しない。
- 実装後に `open` と判定した場合のみ、配置先は phase-template-phase12 の決定フロー（現 workflow は completed 移管前のため `docs/30-workflows/unassigned-task/` がデフォルト）に従い、登録後 `verify-unassigned-links.js` で `ALL_LINKS_EXIST` を確認する。

## 12.6 Task 12-5: skill-feedback-report.md（改善点なしでも出力）

| 観点 | 記録内容（実装サイクル後に確定） |
|------|--------------------------------|
| テンプレート改善 | Phase テンプレートの漏れ / 曖昧さ（例: VISUAL タスクで認証セッション必須ページの screenshot 撮影手順が薄い場合は記録） |
| ワークフロー改善 | 機械検証 / 手順分岐の改善余地 |
| ドキュメント改善 | 横断ガイドライン化の候補 |

> 改善点なしの場合も「改善点なし」と明記して出力する。

## 12.7 Task 12-6: phase12-task-spec-compliance-check.md

Task 12-0〜12-6 の完了を root evidence として記録する。
- strict 7 成果物が `outputs/phase-12/` に物理配置されているか 1 対 1 突合。
- `implementation-guide.md` 内の識別子（props 名 / callback 名 / 関数名）を実コードで `grep` 確認（identifier drift 防止）。
- `artifacts.json` と `outputs/artifacts.json` の parity（`phase12_completed` 同値）を確認。
- 計画系 wording の残存確認（`rg` で「仕様策定のみ」「実行予定」「保留として記録」を検出し 0 件にする）。

## 12.8 Phase 12 完了前チェックリスト

- [ ] strict 7 成果物すべて `outputs/phase-12/` に物理配置。
- [ ] `implementation-guide.md` が Part 1 / Part 2 / 視覚証跡を満たす。
- [ ] Step 1-A〜1-C 実行、Step 2 判定（N/A + adapter 公開経路記録）記録。
- [ ] LOGS.md ×2（aiworkflow-requirements / task-specification-creator）更新。
- [ ] topic-map.md 更新（必要時）+ `generate-index.js` 実行。
- [ ] `unassigned-task-detection.md` 出力（0 件でも）+ リンク整合確認。
- [ ] `artifacts.json` / `outputs/artifacts.json` parity 確認。
- [ ] 視覚証跡（Phase 11 screenshot）参照が implementation-guide に明記。

## 12.9 成果物

| 成果物 | パス |
|--------|------|
| Phase 12 サマリ | `outputs/phase-12/main.md` |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| 仕様書更新サマリー | `outputs/phase-12/system-spec-update-summary.md` |
| ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 未タスク検出レポート | `outputs/phase-12/unassigned-task-detection.md` |
| スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` |
| コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
