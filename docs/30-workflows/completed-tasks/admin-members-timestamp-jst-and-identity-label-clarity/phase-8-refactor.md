# Phase 8: リファクタリング

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [shared-context.md](shared-context.md) / [phase-1-requirements.md](phase-1-requirements.md) / [phase-2-design.md](phase-2-design.md) / [phase-3-design-review.md](phase-3-design-review.md)
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused Vitest・local Playwright screenshot 取得済み。commit・PR・staging visual は user-gated）
- 本 Phase の責務: 実装時に併せて行うべき重複解消・ロジック分離・表記ドリフト除去を `対象/Before/After/理由`（FB RT-03）で記録する。新機能追加は行わない
- レーン: Lane B（Phase 8/9/10/11）。SSOT を唯一の情報源とする

## リファクタリング方針

本タスクは「機械可読の生データ（ISO 8601・英語キー・true/false）を表現層で人間向けに変換する」改善であり、変更は `apps/web` 表現層の 5 ファイルに閉じる（SSOT §5）。改善そのものが「ロジックの純関数 SSOT への集約」「重複した真偽値ラベルの統一」「英語キー→日本語ラベルの一元化」を含むため、本 Phase では **実装に内在するリファクタ要素**を採否付きで明示する。最小差分原則（既存 `id` / `aria-labelledby` / `data-testid` / DOM 構造を維持）を採用する。

## リファクタ要素一覧（対象 / Before / After / 理由）

### RT-1: 真偽値ラベルの重複排除（`boolLabel` → `formatBooleanJa` 統一）

| 観点 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx`（11 行 `const boolLabel` の局所定義） |
| Before | DIAGNOSTICS 専用に `boolLabel(value) => value ? "yes" : "no"` がコンポーネント内ローカルで定義され、真偽値表記が局所的・英語（yes/no） |
| After | 局所 `boolLabel` を**削除**し、新規 SSOT `memberSystemFieldGlossary.ts` の `formatBooleanJa(value) => value ? "はい" : "いいえ"` を import して全呼び出しを置換 |
| 理由 | 真偽値表記の SSOT 化（DRY）。IDENTITY（`MemberDrawer.tsx`）の `String(boolean)`（"true"/"false"）と DIAGNOSTICS の `boolLabel`（yes/no）という **2 系統の表記揺れ**を 1 箇所（`formatBooleanJa`）へ統一し、AC-4 / AC-6 / AC-7 を構造的に満たす |
| 削除確認基準（FB-UI-02-1） | 「git 上で `boolLabel` 定義行が削除される」**かつ** 「`grep -rn 'boolLabel' apps/web` の live import / 呼び出しが 0 件」。両者を Phase 9 QA の証跡とする |

### RT-2: 日時整形ロジックのコンポーネントからの分離（純関数集約）

| 観点 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/features/admin/components/_members/MembersTable.tsx`（161-163 行）/ `apps/web/src/lib/format/datetime.ts` |
| Before | 一覧の最終更新セルが `{m.lastSubmittedAt}` を**フォーマッタ未適用**で直描画（描画層が生データをそのまま出力＝整形責務がどこにも無い） |
| After | 整形を `datetime.ts` の新規純関数 `formatJstDateTimeWithSeconds(iso)` に集約し、コンポーネントは `{formatJstDateTimeWithSeconds(m.lastSubmittedAt)}` を呼ぶだけにする（ロジックと描画の分離） |
| 理由 | フォーマット規則をコンポーネントが所有しない（Phase 2 §責務所有権）。純関数化によりテスト容易性（`datetime.spec.ts`）と再利用性が上がり、UTC→JST 変換・fail-soft を 1 箇所で保証 |
| 補足 | 既存 `formatJstDateTime` / `JST_FORMATTER` は**変更しない**（送信日時・監査ログ・Recent Actions が利用中）。新 helper の**追加**であり既存純関数のリファクタ（破壊的変更）ではない |

### RT-3: 英語キー→日本語ラベルの表記ドリフト除去（SSOT 一元化）

| 観点 | 内容 |
| --- | --- |
| 対象 | `MemberDrawer.tsx`（IDENTITY 229-254 行）/ `MemberDiagnosticsPanel.tsx`（DIAGNOSTICS 50-80 行）/ 新規 `memberSystemFieldGlossary.ts` |
| Before | 英語キー名（`memberId` / `notificationOptOut` / `public visible` / `H3 hidden` 等）と見出し（`identity (system field)` / `diagnostics`）が**各コンポーネントにハードコード**。統一 SSOT 不在のため将来項目追加時に表記が分散・ドリフトしやすい |
| After | `MEMBER_IDENTITY_FIELD_LABELS` / `MEMBER_DIAGNOSTICS_FIELD_LABELS` / `MEMBER_SYSTEM_SECTION_LABELS` を新規 SSOT に集約し、各コンポーネントは SSOT 参照のみ（日本語ラベル主・英語キーは描画側で `<span>` 併記） |
| 理由 | 表記ドリフトの構造的防止（SSOT §1 強化ループ）。今後 IDENTITY/DIAGNOSTICS に項目が増えても 1 箇所追加で全画面に反映。AC-3 / AC-5 / AC-7 / AC-8 を満たす |

## navigation drift / duplicate 観点の確認

| 確認項目 | 結果 |
| --- | --- |
| 新規 SSOT が既存 `ZONE_LABEL` / PublishState `LABEL` パターンと整合するか | ✅ 整合。既存 `format-attendance.ts:15`（`ZONE_LABEL`）/ `MemberStateChip.tsx:12`（`LABEL`）は **UPPER_SNAKE の `Record<string,string>` 表示用定数**パターン。新規 `MEMBER_IDENTITY_FIELD_LABELS` 等は同パターン（`as const satisfies Record<string,string>`）に倣う。命名ドリフトを生まない（Phase 1 §命名規則） |
| helper 命名が既存 `formatJstDateTime` と一貫するか | ✅ 整合。新 helper は `formatJstDateTimeWithSeconds`（camelCase 動詞始まり）。既存 `format` プレフィックスを継承 |
| 真偽値表記の重複系統が解消されるか | ✅ 解消。`String(boolean)`（IDENTITY）と `boolLabel`（DIAGNOSTICS）の 2 系統 → `formatBooleanJa` 1 系統に集約（RT-1） |
| nav / 画面導線に変更があるか | ✅ なし。本タスクは既存画面のテキスト・フォーマッタ差し替えのみ。ルーティング・ナビ・遷移は不変（scope_routes `/(admin)/admin/members` 内に閉じる） |
| 新規 primitive を生やしていないか | ✅ なし。新規は純関数 helper（datetime）・純データ SSOT（glossary）のみ。UI primitive（`<dl>`/`<dt>`/`<dd>`/`KVList`）は既存を再利用 |

## あえてリファクタしない判断（採否記録・CONST_007 スコープ境界）

| 項目 | 判断 | 理由 |
| --- | --- | --- |
| `formatJstDateTime` を `formatJstDateTimeWithSeconds` に統合 | **否（現状維持）** | 既存は分まで（秒なし・年2桁）で送信日時・監査ログが利用中。統合すると他所の表記が変わり破壊的。新 helper 追加で並存させる |
| 送信日時（`MemberDrawer.tsx:201-205`）の秒化 | **否（スコープ外・OOS-1）** | ユーザー要求は「最終更新列」。既に `formatJstDateTime` で可読。将来の一貫性統一は baseline 候補（SSOT §9） |
| `memberSystemFieldGlossary.ts` を `packages/shared` へ昇格 | **否（apps/web に置く）** | 用語は admin web 表現層固有。API/D1 と無関係（AC-10）。shared 昇格は責務越境 |
| `<dl>`/`<dt>`/`<dd>` を共通 `KVList` primitive に再構成 | **否（現状維持）** | テスト互換（`id` / `aria-labelledby` / `data-testid`）を最優先。構造変更は回帰リスクが価値を上回る |

## リファクタ後の回帰確認手順（実施済み / 追加実行対象）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# boolLabel 削除確認（live 0 件であること = RT-1）
grep -rn 'boolLabel' apps/web && echo "[FAIL: boolLabel 残存]" || echo "[PASS: boolLabel 0 件]"
# focused vitest（SSOT §8）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| SSOT | `docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/shared-context.md` | 変更ファイル・Before/After・AC の正本 |
| 設計 | `docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity/phase-2-design.md` | 責務所有権・再利用可否 |
| 既存パターン（用語集） | `apps/web/src/features/admin/attendance/format-attendance.ts:15`（`ZONE_LABEL`） | UPPER_SNAKE Record 表示用定数の踏襲根拠 |
| 既存パターン（ラベル定数） | `apps/web/src/features/admin/components/.../MemberStateChip.tsx:12`（`LABEL`） | 同上 |
| 既存 helper | `apps/web/src/lib/format/datetime.ts`（`formatJstDateTime`） | 命名一貫・非変更の根拠 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止（AC-9） |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | リファクタ内容 |
| --- | --- | --- |
| `MemberDiagnosticsPanel.tsx` | 編集 | 局所 `boolLabel` 削除・`formatBooleanJa` 統一（RT-1） |
| `datetime.ts` | 編集（追加） | 整形ロジックを純関数 `formatJstDateTimeWithSeconds` に集約（RT-2） |
| `MembersTable.tsx` | 編集 | 描画から整形ロジックを排除し helper 呼び出しに（RT-2） |
| `memberSystemFieldGlossary.ts` | 新規 | 英語キー→日本語ラベル・見出しの SSOT 一元化（RT-3） |
| `MemberDrawer.tsx` | 編集 | IDENTITY ハードコードを SSOT 参照へ・`String(boolean)` を `formatBooleanJa` へ（RT-1/RT-3） |

> F1-F5 / T1-T5 は本サイクルで実装済み。commit / PR と staging visual のみ user-gated。

## 統合テスト連携

- RT-1 の削除確認（`boolLabel` 0 件）は Phase 9 QA のチェック項目に含め、「git delete OR live import 0 件」を PASS 基準とする（FB-UI-02-1）。
- RT-2/RT-3 の純関数・SSOT は Phase 6 で追加する focused spec（`datetime.spec.ts` / `memberSystemFieldGlossary.spec.ts`）で挙動を保証する。
- 既存 `id` / `aria-labelledby` / `data-testid` 不変により、既存 DOM アサート系テストへの回帰影響を最小化する（AC-11）。

## 完了条件（Phase 8）

1. RT-1（`boolLabel` → `formatBooleanJa` 統一）/ RT-2（日時整形の純関数集約）/ RT-3（英語→日本語 SSOT 一元化）を `対象/Before/After/理由` で記録した。
2. 新規 SSOT が既存 `ZONE_LABEL` / `LABEL` パターンと整合し navigation drift / 新規 primitive を生まないことを確認した。
3. あえてリファクタしない項目の採否を理由付きで記録した。
4. `boolLabel` 削除確認基準（git delete OR live import 0 件）を Phase 9 へ引き継いだ。
