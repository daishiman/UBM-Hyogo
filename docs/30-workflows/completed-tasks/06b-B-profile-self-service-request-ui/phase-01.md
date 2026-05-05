# Phase 1: 要件定義 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 1 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |
| scope | `/profile` 上の公開停止/再公開申請 UI と退会申請 UI、client helper、申請結果 UI 状態 |

## 目的

`/profile` ページに「公開停止 / 再公開申請」「退会申請」UI を追加するための要件、受入条件、API 契約、現行 UI 構成との差分、scope 境界、approval gate を確定する。
本タスクは仕様書整備フェーズ群（Phase 1-3）の起点であり、実装本体は Phase 5、実測 evidence は Phase 11 で実行する。

## 実行タスク

1. 仕様書（05-pages.md / 07-edit-delete.md / 09-ui-ux.md）と現行ソース（`apps/web/app/profile/page.tsx`、`apps/api/src/routes/me/index.ts`、`apps/api/src/routes/me/schemas.ts`）を突合し、未反映 UI 境界を確定する。完了条件: scope in / out が refs と一致して列挙される。
2. ユーザーシナリオ・機能要件・非機能要件・受入条件 (AC-1..AC-7) を本タスク固有粒度で定義する。完了条件: AC が evidence path と 1:1 で対応する。
3. API 契約（`POST /me/visibility-request` / `POST /me/delete-request`）の request/response 型・status code を仕様書に転記し、UI 側の挙動契約を明示する。完了条件: 202 / 409 / 422 / 401 / 5xx すべての UI 挙動が定義される。
4. approval gate（06b-A 完了が前提）と自走禁止操作（commit / push / PR / deploy）を分離する。完了条件: gate 不成立時の停止条件が記載される。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| pages 仕様 | `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` の構成と申請導線の正本 |
| 編集/削除仕様 | `docs/00-getting-started-manual/specs/07-edit-delete.md` | 公開停止 / 退会のフロー仕様 |
| UI/UX 仕様 | `docs/00-getting-started-manual/specs/09-ui-ux.md` | ダイアログ・状態表示・i18n 規範 |
| profile ページ実装 | `apps/web/app/profile/page.tsx` | 現行レイアウト（`StatusSummary` / `ProfileFields` / `EditCta` / `AttendanceList`） |
| 編集 CTA | `apps/web/app/profile/_components/EditCta.tsx` | 既存の唯一の編集導線（外部 Form リンク） |
| /me API ルータ | `apps/api/src/routes/me/index.ts` | 申請 API の実装（202/409/422） |
| /me zod schemas | `apps/api/src/routes/me/schemas.ts` | request/response 契約 |

## 実行手順

### 0. P50 チェック: 既実装状態の調査

```bash
git log --oneline -20 -- apps/web/app/profile/
grep -rn "visibility-request\|delete-request" apps/web/
grep -rn "POST.*\(visibility\|delete\)-request" apps/api/src/routes/me/
```

- `/profile` 配下に申請 UI（Dialog / Form / button トリガ）が存在しないことを確認する。
- API 側に `POST /me/visibility-request` `POST /me/delete-request` が実装済みで、duplicate 時 409、validation 時 422、accepted 時 202 を返すことを確認する。
- 確認結果は `outputs/phase-01/main.md` の「現行コード anchor」テーブルに記録する。

### 1. ユーザーシナリオ列挙

- **S1**: `publishState=public` の本人が「公開を停止する」を押下 → 確認ダイアログ → API 202 → pending バナー表示。
- **S2**: `publishState=hidden` の本人が「再公開を申請する」を押下 → 確認ダイアログ → API 202 → pending バナー表示。
- **S3**: 本人が「退会を申請する」を押下 → 二段確認ダイアログ → API 202 → pending バナー表示（不可逆である旨を明示）。
- **S4**: 既に同種 pending 申請がある状態で再度押下 → 409 → 「既に申請を受け付けています」表示・ボタン無効化。
- **S5**: 422（不正 body）/ 5xx / network failure 時 → エラーメッセージとリトライ導線。
- **S6**: `rulesConsent !== 'consented'` のユーザは申請 UI 自体を非表示（API 側 `requireRulesConsent` と整合）。

### 2. 受入条件（AC）

| ID | 条件 | evidence |
| --- | --- | --- |
| AC-1 | `/profile` から公開停止申請が送信でき、202 後に pending UI が表示される | E2E `profile.visibility-request.spec.ts` / 画面 SS |
| AC-2 | `/profile` から再公開申請が送信でき、`publishState=hidden` のときのみボタンが現れる | E2E + visual diff |
| AC-3 | `/profile` から退会申請が送信でき、二段確認後にのみ submit される | E2E + visual diff |
| AC-4 | 同種 pending 申請存在時の再 submit は 409 を表示・ボタン disabled になる | API mock 409 の visual SS |
| AC-5 | プロフィール本文編集 UI（input / textarea / save button）は追加されない（不変条件 #4） | 静的 grep + visual diff |
| AC-6 | client から D1 を直接叩く実装が存在しない（不変条件 #5） | grep `cloudflare:d1` in apps/web → 0 hit |
| AC-7 | network / 5xx / 422 のエラー UI が role=alert で読み上げ可能 | a11y axe scan |

### 3. API 契約の固定

| endpoint | request | success | 4xx |
| --- | --- | --- | --- |
| `POST /me/visibility-request` | `{ desiredState: "hidden" \| "public", reason?: string<=500 }` | `202 { queueId, type:"visibility_request", status:"pending", createdAt }` | `409 { code:"DUPLICATE_PENDING_REQUEST" }` / `422 { code:"INVALID_REQUEST", issues }` / `401`（sessionGuard） |
| `POST /me/delete-request` | `{ reason?: string<=500 }`（空 body 許容） | `202 { queueId, type:"delete_request", status:"pending", createdAt }` | 同上 |

両 endpoint は `sessionGuard` + `requireRulesConsent` + `rateLimitSelfRequest` を経由する。UI は 401 時に `/login?redirect=/profile` へリダイレクトする既存規約に従う。

### 4. 現行 UI 構成と差分

| セクション | 現状 | 本タスクで追加 |
| --- | --- | --- |
| `StatusSummary` | publicConsent/rulesConsent/publishState 表示のみ | （変更なし） |
| `ProfileFields` | 回答セクション read-only 表示 | （変更なし） |
| `EditCta` | 外部 Google Form リンクのみ | （変更なし。本文編集 UI は依然追加しない） |
| `AttendanceList` | 参加履歴 read-only | （変更なし） |
| **新規** | — | `RequestActionPanel`（公開停止/再公開/退会のトリガ）、`VisibilityRequestDialog`、`DeleteRequestDialog`、`RequestPendingBanner`、client helper `apps/web/src/lib/api/me-requests.ts` |

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | Phase 9 で測定 |
| ユニットテスト Branch | 60%+ | Phase 9 で測定 |
| 結合テスト API（既存 /me/*） | 100% | 04b の既存 suite を再実行 |
| E2E 正常系（S1/S2/S3） | 100% | Phase 11 |
| E2E 異常系（S4/S5） | 80%+ | Phase 11 |

- 上流: 04b /me self-service API（実装済み）、06b profile page（実装済み）、06b-A Auth.js session resolver（先行必須）。
- 下流: 06b-C profile logged-in visual evidence、08b profile E2E full execution。

## 多角的チェック観点

- 不変条件 #4（プロフィール本文編集禁止）: 申請 UI が「公開状態の希望」「退会希望」だけを送信し、profile 本文の field を一切受け付けないこと。
- 不変条件 #5（apps/web から D1 直接アクセス禁止）: client helper は `fetchAuthed` 経由でのみ API Worker を叩く。
- 不変条件 #11（self-service 境界）: API path に `:memberId` を一切含めない（既に server 側で session.user.memberId 解決）。
- a11y: ダイアログは `role=dialog` + `aria-modal=true` + focus trap + esc close。エラーは `role=alert`。
- i18n: 09-ui-ux.md に従い日本語固定。文言（「公開を停止する」「退会を申請する」「申請を受け付けました」「既に申請中です」）を一覧化する。
- security: reason はクライアントで最大 500 文字制限し、API 側 zod と一致させる。XSS 対策として React の text node のみで描画。
- 未実装/未実測を PASS と扱わない。

## サブタスク管理

- [ ] 仕様書 3 本（05/07/09）と現行 UI 4 component を読み込み、差分テーブルを完成させる
- [ ] AC-1..AC-7 を evidence path と紐付ける
- [ ] API 契約表を `outputs/phase-01/main.md` に転記する
- [ ] approval gate（06b-A 完了確認）と自走禁止操作を明記する
- [ ] `outputs/phase-01/main.md` を作成する

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `outputs/phase-01/main.md` | ユーザーシナリオ / AC / API 契約 / 差分 / gate |

## 完了条件

- [ ] ユーザーシナリオ S1〜S6 が記載されている
- [ ] AC-1..AC-7 が検証可能な形で定義され evidence path と対応している
- [ ] API 契約（202/409/422/401）が UI 側挙動と紐付いている
- [ ] 不変条件 #4 / #5 / #11 への遵守方針が記載されている
- [ ] 06b-A 先行必須が approval gate として明記されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] メタ情報 6 行が埋まっている
- [ ] 完了済み本体タスクの復活ではなく未反映 UI のスペック新設になっている
- [ ] 本文編集 UI 追加が scope out として明記されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC-1..AC-7、API 契約表、現行 UI 差分テーブル、approval gate（06b-A）、不変条件適合方針を渡す。
