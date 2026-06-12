# SSOT: 共有コンテキスト（admin-members-timestamp-jst-and-identity-label-clarity）

> 本ファイルは全 Phase / 全レーンが参照する**唯一の正本**。Phase 1-13 の各仕様書は本 SSOT に矛盾してはならない。
> 数値・パス・行番号・関数シグネチャ・AC は本ファイルを単一情報源とする。

---

## 0. タスク識別

| 項目 | 値 |
| --- | --- |
| task_id | `admin-members-timestamp-jst-and-identity-label-clarity` |
| 実装区分 | **[実装区分: 実装仕様書]**（CONST_004 デフォルト。コード変更を伴う） |
| taskType | `implementation` |
| visualEvidence | `VISUAL`（一覧列・詳細ドロワーの表示テキスト変更） |
| implementation_mode | `new`（新規 helper / SSOT 追加 + 既存描画差し替え） |
| workflow_state | `implemented_local_evidence_captured`（apps/web 実装・focused Vitest・local Playwright fixture screenshots 取得済み。commit・PR・staging 認証 visual は user-gated） |
| canonical_workflow | `docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/` |
| branch | `feat/admin-members-timestamp-jst-and-identity-label-clarity` |
| scope_routes | `/(admin)/admin/members`（一覧 + 行クリックで開く詳細ドロワー） |
| 関連 issue | なし（relatedIssue=null。staging 観察報告起点） |

---

## 1. 真の論点（要件レビュー一次結論）

1. **真の論点**: 管理画面の会員管理で、非エンジニアの運営者が「最終更新がいつか」「この人の情報がどういう状態か」を**一目で読めない**。原因は表現層が機械可読の生データ（ISO 8601 タイムスタンプ・英語キー名・true/false）をそのまま人間向け画面に出していること。
2. **依存関係・責務境界**: 本件は **apps/web 表現層のみ**の問題。API レスポンス（`lastSubmittedAt: string` ISO、`status.isDeleted: boolean` 等）は正しく、D1 / Google Form schema は無罪。表示変換の責務が表現層に欠けている（フォーマッタ未適用 + 用語集 SSOT 未存在）。
3. **価値とコストの不均衡**: 価値=運営者の認知負荷低下（日次運用の読み取りミス防止）。コストは小（純関数 helper 1 + 用語集 SSOT 1 + 描画差し替え 3 ファイル）。高コスト部品なし。
4. **改善優先順位**: ①最終更新の JST 化（毎画面で目に入る）→ ②IDENTITY 日本語化（ユーザー明示）→ ③DIAGNOSTICS 日本語化（同画面の英語キー残存解消）。3 つは同一 PR・1 サイクルで完結可能（CONST_007）。
5. **4 条件**: 価値性=運営者の読み取りコスト減で定義済 / 実現性=表現層のみで薄い / 整合性=API 非接触で境界が閉じる / 運用性=用語集 SSOT 化で今後の追加項目も一元管理。

### 因果ループ

- バランスループ: 「生データ直書き → 運営者が読めない → 個別に問い合わせ/誤読 → 運用コスト増」を、フォーマッタ + 用語集 SSOT で断つ。
- 強化ループ（正方向）: 用語集 SSOT を一度作れば、今後 IDENTITY/DIAGNOSTICS に項目が増えても日本語ラベルを 1 箇所追加するだけで全画面に反映 → 表記ドリフトを構造的に防止。

---

## 2. 根本原因（確定・実コード照合済み）

| RC | 症状 | 真因（ファイル:行） | 区分 |
| --- | --- | --- | --- |
| RC-1 | 一覧「最終更新」列が `2026-06-09T10:34:19.996603Z`（ISO 生） | `MembersTable.tsx:161-163` が `{m.lastSubmittedAt}` を**フォーマッタ未適用**で直描画 | apps/web 表現層 |
| RC-2 | 詳細 IDENTITY が `memberId`/`responseEmail`/`notificationOptOut`/`isDeleted` の英語キー | `MemberDrawer.tsx:236-253` がキー名を**ハードコード**、bool は `String()`（"true"/"false"） | apps/web 表現層 |
| RC-3 | 詳細 DIAGNOSTICS が `matched response`/`response fields`/`public visible`/`H3 hidden`/`H4 missing fields` の英語 | `MemberDiagnosticsPanel.tsx:55-79` がラベルを**ハードコード**、bool は `boolLabel()` → "yes"/"no" | apps/web 表現層 |
| RC-4 | 英語キー→日本語ラベルの**統一 SSOT が未存在** | プロジェクトに `memberSystemFieldGlossary` 等の用語集なし（ZONE_LABEL / PublishState LABEL は局所的に存在） | apps/web 構造欠如 |

> **API / D1 / Form は無罪**。`AdminMemberDetailView` / `MemberDiagnosis` の型・値は正しい。表示変換の欠如のみが原因。

---

## 3. ユーザー決定事項（AskUserQuestion 回答・2026-06-10）

| Q | 決定 |
| --- | --- |
| Q1: 日時書式 | **`2026年6月9日 19:34:19`**（年月日を漢字・時刻はコロン区切りで秒まで） |
| Q2: 日本語化範囲 | **IDENTITY と DIAGNOSTICS の両方** |
| Q3: 英語キーの扱い | **日本語ラベルを主・英語キーを併記**（既存テスト互換維持） |
| Q4: 真偽値の表示 | **日本語にする**（はい/いいえ） |

---

## 4. Acceptance Criteria（正本）

| AC | 内容 | 検証 |
| --- | --- | --- |
| AC-1 | 会員管理一覧の「最終更新」列が ISO 生でなく `2026年6月9日 19:34:19`（JST・年月日漢字・秒まで）で表示される | MembersTable.spec.tsx |
| AC-2 | 日時整形は `datetime.ts` の新規 helper `formatJstDateTimeWithSeconds` に集約。不正値・空文字は元入力をそのまま返す（fail-soft・例外を投げない） | datetime.spec.ts |
| AC-3 | 詳細ドロワー IDENTITY が日本語ラベル主・英語キー併記（例: 会員ID + `memberId`）で表示される | MemberDrawer.spec.tsx |
| AC-4 | IDENTITY の真偽値（notificationOptOut / isDeleted）が「はい/いいえ」で表示される | MemberDrawer.spec.tsx |
| AC-5 | DIAGNOSTICS が日本語ラベル主・英語キー併記で表示される | MemberDiagnosticsPanel.spec.tsx |
| AC-6 | DIAGNOSTICS の真偽値（public visible / H3 / H4）が「はい/いいえ」で表示される | MemberDiagnosticsPanel.spec.tsx |
| AC-7 | 英語キー→日本語ラベル + 真偽値日本語化が新規 SSOT `memberSystemFieldGlossary.ts` に集約され、各コンポーネントは SSOT を参照する | memberSystemFieldGlossary.spec.ts |
| AC-8 | セクション見出しも日本語化（`identity (system field)` → `本人情報（システム項目）`、`diagnostics` → `診断情報`） | MemberDrawer / Panel spec |
| AC-9 | OKLch トークン正本のみ使用。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件（`verify:tokens` 緑） | verify:tokens |
| AC-10 | apps/api / D1 migration / Google Form schema 非変更（`git diff --name-only -- apps/api` が空） | git diff |
| AC-11 | 既存テストの英語キー依存箇所を破壊しない（併記により英語キー文字列は DOM に残す）。新規/更新テスト全 PASS | focused vitest |

---

## 5. 変更ファイル一覧（正本）

| # | パス | 種別 | 内容 |
| --- | --- | --- | --- |
| F1 | `apps/web/src/lib/format/datetime.ts` | 編集 | 新 helper `formatJstDateTimeWithSeconds(iso)` を追加。既存 `formatJstDateTime` は**変更しない**（他所で使用中） |
| F2 | `apps/web/src/features/admin/components/_members/memberSystemFieldGlossary.ts` | 新規 | IDENTITY/DIAGNOSTICS の英語キー→日本語ラベル + 真偽値日本語化の純データ/純関数 SSOT |
| F3 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集 | `lastSubmittedAt` を F1 helper で描画（161-163 行） |
| F4 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | IDENTITY セクション（229-254 行）を F2 SSOT で日本語ラベル主+英語キー併記・真偽値日本語化・見出し日本語化 |
| F5 | `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx` | 編集 | DIAGNOSTICS セクション（50-80 行）を F2 SSOT で日本語ラベル主+英語キー併記・真偽値日本語化・見出し日本語化 |
| T1 | `apps/web/src/lib/format/__tests__/datetime.spec.ts` | 新規 or 追記 | `formatJstDateTimeWithSeconds` の整形/fail-soft テスト |
| T2 | `apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts` | 新規 | SSOT のラベル網羅 + `formatBooleanJa` テスト |
| T3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 追記 | 最終更新列が JST 整形で表示されることのテスト（既存ファイルへ TC 追加） |
| T4 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx` | 新規 | IDENTITY 日本語ラベル + 真偽値 + 英語キー併記のテスト |
| T5 | `apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx` | 新規 | DIAGNOSTICS 日本語ラベル + 真偽値 + 英語キー併記のテスト |

> T3 は今回 `MembersTable.spec.tsx` に追加済み。併記方式により英語キー文字列は DOM に残り、focused Vitest 5 files / 41 tests PASS で確認済み。

---

## 6. 実装設計（Before / After）

### F1: datetime.ts 新 helper

```ts
// 追加（既存 formatJstDateTime / JST_FORMATTER はそのまま残す）
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

> 設計判断: `Intl.DateTimeFormat` の文字列結合はロケール実装差があるため、`formatToParts` で確定的に組み立てる。月日は `Number()` でゼロ埋め除去（`6月9日`）、時分秒は 2 桁維持（`19:34:09`）。タイムゾーンは `Asia/Tokyo` 固定で UTC→JST 変換を保証。

### F2: memberSystemFieldGlossary.ts（新規 SSOT）

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

> 英語キー併記は描画側で行う（SSOT は日本語ラベルのみ保持）。英語キー文字列は各コンポーネントが既存の通り保持し、`<dt>` 内に日本語主・英語副で併記する。

### F3: MembersTable.tsx（最終更新列）

```tsx
// import 追加
import { formatJstDateTimeWithSeconds } from "../../../../lib/format/datetime";

// 161-163 行 Before:
//   <td className="px-3 py-2 font-mono text-xs text-[var(--ubm-color-text-muted)]">
//     {m.lastSubmittedAt}
//   </td>
// After:
<td className="px-3 py-2 text-xs text-[var(--ubm-color-text-muted)]">
  {formatJstDateTimeWithSeconds(m.lastSubmittedAt)}
</td>
```

> `font-mono` は日本語表記では不要なので外す（任意。残しても可だが等幅日本語は不自然）。列ヘッダー「最終更新」は不変。

### F4: MemberDrawer.tsx（IDENTITY）

- 見出し `identity (system field)` → `{MEMBER_SYSTEM_SECTION_LABELS.identity}`（uppercase クラスは外す or 残す。日本語に uppercase は無効なので外して可）
- 各行: 日本語ラベル主 + 英語キーを小さく併記。真偽値は `formatBooleanJa()`。

```tsx
// 併記の描画パターン例（memberId 行）
<div className="flex gap-2">
  <dt className="w-32 text-[var(--ubm-color-text-muted)]">
    {MEMBER_IDENTITY_FIELD_LABELS.memberId}
    <span className="ml-1 font-mono text-[10px] opacity-60">memberId</span>
  </dt>
  <dd className="font-mono">{detail.identityMemberId}</dd>
</div>
// notificationOptOut 行の dd:
<dd>{formatBooleanJa(detail.status.notificationOptOut)}</dd>
// isDeleted 行の dd:
<dd>{formatBooleanJa(detail.status.isDeleted)}</dd>
```

> `responseEmail` の dd は既存の `maskEmail(detail.identityEmail)` を維持（マスキングは継続）。英語キー `memberId`/`responseEmail`/`notificationOptOut`/`isDeleted` は `<span>` 内に残すため、既存テストが `getByText("memberId")` 等を使っていても exact:false なら通る。exact:true で壊れる場合はテスト側を併記対応に更新する（AC-11）。

### F5: MemberDiagnosticsPanel.tsx（DIAGNOSTICS）

- 見出し `diagnostics` → `{MEMBER_SYSTEM_SECTION_LABELS.diagnostics}`
- `boolLabel`（yes/no）を削除し `formatBooleanJa`（はい/いいえ）に置換
- 各 dt を日本語ラベル主 + 英語キー併記

```tsx
import {
  MEMBER_DIAGNOSTICS_FIELD_LABELS,
  MEMBER_SYSTEM_SECTION_LABELS,
  formatBooleanJa,
} from "./memberSystemFieldGlossary";

// public visible 行の dd:
<dd>{formatBooleanJa(data.publishState.visibleOnPublicDirectory)}</dd>
// H3 hidden 行の dd:
<dd>{formatBooleanJa(data.hypothesisFlags.H3_hiddenByConsentOrPublish)}</dd>
// H4 missing fields 行の dd:
<dd>{formatBooleanJa(data.hypothesisFlags.H4_missingFieldsNonEmpty)}</dd>
```

> `matched response` の `none` 表示、`response fields` の `n / m` 表示、`missing: ...` の補助行は値の意味が数値/IDなのでそのまま維持（ラベルのみ日本語化）。`matchedFormResponseId ?? "none"` の `none` は「なし」に和訳してもよい（任意・実装者判断、AC には含めない）。

---

## 7. データソース（参照・非変更）

| 値 | 型定義 | API クライアント |
| --- | --- | --- |
| `lastSubmittedAt` (一覧) | `AdminMemberListItem.lastSubmittedAt: string`（`packages/shared/src/types/viewmodel/index.ts:189-203`） | `safeServerFetch<AdminMemberListView>`（members/page.tsx） |
| IDENTITY 各値 | `AdminMemberDetailView`（`packages/shared/src/types/viewmodel/index.ts:212-233`） | member detail fetch |
| DIAGNOSTICS 各値 | `MemberDiagnosis`（`apps/web/src/features/admin/diagnostics/types.ts:52-76`） | `fetchMemberDiagnosis`（`apps/web/src/features/admin/diagnostics/api.ts:22-28`） |

> いずれも**読み取りのみ**。型・API・D1・Form を変更しない（AC-10）。

---

## 8. 検証コマンド（正本）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
# focused vitest（ルートからフルパス指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
git diff --name-only -- apps/api   # 空であること（AC-10）
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/artifacts.json \
  docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/outputs/artifacts.json
```

---

## 9. スコープ外（baseline 未タスク候補・本サイクル非対象）

| OOS | 内容 | 非対象の理由 |
| --- | --- | --- |
| OOS-1 | 詳細ドロワー「送信日時」（`MemberDrawer.tsx:201-205`）の秒表示化 | 既に `formatJstDateTime` で `2026/06/03 19:30` と可読。ユーザー要求（最終更新列）の対象外。一貫性目的で将来 `formatJstDateTimeWithSeconds` 統一は可能だが baseline 候補 |
| OOS-2 | 監査ログ（`MemberDrawer.tsx:289`）の日時 | 同上。既に `formatJstDateTime` で可読 |
| OOS-3 | DIAGNOSTICS の `matched response = none` / `missing: ...` の和訳 | ラベル日本語化が主目的。値の意味（ID・キー列挙）は技術情報で、和訳は任意。AC 非対象 |
| OOS-4 | 他 admin 一覧（タグ管理等）のタイムスタンプ | 本タスクは会員管理画面に限定（ユーザー明示スコープ） |

> いずれも今サイクル完了の阻害要因ではなく、独立した将来改善。CONST_007 の「先送り」ではなく明確なスコープ境界。

---

## 10. Phase / レーン構成

| 自分（直列） | shared-context（本ファイル）+ Phase 1-3 + index.md + artifacts.json + outputs/artifacts.json |
| --- | --- |
| Lane A（並列） | Phase 4（テスト計画）/ 5（実装手順）/ 6（テスト追加）/ 7（カバレッジ） |
| Lane B（並列） | Phase 8（リファクタ）/ 9（QA）/ 10（最終レビュー）/ 11（手動テスト） |
| Lane C（並列） | Phase 12（ドキュメント同期）/ 13（PR）+ outputs/phase-12 strict 7 |

> 競合回避: 各レーンは別ファイルのみ作成。Lane C は本 SSOT から全情報を取得し、Phase 4-11 の結論を引用する形で compliance check を書く。
