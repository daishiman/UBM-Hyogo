# admin 出席管理 — 出席CSV一括取り込みUI - タスク指示書

## メタ情報

```yaml
issue_number: 1110
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-meetings-attendance-followup-001-csv-import-ui |
| タスク名 | admin 出席管理画面に出席CSV一括取り込みUIを追加 (FU-MTGATT-001) |
| 分類 | 改善 |
| 補足分類 | UX 改善 / 運用効率化 (post-MVP) |
| 対象機能 | `/admin/meetings` 出席管理 — CSV 一括取り込み |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| GitHub Issue | 未起票(後続) |
| 発見元 | `admin-meetings-attendance-404-fix-and-ux` Phase 10 §10.6 MINOR 候補 + Phase 12 unassigned-task-detection baseline 候補 2 |
| 発見日 | 2026-06-03 |
| canonical source | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

出席登録 API は `POST /admin/meetings/:sessionId/attendance/import?dryRun=true|false`（body `{ rows: [{ memberId?, email? }] }`）として**実装済み**で、`dryRun` クエリによる件数プレビューにも対応している（use-case: `apps/api/src/use-cases/admin/import-attendance-bulk.ts` の `importAttendanceBulk`、route: `apps/api/src/routes/admin/attendance.ts` の `createAdminAttendanceRoute`、contract test: `apps/api/src/routes/admin/attendance-import.contract.spec.ts`）。

しかし `apps/web` 側にはこの import endpoint を呼び出す UI が存在しない。現行の出席管理画面（`apps/web/src/features/admin/components/_meetings/`）は `MeetingAttendanceDrawer.tsx` から1名ずつ出席を追加・削除する個別操作のみを提供している。

### 1.2 問題点・課題

- 大人数の会合（数十名規模）で出席を記録する場合、1名ずつの個別操作は運用負荷が高い。
- バックエンドには一括取り込み + dryRun プレビューという運用に適した機能が揃っているが、UI が無いため誰も使えない（実装済み機能の死蔵）。
- 会合運営者が手元で集計した出席名簿（スプレッドシート由来の CSV）を取り込む経路が存在しない。

### 1.3 放置した場合の影響

- 既存 API 投資（import use-case + contract test）が UI 未接続のまま死蔵される。
- 出席記録の運用が個別操作に固定され、参加者が多い会合の記録漏れ・記録工数増のリスクが残る。
- 後から急いで UI を足すと、dryRun→確定の二段フローやエラー行表示の設計を慌てて決めることになり、品質が下がる。

---

## 2. 何を達成するか（What）

### 2.1 目的

admin 出席管理画面から CSV を取り込み、既存 import endpoint の `dryRun` プレビューを使って結果を確認したうえで確定登録できる UI を追加する。**新規 endpoint・D1 schema 変更は行わず、既存 API のみに接続する**。

### 2.2 最終ゴール

- 会合（session）を選択した状態で CSV を貼り付け / アップロードし、`dryRun=true` でプレビュー（取り込み件数・エラー行）を確認できる。
- プレビュー内容に問題が無ければ「確定登録」操作で `dryRun=false`（commit）を実行し、出席が記録される。
- 解決できなかった行（未解決 email / 既退会 member / 重複など）がエラー行として一覧表示される。

### 2.3 受け入れ基準（AC）

- [ ] AC-1: 出席管理画面（`apps/web/src/features/admin/components/_meetings/`）から、対象 session を選択した状態で CSV 入力（テキスト貼り付け or ファイル選択）ができる。
- [ ] AC-2: CSV は `memberId` 列または `email` 列を持つ行にパースされ、`{ rows: [{ memberId?, email? }] }` 形状で送信される（API の `AttendanceImportRow` shape に一致）。
- [ ] AC-3: まず `dryRun=true` を呼び、`summary`（`total / ok / duplicate / deletedMember / unknownMember / invalid`）と各行 status をプレビュー表示する。**プレビュー段階では DB を変更しない**。
- [ ] AC-4: プレビュー後に運用者が明示操作したときのみ `dryRun=false`（commit）を呼び、`committed: true` を確認して完了表示する（dryRun→確定の2段フロー）。
- [ ] AC-5: status が `ok` 以外の行（`duplicate` / `deleted_member` / `unknown_member` / `invalid` とその `message`）をエラー行として一覧表示し、運用者が修正対象を判別できる。
- [ ] AC-6: API は既存 `POST /admin/meetings/:sessionId/attendance/import` のみを使う。新 endpoint・D1 schema 変更・Google Form 仕様変更を行わない。`apps/web` から D1 を直接参照しない（invariant #5）。呼び出しは proxy `apps/web/app/api/admin/[...path]/route.ts` 経由。
- [ ] AC-7: フォーム入力は `FormField`（`apps/web/src/components/ui/FormField.tsx`）経由を標準とし、`apps/web/src/components/admin/` 配下で生の `<input>` を増やさない（invariant #9）。
- [ ] AC-8: import の送信（dryRun / commit いずれも）は `@/features/admin/hooks/useAdminMutation` 経由で行う（invariant #10）。legacy `@/lib/useAdminMutation` を新規参照しない。
- [ ] AC-9: 色は OKLch トークン正本（`apps/web/src/styles/tokens.css`）に従い、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を新規追加しない。
- [ ] AC-10: dryRun プレビュー、エラー行表示、確定登録の focused unit test が PASS する。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface（変更ファイル候補）

| パス | 役割 |
| --- | --- |
| `apps/web/src/features/admin/components/_meetings/AttendanceCsvImport.tsx` | 新規。CSV 入力 + dryRun プレビュー + 確定登録 UI |
| `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 既存 drawer から CSV import UI への導線を追加 |
| `apps/web/src/features/admin/components/_meetings/index.ts` | 新規 component の re-export |
| `apps/web/src/features/admin/components/_meetings/__tests__/AttendanceCsvImport.spec.tsx` | 新規。dryRun プレビュー / エラー行 / 確定の test |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 既存 mutation hook を import で利用（原則変更なし） |
| `apps/web/src/components/ui/FormField.tsx` | 既存 FormField を流用（変更なし） |

### 3.2 実装方針

- CSV パースは軽量に self-contained で行う（外部依存追加は最小化）。先頭行をヘッダーとして `memberId` / `email` 列を特定し、`{ memberId?, email? }[]` に正規化する。空行・空セルは `undefined` 扱いにする。
- 送信は2段。`useAdminMutation` で `POST /admin/meetings/:sessionId/attendance/import?dryRun=true` を呼び、戻り値の `summary` と `rows` を state に保持してプレビュー表示する。運用者が「確定登録」を押したときのみ同 endpoint を `dryRun=false` で再送する。プレビューと確定は別 mutation 呼び出しとして扱い、確定は冪等性に依存せずユーザー明示操作を起点にする。
- エラー行表示は `rows[].status !== "ok"` を抽出し、`index` / `status` / `message` を表で列挙する。`ok` 件数とエラー件数のサマリを上部に出す。
- 入力欄・ボタンは既存 `FormField` と admin primitives を使い、色は token のみ。drawer 内に折りたたみ or タブで CSV import セクションを配置し、既存の1名ずつ追加 UI と共存させる。
- session 選択は既存 `MeetingsClientShell.tsx` / `MeetingAttendanceDrawer.tsx` が保持する `sessionId` を再利用し、import UI 側で session を新たに解決しない。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/features/admin/components/_meetings/AttendanceCsvImport.tsx`（新規）
- 症状（CSV パース）: CSV の文字コード（Excel 由来の Shift_JIS / UTF-8 BOM 付き）、改行コード（CRLF / LF / 末尾改行）、引用符付きセルでパースが崩れやすい。ファイル選択経由では `File.text()` が UTF-8 前提で読むため、BOM 除去と改行正規化（`\r\n` / `\r` → `\n`）、末尾空行スキップを実装しないと、空の `{ }` 行が API に送られ `invalid`（`memberId_or_email_required`）行が増える。
- 症状（memberId vs email 解決の曖昧さ）: API 側 `apps/api/src/use-cases/admin/import-attendance-bulk.ts` の `classifyImportRow` は memberId と email の**両方**が与えられて不一致だと `invalid`（`memberId_email_mismatch`）になる。CSV が両列を持つ場合に UI が両方を送るか片方に絞るかで結果が変わるため、列マッピングの仕様（優先列 / 両送り）を UI 側で明示し、test で固定する必要がある。
- 症状（dryRun→確定の二段トランザクション整合）: dryRun プレビューと確定 commit は別リクエストのため、その間に session の出席状態や member の退会状態が変わると、プレビュー件数と実際の commit 結果（`summary` / `committed`）が乖離する。`canCommit` は「全行 ok かつ 1 行以上」で初めて `committed: true` になる（`importAttendanceBulk` の `canCommit` 条件）ため、UI は確定実行後も戻り値の `summary` / `committed` を再表示し、プレビュー値を最終結果として信用しない。
- 症状（大量行時の UI 応答性）: 数百行規模の CSV をプレビューする際、パース・差分レンダリング・エラー行テーブル描画でメインスレッドが詰まりうる。`AttendanceCsvImport.tsx` でのテーブルは行数上限の表示制限（例: エラー行のみ全件・ok 行は件数サマリ）や仮想化を検討し、`MeetingAttendanceDrawer.tsx` 全体の操作応答性を落とさないようにする。
- 参照: `apps/api/src/use-cases/admin/import-attendance-bulk.ts`（`classifyImportRow` / `canCommit` / `ImportSummary`）、`apps/api/src/routes/admin/attendance-import.contract.spec.ts`（endpoint contract）、`apps/web/app/api/admin/[...path]/route.ts`（proxy）。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| CSV の BOM / 改行 / 文字コードでパースが崩れ、空行や文字化けが API に渡る | 中 | `File.text()` 結果から BOM 除去・改行正規化・末尾空行スキップを実装し、`AttendanceCsvImport.spec.tsx` に BOM 付き / CRLF / 末尾改行の fixture を追加して固定する |
| dryRun プレビュー後、確定までに状態が変わりプレビュー件数と commit 結果が乖離する | 中 | 確定 commit の戻り値 `summary` / `committed` を再表示し、プレビュー値ではなく確定レスポンスを最終結果として表示する。`canCommit` 不成立時は未確定として扱う |
| 既存 API を変更したくなる誘惑（列追加・新 endpoint） | 高 | AC-6 を gate とし、UI 側 adapter（CSV→`{rows:[{memberId?,email?}]}` 変換）で吸収する。API / D1 / Form 仕様は触らない |
| 生 `<input>` 直書き / HEX 直書きで invariant #9・design token gate に抵触 | 低 | 入力は `FormField` 経由、色は `tokens.css` の OKLch token のみ。HEX grep を静的検証に含める |
| 大量行で UI がフリーズする | 中 | ok 行は件数サマリ表示・エラー行のみ全件列挙とし、必要に応じて表示上限を設ける |

---

## 検証方法

### 単体検証

`apps/web` には `vitest.config.ts` が無いため、リポジトリルートの config を明示してルートから実行する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/AttendanceCsvImport.spec.tsx
```

期待: CSV パース（BOM / CRLF / 末尾改行）、dryRun プレビューの `summary` 表示、エラー行（`status !== "ok"`）の列挙、確定 commit 後の `committed` 表示の assertion が PASS。

API 側 contract が不変であることの確認（既存 spec を再実行・変更しないこと）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/routes/admin/attendance-import.contract.spec.ts
```

期待: 既存 contract（dryRun=true は audit_log を増やさない / dryRun=false で `attendance.import.add` が記録される / 空 rows / 認証）が全 PASS のまま。

### 統合検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 型エラー・lint エラーともに 0。

proxy 経由疎通（staging admin auth が必要なため実行はユーザー明示操作時のみ）: 出席管理画面で session を開き、`memberId` 1 行・`email` 1 行・未解決 email 1 行を含む CSV を貼り付け、dryRun プレビューに `ok` / `unknown_member` が正しく出ること、確定で出席が記録されることを確認する。

### 静的検証

HEX 直書き / 生 input / legacy mutation hook の混入が無いことを確認する:

```bash
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/features/admin/components/_meetings/AttendanceCsvImport.tsx
rg -n "<input" apps/web/src/features/admin/components/_meetings/AttendanceCsvImport.tsx
rg -n "@/lib/useAdminMutation" apps/web/src/features/admin/components/_meetings/
```

期待: いずれも 0 件（HEX 無し / 生 input 無し・`FormField` 経由 / legacy hook 参照無し）。

---

## スコープ

### 含む

- 出席管理画面（`apps/web/src/features/admin/components/_meetings/`）への CSV 一括取り込み UI 追加。
- CSV → `{ rows: [{ memberId?, email? }] }` 変換 adapter。
- `dryRun=true` プレビュー（summary + エラー行表示）→ `dryRun=false` 確定の2段フロー。
- focused unit test（`AttendanceCsvImport.spec.tsx`）。

### 含まない

- 新 endpoint 追加 / API ロジック変更 / D1 schema 変更 / Google Form 仕様変更（既存 `importAttendanceBulk` をそのまま利用）。invariant #1。
- 出席 CSV **エクスポート**（`GET /admin/meetings/:id/export.csv` は既に実装済みで本タスクの import とは別関心）。
- `apps/web` からの D1 直接アクセス（invariant #5 維持・proxy 経由のみ）。
- 既存1名ずつ追加・削除 UI（`MeetingAttendanceDrawer.tsx` の個別操作）の置き換え（CSV import は共存追加）。
- Playwright screenshot / visual regression baseline の新規追加（必要なら別 followup）。
- production / staging deploy、commit、push、PR、Issue 起票・close。

---

## 関連リソース

- 発見元 workflow: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`
- 未タスク検出: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-12/unassigned-task-detection.md`
- import use-case（正本ロジック）: `apps/api/src/use-cases/admin/import-attendance-bulk.ts`（`importAttendanceBulk` / `classifyImportRow` / `ImportSummary` / `canCommit`）
- import route: `apps/api/src/routes/admin/attendance.ts`（`createAdminAttendanceRoute`）
- contract test（不変条件）: `apps/api/src/routes/admin/attendance-import.contract.spec.ts`
- 現行出席 UI: `apps/web/src/features/admin/components/_meetings/`（`MeetingsClientShell.tsx` / `MeetingTimeline.tsx` / `MeetingAttendanceDrawer.tsx`）
- proxy: `apps/web/app/api/admin/[...path]/route.ts`
- 標準フォーム input: `apps/web/src/components/ui/FormField.tsx`（invariant #9）
- 標準 mutation hook: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（invariant #10）
- design token 正本: `apps/web/src/styles/tokens.css`
