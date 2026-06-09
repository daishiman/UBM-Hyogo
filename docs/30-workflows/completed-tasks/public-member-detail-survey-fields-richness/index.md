# public-member-detail-survey-fields-richness - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | public-member-detail-survey-fields-richness |
| タスクID | TASK-PUBLIC-MEMBER-DETAIL-RICHNESS-001 |
| 作成日 | 2026-06-07 |
| ステータス | implemented_local_visual_present_staging_pending |
| 実装区分 | **実装仕様書**（コード変更を伴う / CONST_004 デフォルト） |
| タスク分類 | UI task（VISUAL） |
| implementation_mode | new |
| 総Phase数 | 13 |
| base ブランチ | dev |
| 作業ブランチ | docs/public-member-detail-survey-fields-spec |

---

## 一行サマリ

公開メンバー詳細ページ `/(public)/members/[id]` が、プロトタイプ正本（`pages-public.jsx` の `MemberDetailPage` / `09e-screen-blueprints-public.md` §3）の **Hero / BUSINESS OVERVIEW / TAGS+SNS / PERSONAL / MESSAGE** という構造化レイアウトになっておらず、API の `publicSections` を素朴な KV リストで羅列しているだけで情報が薄い。さらに staging 確認用の `TEST-MEM-01` seed が 3 項目（fullName / occupation / ubmZone）しか持たないため「アンケート全項目表示」を検証できない。本タスクは **API endpoint・D1 schema・Google Form schema を一切変更せず**、(A) `apps/web` の adapter + components を stableKey 駆動の proto 準拠レイアウトへ作り直し、(B) `apps/api` の test-accounts seed を visibility=public 全項目へ拡充する、2 lane を同一サイクルで完了させる実装仕様書群を定義する。

---

## 問題の核心（真の論点）

| # | 観測事実 | 出典 |
| - | -------- | ---- |
| F1 | proto は `/members/[id]` を 5 セクション（Hero / BUSINESS OVERVIEW / TAGS+SNS / PERSONAL(KVList) / MESSAGE）で構造化表示すると規定 | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L338-470 / `specs/09e-screen-blueprints-public.md` L568-773 |
| F2 | API `GET /public/members/:memberId` は既に visibility=public の全項目を `publicSections` で返している。**API 変更は不要** | `apps/api/src/view-models/public/public-member-profile-view.ts` L76-173 |
| F3 | 現状 web は `publicSections` の section title をそのまま `MemberDetailSections` の KV リストで羅列。proto の「ビジネス概要 / パーソナル / MESSAGE」専用レイアウトが無い。特に `selfIntroduction` が専用 accent カードでなくただの KV row | `apps/web/src/components/public/MemberDetailSections.tsx` / `apps/web/src/lib/adapters/member-detail.ts` |
| F4 | `ProfileHero` は `hometown` chip を持たず、Avatar が `lg`（proto は `xl`）、eyebrow も無い | `apps/web/src/components/public/ProfileHero.tsx` |
| F5 | `TEST-MEM-01` の seed は `STABLE_KEYS = ["fullName","occupation","ubmZone"]` の 3 項目のみ。staging が薄く見える直接原因の一つ | `apps/api/src/testing/test-accounts/build-seed-sql.ts` L29, L50-68 |
| F6 | proto 用 CSS クラス（`card-pad-lg` / `accent-soft` / `chip-row` / `grid-2` / `hero-split` / `eyebrow` / `h-section` / `serif`）は既に `apps/web/src/styles/globals.css` に存在し、新規 primitive を生やさず再利用できる | `apps/web/src/styles/globals.css` |

**主問題（1文）**: 公開メンバー詳細ページの情報設計が、API は全項目を供給しているにもかかわらず、web 側の adapter/components が proto の構造化レイアウトを実装していないため失われている。加えて確認用 seed が薄く、全項目表示を検証できない。

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-1.md](phase-1.md) | 完了 |
| 2 | 設計 | [phase-2.md](phase-2.md) | 完了 |
| 3 | 設計レビューゲート | [phase-3.md](phase-3.md) | 完了（PASS） |
| 4 | テスト作成 | [phase-4.md](phase-4.md) | 完了 |
| 5 | 実装 | [phase-5.md](phase-5.md) | 完了 |
| 6 | テスト拡充 | [phase-6.md](phase-6.md) | 完了 |
| 7 | テストカバレッジ確認 | [phase-7.md](phase-7.md) | 完了 |
| 8 | リファクタリング | [phase-8.md](phase-8.md) | 完了 |
| 9 | 品質保証 | [phase-9.md](phase-9.md) | 完了 |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | 完了 |
| 11 | 手動テスト検証（VISUAL） | [phase-11.md](phase-11.md) | 完了（実 capture は実装サイクルで取得） |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | 完了 |
| 13 | PR作成 | [phase-13.md](phase-13.md) | user-gated pending |

> 本ワークフローは当初 `spec_created` だったが、CONST_004 / CONST_005 と task-specification-creator の同一 wave 実装ルールに従い、今回サイクル内で `apps/web` と `apps/api` の実装・focused tests・Phase 11 local screenshots・Phase 12 strict outputs まで完了した。staging seed apply、authenticated staging screenshot、commit、push、PR は user-gated のため未実行。

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
```

---

## 実装 lane 構成（CONST_007: 1 サイクル完了スコープ）

| lane | 関心 | 主担当ファイル | 依存 |
| ---- | ---- | -------------- | ---- |
| **Lane A: web UI proto 準拠化** | 公開メンバー詳細の表示レイアウトを proto の 5 セクション構成へ | `apps/web/src/lib/adapters/member-detail.ts` / `apps/web/src/components/public/*` | API 既存 surface のみ |
| **Lane B: test-accounts seed 拡充** | staging で全項目表示を確認できる seed データ整備 | `apps/api/src/testing/test-accounts/catalog.ts` / `build-seed-sql.ts` | D1 schema 不変 |

> 2 lane は関心が分離しており Phase 5（実装）で並列実行可能。先送り（別 PR / バックログ）は無し。両 lane を 1 サイクルで完了させる。

---

## 受入条件（AC）サマリ

| AC | 内容 |
| -- | ---- |
| AC-1 | Hero が 写真(xl)・氏名・ニックネーム・職業・現在地に加え、UBM区画 / 参加ステータス / 現在地 / **出身地(hometown)** chip を表示（空項目は非表示） |
| AC-2 | BUSINESS OVERVIEW が businessOverview 本文 + skills + canProvide をサブ見出し付きで表示（空ブロックは非表示） |
| AC-3 | TAGS + SNS/WEB が タグ chip 群（空時「タグ未設定」）と リンク pill 群を表示 |
| AC-4 | PERSONAL が hobbies / recentInterest / motto / otherActivities の KVList を表示 |
| AC-5 | MESSAGE が selfIntroduction を accent-soft 引用カード（serif）で表示（空時セクション非表示） |
| AC-6 | 表示順が proto 準拠（戻る→Hero→[BUSINESS OVERVIEW | TAGS+SNS]→PERSONAL→MESSAGE→参加履歴） |
| AC-7 | visibility=public の全項目が漏れず表示。固定セクション未割当の public field（urlOthers・将来追加項目等）は「その他」フォールバックセクションに表示し取りこぼさない |
| AC-8 | member/admin visibility 項目（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent / responseEmail）は公開ページに出さない（adapter+API 二重防御維持） |
| AC-9 | `TEST-MEM-01` seed が visibility=public 全項目の値を持ち、staging `/members/TEST-MEM-01` で全セクションが埋まる |
| AC-10 | API endpoint surface 不変・D1 schema 不変・Google Form schema 不変・OKLch トークン正本遵守（HEX 直書き禁止） |

---

## 不変条件

1. **API endpoint 不変**: `GET /public/members/:memberId` のみ利用。新 endpoint 追加・レスポンス契約変更・D1 schema 変更・Google Form schema 変更を禁止（CLAUDE.md 不変条件 / ui-prototype-alignment 不変条件 #1）。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止。データは `fetchPublicOrNotFound` 経由のみ（CLAUDE.md 不変条件 #5）。
3. **OKLch トークン正本**: 色は `apps/web/src/styles/tokens.css` / `specs/design-tokens.md` が正本。HEX 直書き / `bg-[#xxx]` 禁止。CI gate `verify-design-tokens` で fail 判定。
4. **新規 primitive を生やさない**: proto 既出の primitive 群（card / chip / divider / KVList 等）と既存 globals.css クラスで構成する（ui-prototype-alignment 不変条件 #3）。
5. **visibility 二重防御維持**: adapter は `visibility==="public"` 以外を除外。正本は API 側 `getPublicMemberProfileUseCase`。
6. **stableKey 直書き禁止**: stableKey 参照は `@ubm-hyogo/shared` の `STABLE_KEY` 定数経由（不変条件 #1 / `lint-stablekey-literal.mjs`）。
7. **consent キー統一**: `publicConsent` / `rulesConsent`。`responseEmail` は system field（公開しない）。

---

## Phase完了時の必須アクション

```bash
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 検証ノート（implemented_local_visual_present_staging_pending）

本ワークフローは今回サイクルで **local implementation + local visual evidence completed / staging pending user gate** に再分類した。コード実装・focused tests・Phase 11 local screenshots・Phase 12 strict outputs は完了済みで、staging seed apply と authenticated staging screenshot は user-gated のまま残す。

`node .claude/skills/task-specification-creator/scripts/validate-phase-output.js` は CI gate に非接続のローカル参考ツールであり、Phase 1-13 を実走して outputs 実体まで揃える完全ワークフローを前提とする。本タスクの実装サイクルでは Phase 11 local screenshots と Phase 12 strict 7 成果物を生成済みで、残る境界は staging seed apply / authenticated staging screenshot / commit / push / PR の user-gated 項目のみ。

- Phase 11 補助成果物（`manual-test-result.md` 等）の 0 件 → local screenshot capture は `outputs/phase-11/screenshots/*.png` に取得済み。authenticated staging capture は user approval 後の runtime cycle で取得（VISUAL_ON_EXECUTION / pending_user_gate）。
- 各 phase の canonical セクション名（目的 / 実行タスク / 参照資料 / 成果物 / 完了条件）の揺れ → 本仕様書は可読性優先の独自見出しだが、内容は CONST_005 必須項目（変更対象ファイル・シグネチャ・入出力・テスト方針・実行コマンド・DoD）を Phase 5 で満たす。

本タスク完了時点で確認済みの健全性:

| 確認 | 結果 |
| ---- | ---- |
| HEX 直書き（仕様書内コード例含む） | 0 件（OKLch トークン遵守） |
| `artifacts.json` / `outputs/artifacts.json` parity | 同期済み |
| screenshot canonical 名（phase-11/12/13 一致） | `member-detail-full.png` / `member-detail-sparse.png` / `member-detail-message-hidden.png` |
| commit / push / PR | 未実行（CONST_002 遵守・user-gated） |

---

## 正本ドキュメント

| 種別 | パス |
| ---- | ---- |
| プロトタイプ実装 | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L338-470 |
| 画面ブループリント | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` L568-773 |
| フォーム schema | `docs/00-getting-started-manual/specs/01-api-schema.md` L45-146 |
| API ViewModel | `packages/shared/src/zod/viewmodel.ts` L172-189 |
| stableKey 定数 | `packages/shared/src/zod/field.ts` L67-101 |
