# Phase 1: 要件定義

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused Vitest・local Playwright screenshot 取得済み。commit・PR・staging visual は user-gated）
- スコープ: `apps/web`（admin 会員管理画面）のみ。API/D1/Form 非変更（不変条件 #1 #5、AC-10）
- SSOT: [shared-context.md](shared-context.md)

## 実装区分の判定根拠（CONST_004）

ユーザー依頼は「最終更新のタイムスタンプを日本時間で読めるようにする」「IDENTITY 情報を非エンジニアでも分かる日本語にする」。
いずれも**画面の表示を実際に変える=コード変更が必須**であり、純粋なドキュメント/調査では達成できない。
したがってデフォルト通り **実装仕様書**として作成し、本サイクルで実コードと検証証跡まで反映した。
変更対象ファイル・関数シグネチャ・入出力・テスト・実行コマンド・DoD は CONST_005 に従い本仕様書群に含める。

## 目的

staging `/(admin)/admin/members`（会員管理）で、非エンジニアの運営者が以下を一目で読めるようにする:

1. **最終更新** 列が ISO 8601 の機械可読文字列（`2026-06-09T10:34:19.996603Z`）ではなく、
   日本時間の `2026年6月9日 19:34:19`（年月日漢字・秒まで）で表示される。
2. 会員詳細ドロワーの **IDENTITY（本人情報）** と **DIAGNOSTICS（診断情報）** が、
   英語キー名（`memberId` / `notificationOptOut` / `public visible` / `H3 hidden` 等）ではなく
   **日本語ラベル主・英語キー併記**で表示され、真偽値も「はい/いいえ」で表示される。

## 根本原因（確定・実コード照合済み）

SSOT §2 を正本とする。要約:

| RC | 真因 | 区分 |
| --- | --- | --- |
| RC-1 | `MembersTable.tsx:161-163` が `{m.lastSubmittedAt}` をフォーマッタ未適用で直描画 | apps/web 表現層 |
| RC-2 | `MemberDrawer.tsx:236-253` が IDENTITY 英語キーをハードコード、bool は `String()` | apps/web 表現層 |
| RC-3 | `MemberDiagnosticsPanel.tsx:55-79` が DIAGNOSTICS 英語ラベルをハードコード、bool は yes/no | apps/web 表現層 |
| RC-4 | 英語キー→日本語ラベルの統一 SSOT が未存在 | apps/web 構造欠如 |

**API / D1 / Google Form は無罪**。`AdminMemberListItem` / `AdminMemberDetailView` / `MemberDiagnosis` の値は正しく、表示変換の欠如のみが原因。

## ユーザー決定事項（AskUserQuestion 回答・2026-06-10）

SSOT §3 を正本とする。要約: ①日時=`2026年6月9日 19:34:19` / ②範囲=IDENTITY と DIAGNOSTICS 両方 / ③英語キー=日本語主・英語併記 / ④真偽値=日本語化。

## スコープ（本サイクル完結 = AC-1..AC-11）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| 最終更新 JST 化 | `formatJstDateTimeWithSeconds` 新規 helper + 一覧列差し替え | `lib/format/datetime.ts` / `MembersTable.tsx` |
| 用語集 SSOT | IDENTITY/DIAGNOSTICS 英語キー→日本語ラベル + 真偽値日本語化 | `memberSystemFieldGlossary.ts`（新規） |
| IDENTITY 日本語化 | 日本語ラベル主+英語キー併記・真偽値日本語化・見出し日本語化 | `MemberDrawer.tsx` |
| DIAGNOSTICS 日本語化 | 同上・`boolLabel`→`formatBooleanJa` | `MemberDiagnosticsPanel.tsx` |
| テスト | helper / SSOT / 一覧列 / IDENTITY / DIAGNOSTICS の focused spec | `__tests__/*.spec.ts(x)` |

## スコープ外（baseline・SSOT §9）

OOS-1（送信日時の秒化）/ OOS-2（監査ログ日時）/ OOS-3（DIAGNOSTICS 値の和訳）/ OOS-4（他 admin 一覧の日時）。
いずれも独立改善であり、今サイクル完了の阻害要因ではない（CONST_007 の先送りではなくスコープ境界）。

## Acceptance Criteria

SSOT §4 の AC-1..AC-11 を正本とする。

## 既存コードの命名規則（FB-01 / FB-SDK-07-4 対応）

| 対象 | 規則 | 根拠 |
| --- | --- | --- |
| helper 関数 | camelCase 動詞始まり（`formatJstDateTime`） | `lib/format/datetime.ts` 既存 |
| 用語集定数 | UPPER_SNAKE Record（`ZONE_LABEL`, `LABEL`） | `format-attendance.ts:15`, `MemberStateChip.tsx:12` |
| テストファイル | `*.spec.ts(x)` のみ（`*.test.*` 禁止・不変条件 #8） | CLAUDE.md |
| トークン | OKLch `var(--ubm-color-*)` のみ（HEX 禁止・AC-9） | `tokens.css` |

新規 helper 名は既存 `formatJstDateTime` と一貫させ `formatJstDateTimeWithSeconds` とする（命名ドリフト回避）。
新規用語集は既存 `ZONE_LABEL` パターンに倣い `MEMBER_IDENTITY_FIELD_LABELS` / `MEMBER_DIAGNOSTICS_FIELD_LABELS` とする。

## carry-over 確認

直近コミット（`git log --oneline -5`）: #1187（member 詳細 tag source 500）/#1181（sidebar collapse）/#1182（zone/status 検索）/#1180（home member card）/#1176（attendance dashboard）。
本タスクと重複する変更なし。`MemberDrawer.tsx` は #1187 で触れられているが対象は tag source 正規化であり IDENTITY セクションは別箇所。コンフリクトリスク低。

## 完了条件（Phase 1）

- AC-1..AC-11 を確定し SSOT に固定した。
- 根本原因を実コード行番号付きで確定した。
- 実装区分（実装仕様書）の判定根拠を記録した。
- 命名規則を分析・記録した。
