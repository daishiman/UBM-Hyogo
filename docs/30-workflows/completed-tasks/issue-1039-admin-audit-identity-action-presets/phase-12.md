# Phase 12: ドキュメント更新

> **[実装区分: 実装仕様書]**

> **本 Phase の strict 7 成果物は実装サイクル（Phase 4-11）完了後に `outputs/phase-12/` へ作成する。**
> 本 workflow は `implemented_local_evidence_captured` 段階まで進めるため、strict 7 成果物を物理ファイルとして作成し、focused test evidence と正本同期結果を記録する。

---

## Phase 12 必須 6 成果物（strict 7）と作成方針

task-specification-creator skill の Phase 12 規約に従い、実装サイクル完了後に `outputs/phase-12/` 配下へ以下を作成する（必須 6 成果物 + main.md = strict 7）。

```
outputs/phase-12/
  main.md                                # 変更サマリ（必須）
  implementation-guide.md                # Part1 + Part2 実装ガイド（必須）
  system-spec-update-summary.md          # Step 1-A〜1-C + Step 2 判定（必須）
  documentation-changelog.md             # ドキュメント変更履歴（必須）
  unassigned-task-detection.md           # 未タスク検出結果（必須・0 件でも出力）
  skill-feedback-report.md               # skill フィードバック（必須）
  phase12-task-spec-compliance-check.md  # Phase 12 コンプライアンスチェック（必須）
```

> いずれも `outputs/phase-12/` に物理ファイルとして作成済みであることを Phase 12 close-out の前提にする。

---

## 12.1 `main.md` — 変更サマリ骨子

```md
## 変更サマリ（issue-1039-admin-audit-identity-action-presets）

### web / UI layer（単一レイヤ・apps/web のみ）
- `apps/web/src/components/admin/AuditLogPanel.tsx`:
  - action `<Input>` に `list="audit-action-presets"` 属性を追加
  - filter form 内に `<datalist id="audit-action-presets">` を追加し、option `identity.merge` / `identity.dismiss` の 2 件を提示
- `buildAuditHref` 無変更（URL query `action` 契約維持）
- server component / `name="action"` / 自由入力の不変を維持

### test layer
- `AuditLogPanel.component.spec.tsx`: datalist option 存在 / 自由入力非退化を assert
- `page.page.spec.ts`: `?action=identity.dismiss` の SSR 復元を assert

### 変更しないもの（不変条件）
- `apps/api` の endpoint surface（identity action 正本は維持・参照のみ）
- D1 schema / migration
- Google Form 仕様
- `apps/web` から D1/R2 への直接アクセス（発生しない）
```

---

## 12.2 `implementation-guide.md` — 実装ガイド詳細指示

### Part 1（中学生レベルの概念説明）の必須要素

以下の比喩・説明を含めること。

**なぜ必要か**:
> 管理画面の「操作の記録（監査ログ）」を調べるとき、「合併（identity.merge）」「却下（identity.dismiss）」といった操作名で絞り込みたいことがある。
> でも今は検索欄に手で一字一句正確に打ち込まないと絞り込めず、打ち間違えると探せない。

**何をするか（日常の例え）**:
> 検索欄に「入力補助（オートコンプリート候補）」を付けるイメージ。
> 検索欄をクリックすると、よく使う候補（`identity.merge` / `identity.dismiss`）が一覧で出てきて、
> いちいち手で打つ代わりにクリックで選べるようになる。
> もちろん、候補に無い操作名（例: `member.delete`）はこれまで通り自由に手で打てる。

**今回作ったもの（中学生向けテーブル）**:

| 日本語 | 英語 / 仕組み | 役割 |
|--------|-------------|------|
| 入力補助の候補リスト | `<datalist id="audit-action-presets">` | ブラウザ標準の候補提示機能。2 つの候補を持つ |
| 候補1：合併操作 | option `identity.merge` | identity 合併の監査ログを絞り込む候補 |
| 候補2：却下操作 | option `identity.dismiss` | identity 却下の監査ログを絞り込む候補 |
| 検索欄と候補をつなぐ印 | `<Input list="audit-action-presets">` | 検索欄に「この候補リストを使う」と指定する HTML の標準属性 |

### Part 2（技術者向け詳細）の必須要素

**DOM 構造**:

```tsx
// apps/web/src/components/admin/AuditLogPanel.tsx（filter form 内）
<FormField name="action" label="action">
  <Input
    name="action"
    defaultValue={values.action ?? ""}
    placeholder="attendance.add"
    list="audit-action-presets"   // ← 追加。native HTML 属性（Input は ...props で透過）
  />
</FormField>
<datalist id="audit-action-presets">   {/* ← 追加 */}
  <option value="identity.merge" />
  <option value="identity.dismiss" />
</datalist>
```

**Input list 属性の透過**:

> `apps/web/src/components/ui/Input.tsx` の `InputProps` は `Omit<InputHTMLAttributes<HTMLInputElement>, "size">` を継承し `...props` を `<input>` へ透過するため、`list` 属性は **新規 API を追加せず native 属性として透過される**。Input primitive 自体の変更は不要。

**URL query 契約の不変**:

```ts
// buildAuditHref は無変更（AC-2 / AC-4）
// set("action", values.action) が action query key を保持
// datalist はあくまで入力 UI の提示であり、submit 後の name="action" → query 写像は既存のまま
```

**型**:

> 新規 interface / 型定義は **追加しない**。native HTML `<datalist>` / `<option>` / `list` 属性のみを使い、React の組み込み型（`HTMLDataListElement` 等）で完結する。`AuditSearchValues.action?: string` は既存型を維持。

**識別子・定数**:

| 対象 | 値 | 定義場所 |
|------|-----|---------|
| datalist `id` | `audit-action-presets`（kebab-case） | `AuditLogPanel.tsx` inline |
| `<Input list>` | `audit-action-presets`（id と一致） | 同上 |
| option value（合併） | `identity.merge` | 正本 `apps/api/src/repository/identity-merge.ts:147` |
| option value（却下） | `identity.dismiss` | 正本 `apps/api/src/repository/identity-conflict.ts:250` |

> 2 値は inline literal で定義する（Phase 10 で共有定数化を YAGNI 却下）。API 正本との同期は本ガイドの参照記録で担保する。

**禁止事項（不変条件）**:

- `apps/api` の endpoint surface を変更しない（identity action は参照のみ）
- D1 schema / Google Form 仕様を変更しない
- `buildAuditHref` を変更しない
- HEX 直書き / `bg-[#xxx]` を追加しない（OKLch トークン正本・`verify-design-tokens` gate）
- `apps/web/src/components/admin/` 配下に直接 `<input>` を増やさない（不変条件 #9。本タスクは既存 `Input`／native `<datalist><option>` のみ）

**テスト構成**:

| Layer | File |
|-------|------|
| component | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` |
| page | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` |

### Phase 11 screenshot references（VISUAL）

implementation-guide.md に以下の Phase 11 canonical screenshot 参照を明記する（取得済みの場合）。

```
outputs/phase-11/screenshots/audit-action-filter-datalist-open.png
outputs/phase-11/screenshots/audit-action-filter-restored.png
```

> screenshot が user-gated 未取得の場合は「component / page test PASS を一次証跡とする」旨を記載し、空の screenshot セクションは残さない。

---

## 12.3 `system-spec-update-summary.md` — Step 判定方針

### Step 1-A: タスク完了記録
- workflow root（index.md）、artifact inventory、quick-reference、resource-map、active workflow ledger、changelog/logs を同波で更新する。

### Step 1-B: 実装ステータステーブル
- `implemented_local_evidence_captured`（component / page test PASS。screenshot は user-gated）を局所完了の目標とする。
- staging deploy / 実画面 screenshot は `staging_runtime_pending_user_approval` として分離する。

### Step 1-C: 関連タスク差分確認欄（必須記入）

| 関連項目 | 最終確認日 | ステータス |
|---------|-----------|---------|
| 親 workflow `issue-987-identity-conflicts-audit-log-admin-ui` | 要確認 | completed-tasks に移動済み。本タスクは #987 の follow-up。implementation-guide の参照関係を記録 |
| Issue #1039 | 再確認済み | **CLOSED**（`gh issue view 1039` 実状態）。Issue mutation（close/reopen/comment）は**行わない**。PR 文脈は `Refs #1039` のみ |
| `AuditLogPanel.tsx` 既存 filter form（`buildAuditHref` 含む） | 要確認 | 自由入力 / URL query 契約を非破壊で温存 |

> **Issue 状態の正確な記録**: GitHub 実状態は **CLOSED**。ユーザー依頼の文言は「クローズドのまま」だが、実態は CLOSED であり、本 workflow では Issue を close しない・comment しない。spec 文書に「issue を close する」と書かないこと。

### Step 2: 新規インターフェース / API spec 更新

**判定: N/A（更新不要）**

| 観点 | 判定 | 理由 |
|------|------|------|
| 新規 interface / 型追加 | **なし** | native `<datalist>` / `list` 属性のみ。新規 zod / viewmodel / interface を追加しない |
| API spec（`docs/.../specs/`）更新 | **不要** | endpoint surface / schema 不変。UI 提示要素の追加のみで仕様文書の更新を要しない |
| shared package 変更 | **なし** | `packages/shared` への変更なし |

> Step 2 は N/A。本タスクは純粋な UI 提示改善であり、契約・型・spec 文書に一切影響しない。

---

## 12.4 `unassigned-task-detection.md` — 未タスク検出

> **0 件でも出力必須。** 本 workflow の検出結果は以下。

### 検出結果: 未タスク化対象 0 件

| 候補 | 判定 | 理由 |
|------|------|------|
| datalist 2 値の共有定数化（`IDENTITY_AUDIT_ACTIONS`） | **未タスク化しない（YAGNI 却下）** | Phase 10 で確定。提示候補 2 件のみで inline literal で十分。早期抽象化は参照経路を増やすため不採用 |
| 他の action（例 `attendance.add` / `schema.alias.*`）も datalist に追加 | **未タスク化しない（スコープ外・要望なし）** | issue #1039 のスコープは identity action（merge / dismiss）の提示に限定。網羅的な action 一覧の提示は別 UX 判断であり、現時点で要望が無いため候補化しない |
| datalist 候補の API 正本からの動的生成 | **未タスク化しない（過剰実装）** | server から action 一覧を fetch する設計は endpoint 追加（不変条件抵触）または静的列挙で十分な対象に過剰。却下 |

### 検証手順（実装サイクル後 2 回実施）

```bash
# 1回目: TODO/FIXME/skip 検索
grep -n "TODO\|FIXME\|skip\|xit\|xtest\|xdescribe" \
  apps/web/src/components/admin/AuditLogPanel.tsx \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/app/(admin)/admin/audit/page.page.spec.ts

# 2回目: 関連 Issue 状態確認（#1039 自体は CLOSED 維持・本タスクで mutation しない）
gh issue view 1039 --json number,state,title,labels
```

> 検出 0 件でも本ファイルは必ず出力する。

---

## 12.5 `skill-feedback-report.md` — フィードバック指示

実装サイクル完了後に以下を記録する。

- native HTML `<datalist>` + `<Input list>` で「自由入力を保ったまま提示補助を足す」パターンを `lessons-learned-issue-1039-...md` に L-I1039-001〜 として追記。
- Input primitive を変更せず `...props` 透過で native 属性（`list`）を渡す手法を lesson 化（component primitive を増やさず HTML 標準で完結する判断）。
- `task-specification-creator/references/patterns-lessons.md` 末尾に「native datalist による入力補助（契約不変・型追加なし）パターン」節として汎化する。

---

## 12.6 `phase12-task-spec-compliance-check.md` — コンプライアンスチェック指示

実装サイクル完了後に canonical 9 heading を逐語で記述する（heading を変形しない）。

```
1. Summary verdict
2. Changed-files classification
3. workflow_state and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict
```

§4（Phase 11 evidence inventory）は `| Classification | Path | Status |` の英語固定列で記述し、status は `present` / `pending` / `n/a` のいずれか。screenshot が user-gated 未取得なら `pending`、test ログは `present`。

**事前判定（spec 段階の期待値）**:

| 観点 | 期待 |
|------|------|
| workflow_state | `implemented_local_evidence_captured`（component / page test PASS。staging screenshot は `pending_user_approval`） |
| Phase 11 evidence | component / page test ログ `present`。screenshot 2 枚は user-gated なら `pending` |
| Phase 12 strict 7 | 7 ファイル全 `present` |
| aiworkflow same-wave sync | resource-map / quick-reference / task-workflow-active / inventory / changelog / logs / lessons 同波更新済み |
| system spec update | **N/A**（spec 文書変更なし） |
| shared interface | **N/A**（型追加なし） |
| runtime user-gated | staging deploy / 実画面 screenshot は `pending_user_approval` として分離 |
| Issue 状態 | #1039 **CLOSED 維持**（mutation なし。`Refs #1039` のみ） |

---

## 完了条件（Phase 12）

- [ ] `outputs/phase-12/` に strict 7 ファイルが全件存在する
- [ ] `implementation-guide.md` に Part 1（中学生例え話）と Part 2（datalist DOM / Input list 透過 / URL query 契約不変 / 型追加なし）が含まれる
- [ ] `implementation-guide.md` に Phase 11 screenshot references（または test 一次証跡の旨）が記載されている
- [ ] `system-spec-update-summary.md` の Step 2 が **N/A（型追加なし / spec 文書変更なし）** と記録されている
- [ ] Step 1-C に Issue #1039 が **CLOSED 維持・mutation なし**と記録されている
- [ ] `unassigned-task-detection.md` に未タスク化対象 0 件と 2 回検証結果が記録されている
- [ ] 親 #987 implementation-guide との参照関係（follow-up）が記録されている
- [ ] aiworkflow-requirements の同波 sync が完了している
- [ ] Phase 12 コンプライアンスチェックが canonical 9 heading で記述されている

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装仕様書としての strict 7、Step 判定、skill feedback、compliance を物理成果物にする。

## 実行タスク
- `outputs/phase-12/` の strict 7 を作成する。
- aiworkflow-requirements との同期状態を記録する。

## 参照資料
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/implementation-guide.md`（親 #987）

## 成果物
- Phase 12 strict 7 files
