# home-dashboard-japanese-localization

> ホーム画面（公開トップ `/`）の英語表記を、非エンジニアの会員にも直感的にわかる日本語へ整える VISUAL 実装仕様書。
> **状態: implemented_local_evidence_captured（ローカル実装・証跡取得済み。commit/PR は user-gated）**

- **実装区分**: 実装仕様書（コード変更を伴う）
- **タスク種別**: VISUAL UI task（apps/web home 表示 + public API 境界補強）
- **正本（SSOT）**: [`_shared-context.md`](./_shared-context.md)
- **対象ルート**: `/`（`apps/web/app/(public)/page.tsx` の 6 セクション）

## 概要

スクリーンショットで確認された英語表記を 2 系統で整理し日本語化する。

1. **統計カード4ラベル**: `Members`/`Zones`/`Meetings / yr`/`Last sync` → `公開メンバー`/`事業フェーズ`/`年間の支部会`/`最終データ更新`、同期バッジ `Forms 同期中` → `自動で最新化`。
2. **見出し上の英語 overline（eyebrow）6箇所を削除**（`CHAPTER SITE`/`FEATURED MEMBERS`/`ABOUT`/`THREE ZONES`/`RECENT MEETINGS`/`FOR MEMBERS`）。いずれも直下に日本語見出しがあり意味が重複するため、要素ごと削除し日本語見出しのみにする。

ホバーで開く等のギミックは導入しない（ユーザー明示）。

## Phase 進行

| Phase | 名称 | 文書 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-01.md](./phase-01.md) | completed |
| 2 | 設計 | [phase-02.md](./phase-02.md) | completed |
| 3 | 設計レビュー | [phase-03.md](./phase-03.md) | completed |
| 4 | テスト作成 | [phase-04.md](./phase-04.md) | completed |
| 5 | 実装 | [phase-05.md](./phase-05.md) | completed |
| 6 | テスト拡充 | [phase-06.md](./phase-06.md) | completed |
| 7 | カバレッジ確認 | [phase-07.md](./phase-07.md) | completed |
| 8 | リファクタリング | [phase-08.md](./phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](./phase-09.md) | completed |
| 10 | 最終レビュー | [phase-10.md](./phase-10.md) | completed |
| 11 | 手動テスト | [phase-11.md](./phase-11.md) | completed（local_fullpage_present_staging_pending） |
| 12 | ドキュメント更新 | [phase-12.md](./phase-12.md) | completed |
| 13 | PR作成 | [phase-13.md](./phase-13.md) | pending（user-gated） |

## 変更ファイル（確定）

実装7（`page.tsx` / `Stats.tsx` / `AboutUbm.tsx` / `Timeline.tsx` / `CallToActionCTA.tsx` / `legacy-public.css` / `lib/api/public.ts`）+ テスト6。詳細は [`_shared-context.md` §3](./_shared-context.md)。

## 不変条件

apps/web 内のみ / apps/api・packages/shared 非接触 / D1 直接アクセス禁止 / DOM contract（eyebrow 除く）保持 / OKLch トークン正本・HEX 0 / 新規 component 0 / 単一サイクル単一 PR（CONST_007）。

## Phase 12 成果物

- [implementation-guide.md](./outputs/phase-12/implementation-guide.md)
- [system-spec-update-summary.md](./outputs/phase-12/system-spec-update-summary.md)
- [documentation-changelog.md](./outputs/phase-12/documentation-changelog.md)
- [unassigned-task-detection.md](./outputs/phase-12/unassigned-task-detection.md)
- [skill-feedback-report.md](./outputs/phase-12/skill-feedback-report.md)
- [phase12-task-spec-compliance-check.md](./outputs/phase-12/phase12-task-spec-compliance-check.md)
