# Phase 5: 実装手順

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [shared-context.md](shared-context.md)（SSOT・特に §6 Before/After を正本）/ [phase-4-test-plan.md](phase-4-test-plan.md)
- 本 Phase の責務: SSOT §6 の F1-F5 を実コードへ反映し、検証コマンド対応・DoD を固定する。commit / PR は user-gated。

## 新規作成 / 修正ファイルパス一覧（FB RT-03）

| # | パス | 種別 |
| --- | --- | --- |
| F1 | `apps/web/src/lib/format/datetime.ts` | 編集（helper 追加。既存関数不変） |
| F2 | `apps/web/src/features/admin/components/_members/memberSystemFieldGlossary.ts` | **新規** |
| F3 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集（最終更新列） |
| F4 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集（IDENTITY 229-254 行） |
| F5 | `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx` | 編集（DIAGNOSTICS 11/50-80 行） |
| T1 | `apps/web/src/lib/format/__tests__/datetime.spec.ts` | **新規** |
| T2 | `apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts` | **新規** |
| T3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 編集（TC 追記） |
| T4 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx` | **新規** |
| T5 | `apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx` | **新規** |

> **apps/api / packages/shared / D1 migration / Google Form schema は変更しない**（AC-10）。上記 10 ファイル以外を触らない。

## 着手前チェック（Step 0・必須）

実装者は着手前に以下を実行し、既存テスト・Playwright が英語キーを exact 一致で検証していないか確認する（AC-11 の前提整備）。

```bash
# 英語キー exact 一致の既存テスト/Playwright を洗い出す
grep -rn 'getByText("memberId")' apps/web
grep -rn 'getByText("responseEmail")\|getByText("notificationOptOut")\|getByText("isDeleted")' apps/web
grep -rn '"identity (system field)"\|"diagnostics"' apps/web
grep -rn 'matched response\|response fields\|public visible\|H3 hidden\|H4 missing' apps/web
# Playwright fixture
grep -rn 'memberId\|notificationOptOut' apps/web/playwright/tests/admin-member-delete.spec.ts
# 1 桁時の Intl 実出力確認（TC-DT-02/03 の期待値確定に必須・Phase 4 注記）
mise exec -- node -e 'console.log(new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",hour:"2-digit",hour12:false}).formatToParts(new Date("2026-01-05T00:00:00Z")).find(p=>p.type==="hour").value)'
```

- exact 一致が見つかった場合: 併記方式で英語キーは DOM に残るため `exact:false` の検索なら通る。`exact:true`（デフォルトの完全一致）で破綻する箇所は Phase 6 の方針に従いテスト側を併記対応に更新する。
- Playwright で英語キー依存があれば、併記により DOM に残るので原則通るが、`text=memberId` の strict セレクタで複数一致になる場合は具体的セレクタへ更新する。

---

## Step 1（F1）: `datetime.ts` に helper 追加

検証: TC-DT-01〜07 / AC-1, AC-2 / `mise exec -- pnpm typecheck`

既存 `JST_FORMATTER` / `formatJstDateTime` は**一切変更しない**。末尾に以下を追加する（SSOT §6 F1 正本）。

```ts
const JST_PARTS_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * 非エンジニア向けの完全な JST 表記。例: "2026年6月9日 19:34:19"
 * - 年月日は漢字区切り（月日のゼロ埋めは外す）
 * - 時刻はコロン区切りで秒まで（時分秒は 2 桁ゼロ埋め維持）
 * - 不正値 / 空文字は元入力をそのまま返す（fail-soft・例外なし）
 */
export function formatJstDateTimeWithSeconds(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = JST_PARTS_FORMATTER.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === t)?.value ?? "";
  const y = get("year");
  const mo = Number(get("month"));
  const da = Number(get("day"));
  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second");
  return `${y}年${mo}月${da}日 ${hh}:${mi}:${ss}`;
}
```

> 月日は `Number()` でゼロ埋め除去（`6月9日`）。時分秒は `hour/minute/second: "2-digit"` 部品をそのまま使うため 2 桁ゼロ埋め維持（`09:00:00`）。Step 0 の `node -e` で `hour` 部品が `"09"` であることを確認し、TC-DT-02/03 の期待値を `09:00:00` / `00:00:00` に確定する。

---

## Step 2（F2）: `memberSystemFieldGlossary.ts` を新規作成

検証: TC-GL-01〜13 / AC-7, AC-8, AC-4, AC-6 / typecheck

パス: `apps/web/src/features/admin/components/_members/memberSystemFieldGlossary.ts`（SSOT §6 F2 正本）

```ts
// IDENTITY (system field) — 英語キー → 日本語ラベル
export const MEMBER_IDENTITY_FIELD_LABELS = {
  memberId: "会員ID",
  responseEmail: "回答メールアドレス",
  notificationOptOut: "通知の受け取り停止",
  isDeleted: "退会済み",
} as const satisfies Record<string, string>;

// DIAGNOSTICS — 英語キー → 日本語ラベル
export const MEMBER_DIAGNOSTICS_FIELD_LABELS = {
  matchedResponse: "照合できたフォーム回答",
  responseFields: "取得できた項目数",
  publicVisible: "公開ディレクトリに表示",
  h3Hidden: "同意・公開設定により非表示",
  h4MissingFields: "未入力の項目あり",
} as const satisfies Record<string, string>;

// セクション見出し
export const MEMBER_SYSTEM_SECTION_LABELS = {
  identity: "本人情報（システム項目）",
  diagnostics: "診断情報",
} as const;

/** 真偽値の日本語表記。true→「はい」/ false→「いいえ」 */
export function formatBooleanJa(value: boolean): string {
  return value ? "はい" : "いいえ";
}
```

> 英語キー併記は描画側（F4/F5）の責務。SSOT は日本語ラベルのみ保持する。

---

## Step 3（F3）: `MembersTable.tsx` 最終更新列を helper で描画

検証: TC-MT-LM-01, TC-MT-LM-02 / AC-1 / typecheck, lint, focused vitest

import を追加し、161-163 行の直描画を差し替える（SSOT §6 F3 正本）。

```tsx
// import（相対パスは MembersTable.tsx の位置から lib/format/datetime までを実確認して確定）
import { formatJstDateTimeWithSeconds } from "../../../../lib/format/datetime";
```

```tsx
// Before（161-163 行）:
// <td className="px-3 py-2 font-mono text-xs text-[var(--ubm-color-text-muted)]">
//   {m.lastSubmittedAt}
// </td>

// After:
<td className="px-3 py-2 text-xs text-[var(--ubm-color-text-muted)]">
  {formatJstDateTimeWithSeconds(m.lastSubmittedAt)}
</td>
```

> `font-mono` は日本語表記で不自然なため除去。列ヘッダー「最終更新」（97 行付近）・`data-testid`・`aria-label`・列構造は不変。import の相対パス段数は実ファイル位置で確認すること（`../../../../lib/...` の段数が環境と一致するか typecheck で担保）。

---

## Step 4（F4）: `MemberDrawer.tsx` IDENTITY を SSOT で日本語化

検証: TC-MD-01〜07 / AC-3, AC-4, AC-8 / typecheck, lint, focused vitest

対象は 229-254 行の IDENTITY セクションのみ（SSOT §6 F4 正本）。送信日時（201-205）/ 退会済みセクション（257-272）/ 監査ログ（274-299）は**触らない**。

```tsx
// import 追加
import {
  MEMBER_IDENTITY_FIELD_LABELS,
  MEMBER_SYSTEM_SECTION_LABELS,
  formatBooleanJa,
} from "./memberSystemFieldGlossary";
```

変更点:

1. 見出し（234 行）`identity (system field)` → `{MEMBER_SYSTEM_SECTION_LABELS.identity}`。`uppercase` クラスは除去（日本語に無効）。**`id="drawer-identity-heading"` / `aria-labelledby` は不変**。
2. 各 `<dt>` を「日本語ラベル主 + 英語キー併記」にする（併記パターン）:

```tsx
// memberId 行（例）
<div className="flex gap-2">
  <dt className="w-32 text-[var(--ubm-color-text-muted)]">
    {MEMBER_IDENTITY_FIELD_LABELS.memberId}
    <span className="ml-1 font-mono text-[10px] opacity-60">memberId</span>
  </dt>
  <dd className="font-mono">{detail.identityMemberId}</dd>
</div>
```

3. `responseEmail` 行: dt を `MEMBER_IDENTITY_FIELD_LABELS.responseEmail` + `<span>responseEmail</span>` 併記。dd は **`maskEmail(detail.identityEmail)` を維持**（マスキング継続）。
4. `notificationOptOut` 行: dd の `String(...)` を `formatBooleanJa(detail.status.notificationOptOut)` に置換。dt に `notificationOptOut` 併記。
5. `isDeleted` 行: dd の `String(...)` を `formatBooleanJa(detail.status.isDeleted)` に置換。dt に `isDeleted` 併記。

> 英語キー文字列（`memberId` / `responseEmail` / `notificationOptOut` / `isDeleted`）は `<span>` 内に残すため DOM 上に存在し、既存テストの併記対応検索（exact:false）が通る（AC-11）。`opacity-60` は色 HEX を含まないため AC-9 非抵触。色は dt 既存の `text-[var(--ubm-color-text-muted)]` を継承。

---

## Step 5（F5）: `MemberDiagnosticsPanel.tsx` DIAGNOSTICS を SSOT で日本語化

検証: TC-DG-01〜07 / AC-5, AC-6, AC-8 / typecheck, lint, focused vitest

対象は 11 行 `boolLabel` と 50-80 行の DIAGNOSTICS（SSOT §6 F5 正本）。`role="alert"`（35-40）/ `role="status"`（42-48）のローディング・エラー文言は**不変**。データ fetch（`useEffect` + `fetchMemberDiagnosis`）も不変。

```tsx
// import 追加
import {
  MEMBER_DIAGNOSTICS_FIELD_LABELS,
  MEMBER_SYSTEM_SECTION_LABELS,
  formatBooleanJa,
} from "./memberSystemFieldGlossary";
```

変更点:

1. 11 行 `const boolLabel = (value: boolean): string => (value ? "yes" : "no");` を**削除**し、全 `boolLabel(...)` 呼び出しを `formatBooleanJa(...)` に置換。
2. 見出し（53 行）`diagnostics` → `{MEMBER_SYSTEM_SECTION_LABELS.diagnostics}`。`uppercase` 除去。
3. 各 `<dt>` を日本語ラベル主 + 英語ラベル併記:

```tsx
// matched response 行
<dt className="text-[var(--ubm-color-text-muted)]">
  {MEMBER_DIAGNOSTICS_FIELD_LABELS.matchedResponse}
  <span className="ml-1 font-mono text-[10px] opacity-60">matched response</span>
</dt>
// 以下 response fields / public visible / H3 hidden / H4 missing fields も同様
```

4. 真偽値 3 箇所のみ `formatBooleanJa` 化:

```tsx
<dd>{formatBooleanJa(data.publishState.visibleOnPublicDirectory)}</dd>
<dd>{formatBooleanJa(data.hypothesisFlags.H3_hiddenByConsentOrPublish)}</dd>
<dd>{formatBooleanJa(data.hypothesisFlags.H4_missingFieldsNonEmpty)}</dd>
```

> 値表示は不変: `matched response`（`matchedFormResponseId ?? "none"`）/ `response fields`（`n / m`）/ `missing: ...` 補助行は数値・ID・キー列挙なのでラベルのみ日本語化（SSOT OOS-3）。`none` の和訳は任意・AC 非対象。

---

## Step 6: テスト作成・追記（T1-T5）

検証: focused vitest（SSOT §8）全 PASS / AC-11

[phase-4-test-plan.md](phase-4-test-plan.md) の TC を実装する。順序:

1. T1 `datetime.spec.ts`（新規）— TC-DT-01〜07
2. T2 `memberSystemFieldGlossary.spec.ts`（新規）— TC-GL-01〜13
3. T3 `MembersTable.spec.tsx`（既存へ TC-MT-LM-01/02 追記。既存 TC 不変）
4. T4 `MemberDrawer.identityLabels.spec.tsx`（新規）— TC-MD-01〜07。`MemberDrawer.tags.spec.tsx` の mock 構成を踏襲
5. T5 `MemberDiagnosticsPanel.spec.tsx`（新規）— TC-DG-01〜07。**module mock**（`vi.mock("../../diagnostics/api", ...)`）。`vi.stubGlobal("window")` 禁止（VSCPKR-02）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
```

---

## Step 7: 全体検証（SSOT §8）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint        # 失敗時はまず lint --fix → 残りを手修正
mise exec -- pnpm verify:tokens   # HEX 0 件（AC-9）
git diff --name-only -- apps/api   # 空であること（AC-10）
```

## DoD（Definition of Done）

- `mise exec -- pnpm typecheck` PASS
- `mise exec -- pnpm lint` PASS
- `mise exec -- pnpm verify:tokens` 緑（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件・AC-9）
- focused vitest（T1-T5）全 PASS（既存 MembersTable TC も維持・AC-11）
- `git diff --name-only -- apps/api` が**空**（AC-10）
- `git diff --name-only` の変更が上記 10 ファイルのみ（範囲逸脱なし）

## 完了条件（Phase 5）

- F1-F5 の Before/After を着手可能粒度で展開した。
- 着手前 grep チェック（英語キー exact 一致 / 1 桁時 Intl 出力）を Step 0 に明記した。
- 各 Step に検証コマンドと対応 AC を紐付けた。
- DoD を確定した（typecheck/lint/verify:tokens/focused vitest/apps/api 空 diff）。
