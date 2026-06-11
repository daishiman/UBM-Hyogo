# Phase 2: 設計

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [phase-1-requirements.md](phase-1-requirements.md) / [shared-context.md](shared-context.md)
- 本 Phase の責務: 変更ファイルごとの Before/After・関数シグネチャ・データ構造・責務境界・レーン分割を確定する

## 設計方針（全体）

1. **表現層のみで完結**: API レスポンス（ISO 文字列・boolean・英語キー値）は不変。表示直前に純関数で変換する。
2. **純関数 SSOT 化**: 日時整形（`datetime.ts`）と用語集（`memberSystemFieldGlossary.ts`）を純関数/純データに切り出し、コンポーネントは参照のみ。テスト容易性と表記ドリフト防止を両立。
3. **fail-soft**: 日時 helper は不正値で例外を投げず元入力を返す（WEEKGRD-02: 純関数ガードは例外なし・防御的値返却）。
4. **既存テスト互換**: 英語キー文字列を DOM に残す併記方式により、既存テストの破壊を最小化（AC-11）。
5. **トークン正本厳守**: 新規 className は `var(--ubm-color-*)` のみ。HEX 直書き禁止（AC-9）。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 要素 | 再利用 | 判断 |
| --- | --- | --- |
| 日時整形 | 既存 `formatJstDateTime` は分まで（秒なし・年2桁） | 要件（年月日漢字・秒まで）に不適合 → **新 helper 追加**（既存は不変で他所の利用を保護） |
| 用語集 | 既存 `ZONE_LABEL` / PublishState `LABEL` パターン | IDENTITY/DIAGNOSTICS 用の用語集は未存在 → **新規 SSOT 作成**（既存パターンに倣う） |
| 真偽値表示 | `MemberDiagnosticsPanel.boolLabel`（yes/no・局所） | 日本語化が必要 → SSOT の `formatBooleanJa` に統一し局所版を削除 |
| 描画構造 | 既存 `<dl>/<dt>/<dd>`、`KVList` | 構造は維持（テスト互換）。テキストとフォーマッタのみ差し替え |

## F1: `apps/web/src/lib/format/datetime.ts`（編集）

SSOT §6 F1 を正本とする。

- **追加**: `JST_PARTS_FORMATTER`（`Intl.DateTimeFormat("ja-JP", { timeZone:"Asia/Tokyo", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false })`）
- **追加**: `formatJstDateTimeWithSeconds(iso: string): string`
  - 入力: ISO 8601 文字列
  - 出力: `2026年6月9日 19:34:19`（月日はゼロ埋め除去・時分秒は 2 桁維持）
  - 副作用: なし（純関数）
  - エラー: `Number.isNaN(d.getTime())` で不正値検知 → 元入力 `iso` をそのまま返す（fail-soft）
- **不変**: 既存 `JST_FORMATTER` / `formatJstDateTime` は一切変更しない（他所で使用中: MemberDrawer 送信日時・監査ログ・Recent Actions）

設計理由: `Intl` の文字列結合はロケール実装差があるため `formatToParts` で確定組み立て。`Asia/Tokyo` 固定で UTC→JST を保証。

## F2: `memberSystemFieldGlossary.ts`（新規 SSOT）

SSOT §6 F2 を正本とする。パス: `apps/web/src/features/admin/components/_members/memberSystemFieldGlossary.ts`

### データ構造

| export | 型 | 内容 |
| --- | --- | --- |
| `MEMBER_IDENTITY_FIELD_LABELS` | `Record<string,string>` (as const satisfies) | `memberId:会員ID` / `responseEmail:回答メールアドレス` / `notificationOptOut:通知の受け取り停止` / `isDeleted:退会済み` |
| `MEMBER_DIAGNOSTICS_FIELD_LABELS` | `Record<string,string>` | `matchedResponse:照合できたフォーム回答` / `responseFields:取得できた項目数` / `publicVisible:公開ディレクトリに表示` / `h3Hidden:同意・公開設定により非表示` / `h4MissingFields:未入力の項目あり` |
| `MEMBER_SYSTEM_SECTION_LABELS` | `{ identity:string; diagnostics:string }` | `identity:本人情報（システム項目）` / `diagnostics:診断情報` |
| `formatBooleanJa` | `(value:boolean)=>string` | `true→はい` / `false→いいえ` |

責務: 日本語ラベル・真偽値表記の唯一の正本。英語キー併記は描画側の責務（SSOT は日本語のみ保持）。

## F3: `MembersTable.tsx`（編集・最終更新列）

SSOT §6 F3 を正本とする。

- import 追加: `import { formatJstDateTimeWithSeconds } from "../../../../lib/format/datetime";`
- 161-163 行 `{m.lastSubmittedAt}` → `{formatJstDateTimeWithSeconds(m.lastSubmittedAt)}`
- `font-mono` クラス除去（日本語表記に等幅は不自然）。列ヘッダー「最終更新」（97 行）は不変。
- `data-testid` / `aria-label` / 列構造は不変（テスト互換）。

## F4: `MemberDrawer.tsx`（編集・IDENTITY）

SSOT §6 F4 を正本とする。対象: 229-254 行のみ。

- import 追加: `MEMBER_IDENTITY_FIELD_LABELS`, `MEMBER_SYSTEM_SECTION_LABELS`, `formatBooleanJa`（`./memberSystemFieldGlossary`）
- 見出し（234 行）: `identity (system field)` → `{MEMBER_SYSTEM_SECTION_LABELS.identity}`。`uppercase` クラスは日本語に無効なので除去。
- `aria-labelledby="drawer-identity-heading"` / `id="drawer-identity-heading"` は**不変**（アクセシビリティ・テスト互換）。
- 各 `<dt>`: 日本語ラベル主 + 英語キーを `<span className="ml-1 font-mono text-[10px] opacity-60">memberId</span>` で併記。
- `<dd>`: `memberId`→`detail.identityMemberId`（不変）/ `responseEmail`→`maskEmail(...)`（不変・マスキング継続）/ `notificationOptOut`・`isDeleted`→`String(...)` を `formatBooleanJa(...)` に置換。
- **触らない**: 送信日時（201-205）/ 退会済みセクション（257-272）/ 監査ログ（274-299）/ DELETED 文言。

> opacity を class で表現する際は既存トークン方針に反しないこと。`opacity-60` は Tailwind ユーティリティで色 HEX を含まないため AC-9 に抵触しない。英語キーの文字色は `text-[var(--ubm-color-text-muted)]` を継承（dt 既存クラス）。

## F5: `MemberDiagnosticsPanel.tsx`（編集・DIAGNOSTICS）

SSOT §6 F5 を正本とする。対象: 50-80 行 + `boolLabel`（11 行）。

- import 追加: `MEMBER_DIAGNOSTICS_FIELD_LABELS`, `MEMBER_SYSTEM_SECTION_LABELS`, `formatBooleanJa`（`./memberSystemFieldGlossary`）
- 11 行 `const boolLabel = ...` を**削除**し、全 `boolLabel(...)` 呼び出しを `formatBooleanJa(...)` に置換。
- 見出し（53 行）: `diagnostics` → `{MEMBER_SYSTEM_SECTION_LABELS.diagnostics}`。`uppercase` 除去。
- 各 `<dt>`: 日本語ラベル主 + 英語ラベル併記（`matched response` 等の元テキストを `<span>` 併記）。
- 値表示: `matched response`（`?? "none"`）・`response fields`（`n / m`）・`missing: ...` 補助行は不変（数値/IDのため）。真偽値 3 箇所のみ `formatBooleanJa` 化。
- `role="alert"`（35-40）/ `role="status"`（42-48）のローディング・エラー文言は不変。

## レーン分割（Phase 4-13）

| レーン | 担当 Phase | 作成ファイル | 競合回避 |
| --- | --- | --- | --- |
| Lane A | 4, 5, 6, 7 | `phase-4-test-plan.md`, `phase-5-implementation.md`, `phase-6-test-additions.md`, `phase-7-coverage.md` | 別ファイルのみ |
| Lane B | 8, 9, 10, 11 | `phase-8-refactor.md`, `phase-9-qa.md`, `phase-10-final-review.md`, `phase-11-manual-test.md` | 別ファイルのみ |
| Lane C | 12, 13 | `phase-12-documentation.md`, `phase-13-pr.md`, `outputs/phase-12/*`（strict 7） | 別ファイルのみ。SSOT から全情報取得 |

各レーンは本 SSOT を唯一の情報源とし、相互参照は結論引用のみ（ファイル書き込み競合なし）。

## 責務所有権（状態混在の防止）

| 関心 | 所有者 |
| --- | --- |
| 日時整形ロジック | `datetime.ts`（純関数） |
| 日本語ラベル・真偽値表記 | `memberSystemFieldGlossary.ts`（純データ/純関数） |
| 一覧の描画 | `MembersTable.tsx`（整形 helper を呼ぶだけ） |
| 詳細 IDENTITY 描画 | `MemberDrawer.tsx`（SSOT を参照するだけ） |
| 詳細 DIAGNOSTICS 描画 | `MemberDiagnosticsPanel.tsx`（SSOT を参照するだけ・データ fetch は既存のまま） |

ロジックと描画を分離し、コンポーネントはフォーマット規則を所有しない。

## 完了条件（Phase 2）

- 5 ファイルの Before/After・シグネチャ・責務境界を確定した。
- 既存コンポーネント再利用可否を判定した（helper/SSOT は新規・描画構造は再利用）。
- レーン分割と競合回避を確定した。
- アクセシビリティ識別子（id/aria-labelledby/role/data-testid）の不変を明記した。
