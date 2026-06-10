# Phase 4: テスト計画

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [shared-context.md](shared-context.md)（SSOT）/ [phase-1-requirements.md](phase-1-requirements.md) / [phase-2-design.md](phase-2-design.md) / [phase-3-design-review.md](phase-3-design-review.md)
- 本 Phase の責務: SSOT §5 の T1-T5 を正本に、各テストファイルのテストケース（TC-ID・入力・期待値・対応 AC）を TDD の expected result として確定する。実装（コード）は書かない。

## テスト方針（全体）

1. **TDD 先行**: 各 TC は実装前に「期待値」を確定する。実装は本計画の期待値を満たすことで完了とする。
2. **テスト実行環境**: `vitest.config.ts` の `environment: "jsdom"` を前提とする（確認済み。`@media` は jsdom 非適用だが本タスクは表示テキスト検証が主で `@media` 依存なし）。
3. **テストファイル命名**: `*.spec.{ts,tsx}` のみ（不変条件 #8）。
4. **純関数は I/O 直接検証 / コンポーネントは DOM 検証**: T1・T2 は純関数の入出力、T3-T5 は `@testing-library/react` の `render` + `screen` で DOM テキストを検証。
5. **fail-soft の明示検証**: 日時 helper は不正値で例外を投げない（元入力返却）ことを TC で確認する。

## テスト操作対象の明示（VSCPKR-03）

| テスト | 操作対象 | 区分 | 注記 |
| --- | --- | --- | --- |
| T1 datetime | 関数引数（`iso: string`） | 外部入力（純関数） | state なし。引数→戻り値のみ |
| T2 glossary | export 定数 / 関数引数（`value: boolean`） | 外部入力（純データ/純関数） | state なし |
| T3 MembersTable | `props.items[].lastSubmittedAt` | 外部 props | コンポーネントは内部 fetch なし。props 駆動 |
| T4 MemberDrawer IDENTITY | `props`（`detail` 系） | 外部 props | 内部 state なし（描画のみ）。fetch なし |
| T5 MemberDiagnosticsPanel | `props.memberId` + **mock した `fetchMemberDiagnosis` の戻り値** | 外部 props + mock した module 戻り値 | Panel は `useEffect` で `fetchMemberDiagnosis(memberId)` を呼び `useState` に格納。内部 state は「mock 戻り値が反映された結果」を検証する（state を直接操作しない） |

> VSCPKR-03: T5 のみ「内部 state」を経由する。ただし state を直接いじるのではなく、外部依存（api module）を mock して state へ流れ込む値を制御する。これにより props/mock = 外部入力という単一の操作面に統一する。

## T5 の mock 方針（VSCPKR-02 厳守）

`MemberDiagnosticsPanel` は `import { fetchMemberDiagnosis } from "../../diagnostics/api"` を `useEffect` 内で呼び出し、結果を `setData` する（実コード確認済み: Panel 1-32 行）。テストでは **api module を mock** して fetch を発生させずに DIAGNOSTICS を描画させる。

```ts
// 推奨 mock（モジュール mock。実 fetch を発生させない）
vi.mock("../../diagnostics/api", () => ({
  fetchMemberDiagnosis: vi.fn(),
}));
// 各 TC で戻り値を設定
import { fetchMemberDiagnosis } from "../../diagnostics/api";
vi.mocked(fetchMemberDiagnosis).mockResolvedValue(makeDiagnosis({ ... }));
```

- `useEffect` の非同期解決後に DOM が更新されるため、`await screen.findByText(...)`（`find*` 系）で待機する。
- **禁止**: `vi.stubGlobal("window", ...)`（VSCPKR-02）。万一 `window.api` 等のグローバル mock が必要になった場合のみ `Object.defineProperty(window, "api", { configurable: true, value: ... })` を使用する。本タスクでは module mock で完結するため `window` への介入は不要。
- mock の後始末: `afterEach(() => { cleanup(); vi.clearAllMocks(); })`。

> 補足: `fetchMemberDiagnosis` を mock せず実 `fetch` を mock する方法（`vi.stubGlobal("fetch", ...)`）も技術的には可能だが、`fetch` はグローバルであり `vi.stubGlobal("fetch")` は許容範囲（`window` への介入ではない）。ただし zod parse を通すため戻り shape を厳密に揃える必要があり、module mock の方が安定するため **module mock を第一推奨**とする。

---

## T1: `apps/web/src/lib/format/__tests__/datetime.spec.ts`（新規）

対象: `formatJstDateTimeWithSeconds(iso: string): string`（F1 新規 helper）。
検証主旨: UTC→JST（+9h）変換 / 年月日漢字・月日ゼロ埋め除去 / 時分秒 2 桁維持 / fail-soft。

| TC-ID | 入力 `iso` | 期待戻り値 | 検証ポイント | AC |
| --- | --- | --- | --- | --- |
| TC-DT-01 | `"2026-06-09T10:34:19.996603Z"` | `"2026年6月9日 19:34:19"` | UTC 10:34 → JST 19:34（+9h）。ミリ秒切り捨て。月`6`/日`9`はゼロ埋めなし | AC-1, AC-2 |
| TC-DT-02 | `"2026-01-05T00:00:00Z"` | `"2026年1月5日 9:00:00"` | UTC 00:00 → JST 09:00。月`1`/日`5`ゼロ埋め除去。時`9`は…（下記注記） | AC-2 |
| TC-DT-03 | `"2026-12-31T15:00:00Z"` | `"2027年1月1日 0:00:00"` | UTC 15:00 → JST 翌日 00:00。年・月・日が全て繰り上がる境界 | AC-2 |
| TC-DT-04 | `"2026-06-09T10:04:09Z"` | `"2026年6月9日 19:04:09"` | 時分秒の 2 桁ゼロ埋め維持（`04:09`）。時は JST 19 で 2 桁 | AC-2 |
| TC-DT-05 | `""`（空文字） | `""` | fail-soft: `Number.isNaN` 検知 → 元入力返却。例外を投げない | AC-2 |
| TC-DT-06 | `"invalid"` | `"invalid"` | fail-soft: 不正文字列 → 元入力返却。例外を投げない | AC-2 |
| TC-DT-07 | `"not-a-date-2026"` | `"not-a-date-2026"` | fail-soft（任意の非日付文字列で元入力返却） | AC-2 |

> **TC-DT-02 / TC-DT-04 の「時」表記の確定（実装契約）**: SSOT §6 F1 の設計は `hour: "2-digit"` の `Intl` 部品を `get("hour")` でそのまま使う（時はゼロ埋め除去しない）。一方、月日は `Number()` でゼロ除去する。よって:
> - 時が 1 桁（JST 9 時）の場合の期待値は **`Intl.DateTimeFormat("ja-JP", { hour: "2-digit", hour12: false })` の実出力に一致**させる。`ja-JP` の `hour:"2-digit"` + `hour12:false` は環境により `"09"` を返す。したがって TC-DT-02 の期待は厳密には `"2026年1月5日 09:00:00"` となる可能性が高い。
> - **実装者への指示**: Phase 5 着手時にまず `new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",hour:"2-digit",hour12:false}).formatToParts(new Date("2026-01-05T00:00:00Z"))` を 1 行スクリプトで実行し、`hour` 部品の実値（`"09"` か `"9"` か）を確認してから TC-DT-02/03 の期待値を `"09:00:00"` / `"00:00:00"` に確定する。SSOT 例示 `19:34:19` は 2 桁時のため曖昧さがないが、1 桁時（9 時・0 時）の TC は実 `Intl` 出力をグラウンドトゥルースとする。
> - この確認をテスト計画の expected として固定するため、**第一候補の期待値**は「時も 2 桁ゼロ埋め」=`"2026年1月5日 09:00:00"` / `"2027年1月1日 00:00:00"` とする（`hour:"2-digit"` の名義に忠実）。SSOT §6 のコメント「時分秒は 2 桁ゼロ埋め維持」とも整合する。

| TC-ID（確定版） | 入力 | 確定期待値 |
| --- | --- | --- |
| TC-DT-02 | `"2026-01-05T00:00:00Z"` | `"2026年1月5日 09:00:00"` |
| TC-DT-03 | `"2026-12-31T15:00:00Z"` | `"2027年1月1日 00:00:00"` |

> 既存 `formatJstDateTime` を壊していないことの保険として、同 spec に「`formatJstDateTime` が import 可能で従来出力（分まで・年2桁等）を返す」スモーク 1 件を任意で追加してよい（回帰 guard。AC 非対象だが安全網）。

---

## T2: `apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts`（新規）

対象: F2 SSOT の export 群（`MEMBER_IDENTITY_FIELD_LABELS` / `MEMBER_DIAGNOSTICS_FIELD_LABELS` / `MEMBER_SYSTEM_SECTION_LABELS` / `formatBooleanJa`）。

| TC-ID | 検証内容 | 期待値 | AC |
| --- | --- | --- | --- |
| TC-GL-01 | `MEMBER_IDENTITY_FIELD_LABELS.memberId` | `"会員ID"` | AC-7 |
| TC-GL-02 | `MEMBER_IDENTITY_FIELD_LABELS.responseEmail` | `"回答メールアドレス"` | AC-7 |
| TC-GL-03 | `MEMBER_IDENTITY_FIELD_LABELS.notificationOptOut` | `"通知の受け取り停止"` | AC-7 |
| TC-GL-04 | `MEMBER_IDENTITY_FIELD_LABELS.isDeleted` | `"退会済み"` | AC-7 |
| TC-GL-05 | `MEMBER_DIAGNOSTICS_FIELD_LABELS.matchedResponse` | `"照合できたフォーム回答"` | AC-7 |
| TC-GL-06 | `MEMBER_DIAGNOSTICS_FIELD_LABELS.responseFields` | `"取得できた項目数"` | AC-7 |
| TC-GL-07 | `MEMBER_DIAGNOSTICS_FIELD_LABELS.publicVisible` | `"公開ディレクトリに表示"` | AC-7 |
| TC-GL-08 | `MEMBER_DIAGNOSTICS_FIELD_LABELS.h3Hidden` | `"同意・公開設定により非表示"` | AC-7 |
| TC-GL-09 | `MEMBER_DIAGNOSTICS_FIELD_LABELS.h4MissingFields` | `"未入力の項目あり"` | AC-7 |
| TC-GL-10 | `MEMBER_SYSTEM_SECTION_LABELS.identity` | `"本人情報（システム項目）"` | AC-8 |
| TC-GL-11 | `MEMBER_SYSTEM_SECTION_LABELS.diagnostics` | `"診断情報"` | AC-8 |
| TC-GL-12 | `formatBooleanJa(true)` | `"はい"` | AC-4, AC-6 |
| TC-GL-13 | `formatBooleanJa(false)` | `"いいえ"` | AC-4, AC-6 |

> TC-GL-12/13 は両分岐を必ず網羅する（branch coverage 100%・Phase 7）。定数の網羅テストは「将来ラベル追加時に値ドリフトを検知する回帰 guard」を兼ねる。

---

## T3: `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`（既存ファイルへ TC 追記）

対象: F3。最終更新列が `formatJstDateTimeWithSeconds` の JST 整形テキストで描画されること。
既存ファイル前提（確認済み）: `mkMember` ヘルパーが `lastSubmittedAt: "2026-05-01T00:00:00.000Z"` をデフォルト保持。`vi.mock("next/navigation", ...)` 済み。`afterEach(() => cleanup())` 済み。

| TC-ID | セットアップ | 期待値 | AC |
| --- | --- | --- | --- |
| TC-MT-LM-01 | `mkMember("M1","太郎",{ lastSubmittedAt: "2026-06-09T10:34:19.996603Z" })` を `items` に 1 件で render | `screen.getByText("2026年6月9日 19:34:19")` が存在する。ISO 生文字列 `"2026-06-09T10:34:19.996603Z"` は **DOM に存在しない**（`queryByText(/2026-06-09T/)` が null） | AC-1 |
| TC-MT-LM-02 | `mkMember(...,{ lastSubmittedAt: "" })`（空）で render | 空文字 fail-soft により列がクラッシュしない（render が throw しない）。セルが空表示で存在する | AC-1, AC-2 |

> **既存テストを壊さない制約**: 既存 TC-MT-01〜05（empty 表示・行クリック・選択 等）は変更しない。追記する TC は新規 `it(...)` ブロックのみ。`mkMember` のデフォルト `lastSubmittedAt` を変えると他 TC に波及するため、デフォルト値は変更せず TC 内で `overrides` 指定する。
> jest-axe の `axe` 検証は既存 TC が担保済み。新規 TC で axe を再実行する必要はない（表示テキスト差し替えのみで a11y 構造不変）。

---

## T4: `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx`（新規）

対象: F4。IDENTITY セクションが日本語ラベル主・英語キー併記・真偽値日本語・見出し日本語で描画されること。
前提: `MemberDrawer` は props 駆動（fetch なし）。`next/navigation` 等の既存 mock が必要なら既存 `MemberDrawer.tags.spec.tsx` の mock 構成を踏襲する（実装者は着手前に同 spec の import/mock を確認）。

| TC-ID | 検証内容 | 期待 DOM | AC |
| --- | --- | --- | --- |
| TC-MD-01 | IDENTITY 見出しが日本語 | `screen.getByText("本人情報（システム項目）")` 存在。`screen.queryByText("identity (system field)")` は null | AC-8 |
| TC-MD-02 | 会員ID ラベル（日本語主） | `screen.getByText("会員ID")` 存在 | AC-3 |
| TC-MD-03 | 英語キー併記が DOM に残る | `screen.getByText("memberId")` 存在（併記の `<span>`）。`responseEmail` / `notificationOptOut` / `isDeleted` も同様に DOM 上に存在 | AC-3, AC-11 |
| TC-MD-04 | 回答メールアドレス ラベル | `screen.getByText("回答メールアドレス")` 存在 | AC-3 |
| TC-MD-05 | 真偽値 true=はい | `notificationOptOut: true` の detail で `screen.getByText("はい")` 存在。`"true"`（`String(true)`）は DOM に存在しない | AC-4 |
| TC-MD-06 | 真偽値 false=いいえ | `isDeleted: false` の detail で「いいえ」が表示される（同セクション内の対応 dd） | AC-4 |
| TC-MD-07 | 退会済みラベル | `screen.getByText("退会済み")` 存在（`isDeleted` の日本語ラベル） | AC-3 |

> **検証の注意（重複テキスト回避）**: 「はい/いいえ」が同セクションに複数 dd 出る場合 `getByText` が複数一致で throw する。`notificationOptOut`/`isDeleted` を **片方 true・片方 false** に設定して「はい」「いいえ」を各 1 件にするか、対象 dt の親 `<div>` を起点に `within(...)` でスコープして検証する。第一推奨: detail を `notificationOptOut: true, isDeleted: false` に固定し `getByText("はい")` と `getByText("いいえ")` を各 1 件で assert。
> **props モック**: `AdminMemberDetailView` の最小有効値を組み立てるヘルパー `makeDetail(overrides)` を spec 内に用意（`@ubm-hyogo/shared` の brand 型コンストラクタ `asMemberId` 等を T3 同様に使用）。`maskEmail` はマスキング継続なので email dd の exact 値は assert 対象にしない（ラベルのみ検証）。

---

## T5: `apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx`（新規）

対象: F5。DIAGNOSTICS が日本語ラベル主・英語ラベル併記・真偽値日本語・見出し日本語で描画されること。
前提: `MemberDiagnosticsPanel` は `useEffect` で `fetchMemberDiagnosis(memberId)` を呼ぶ。**module mock 必須**（上記「T5 の mock 方針」）。非同期解決を `await screen.findByText(...)` で待つ。

| TC-ID | 検証内容 | 期待 DOM | AC |
| --- | --- | --- | --- |
| TC-DG-01 | DIAGNOSTICS 見出し日本語 | `await screen.findByText("診断情報")` 存在。`queryByText("diagnostics")` は null | AC-8 |
| TC-DG-02 | 取得できた項目数 ラベル | `screen.getByText("取得できた項目数")` 存在。英語 `response fields` も併記で DOM 上に存在 | AC-5 |
| TC-DG-03 | 公開ディレクトリに表示 ラベル | `screen.getByText("公開ディレクトリに表示")` 存在。`public visible` も併記で存在 | AC-5 |
| TC-DG-04 | 真偽値 true=はい | `visibleOnPublicDirectory: true` の mock で対応 dd が「はい」。`"yes"` は DOM に存在しない | AC-6 |
| TC-DG-05 | 真偽値 false=いいえ | `H3_hiddenByConsentOrPublish: false` の mock で対応 dd が「いいえ」。`"no"` は DOM に存在しない | AC-6 |
| TC-DG-06 | 照合できたフォーム回答 ラベル | `screen.getByText("照合できたフォーム回答")` 存在。値（ID or `none`）はラベル日本語化の対象外（SSOT OOS-3）で不変 | AC-5 |
| TC-DG-07 | 英語ラベル併記が DOM に残る | `H3 hidden` / `H4 missing fields` / `matched response` の英語テキストが併記で DOM 上に存在 | AC-5, AC-11 |

> **重複「はい/いいえ」対策**: T4 と同様。mock の `visibleOnPublicDirectory`/`H3_hiddenByConsentOrPublish`/`H4_missingFieldsNonEmpty` を意図的に true/false 混在させ、各テキストを 1 件に絞るか `within` でスコープする。第一推奨: `visibleOnPublicDirectory: true, H3_hiddenByConsentOrPublish: false, H4_missingFieldsNonEmpty: false` とし「はい」1 件・「いいえ」2 件 → `getAllByText("いいえ").length === 2` で件数 assert。
> **エラー/ローディング不変の確認（任意）**: `fetchMemberDiagnosis` を `mockRejectedValue` にして `role="alert"` の「診断の読み込み失敗:」が出ることのスモークを 1 件追加してよい（F5 の error/status 文言不変の回帰 guard。AC 非対象）。
> **`makeDiagnosis(overrides)` ヘルパー**: `MemberDiagnosis` 型（`apps/web/src/features/admin/diagnostics/types.ts`）の最小有効値を組み立てる。zod parse は mock で bypass されるため型を満たせばよい（実 schema parse は走らない）。

---

## テスト ↔ AC トレーサビリティ

| AC | 担保する TC |
| --- | --- |
| AC-1（一覧最終更新 JST） | TC-MT-LM-01, TC-MT-LM-02, TC-DT-01 |
| AC-2（datetime helper fail-soft） | TC-DT-01〜07 |
| AC-3（IDENTITY 日本語主・英語併記） | TC-MD-02, TC-MD-03, TC-MD-04, TC-MD-07 |
| AC-4（IDENTITY 真偽値 はい/いいえ） | TC-MD-05, TC-MD-06, TC-GL-12, TC-GL-13 |
| AC-5（DIAGNOSTICS 日本語主・英語併記） | TC-DG-02, TC-DG-03, TC-DG-06, TC-DG-07 |
| AC-6（DIAGNOSTICS 真偽値 はい/いいえ） | TC-DG-04, TC-DG-05, TC-GL-12, TC-GL-13 |
| AC-7（用語集 SSOT 集約） | TC-GL-01〜09 |
| AC-8（見出し日本語化） | TC-GL-10, TC-GL-11, TC-MD-01, TC-DG-01 |
| AC-9（OKLch トークン） | Phase 5 の `verify:tokens`（テストでなく gate） |
| AC-10（apps/api 非変更） | Phase 5 の `git diff --name-only -- apps/api`（gate） |
| AC-11（既存テスト互換・英語キー DOM 残存） | TC-MD-03, TC-DG-07 + 既存 TC 全 PASS |

## 実行コマンド（SSOT §8）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
```

## 完了条件（Phase 4）

- T1-T5 の全 TC（TC-ID・入力・期待値・対応 AC）を確定した。
- 各テストの操作面（外部 props / mock / 純関数引数）を VSCPKR-03 に従い明記した。
- T5 の mock 方針を VSCPKR-02 厳守で確定した（module mock 第一推奨・`vi.stubGlobal("window")` 禁止）。
- 重複テキストによる `getByText` 多重一致のリスクと回避策を明記した。
- AC ↔ TC トレーサビリティを確定した。
