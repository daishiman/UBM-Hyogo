# Workflow: issue-1039-admin-audit-identity-action-presets

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> 本 workflow は **ローカル実装と focused evidence 取得まで**を行う（`implemented_local_evidence_captured`）。commit・PR・push・staging runtime screenshot はユーザー明示承認後の Phase 13 で user-gated。

GitHub Issue #1039（`Issue #987 follow-up: /admin/audit identity action presets`）を
**最新コードに最適化した上で**根本解決するためのタスク仕様書一式（Phase 1-13）。

- ブランチ: `feat/issue-1039-admin-audit-identity-action-presets`
- ベースブランチ: `dev`
- 親 issue（発見元）: #987（`docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/`）
- Issue 状態: **CLOSED**（2026-06-01 に `gh issue view 1039 --json state` で実状態を確認）。本 workflow では Issue mutation（close / reopen / comment）を一切行わず、現状態（CLOSED）を温存し、PR 文脈は `Refs #1039` のみとする。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation（UI improvement / VISUAL） |
| implementation_mode | `new`（P50: current branch 未実装・別タスク未解決・upstream 未マージ） |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | VISUAL_ON_EXECUTION（datalist 提示 UI を Phase 11 で撮影） |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同一内容で同期 |
| 優先度 | 低（priority:low）※ issue 踏襲 |
| 規模 | 小（scale:small）※ issue 踏襲 |
| GitHub Issue | #1039（CLOSED, mutation せず・PR 文脈は `Refs #1039` のみ） |

---

## 0. 事前調査結論（実装前ベースライン）

ユーザー依頼「別タスクで既に解決していないか、コードベースで実装完了しているか調査。issue が古ければ最新コードに最適化して根本解決」に対する結論。

| 観点 | 調査コマンド/対象 | 結果 |
|------|------------------|------|
| action プリセット UI（datalist/combobox/preset） | `grep -rni "datalist\|preset\|actionOptions" apps/web/src/components/admin` | **0 件（未実装）** |
| `identity.merge` / `identity.dismiss` の UI 提示 | `grep -rn "identity.merge\|identity.dismiss" apps/web/src` | **`server-fetch.ts:346` の action 生成ロジックのみ**（監査パネルとは無関係）。UI 提示は 0 件 |
| `AuditLogPanel` の action フィルタ現状 | `apps/web/src/components/admin/AuditLogPanel.tsx:181-183` | プレーンな自由入力 `<Input name="action" placeholder="attendance.add" />` のみ。プリセット無し |
| `/admin/audit` ページ | `apps/web/app/(admin)/admin/audit/page.tsx` | searchParams → `AuditSearchValues` → `safeServerFetch` → `AuditLogPanel`。action は自由入力テキスト契約 |
| API の identity action 文字列（最適化先の正確な値） | `apps/api/src/repository/identity-merge.ts:147` / `identity-conflict.ts:250` / `routes/admin/audit.contract.spec.ts:180` | `identity.merge` / `identity.dismiss` が**現行コードでも正本**。`?action=identity.dismiss` フィルタも現役 |

> **結論: Issue #1039 は別タスクを含めどこにも実装されていない（未解決）。** よって本 issue の実行は必要であり、不要ではない。
> 改善内容（プリセット UI）はコードベース全体に存在せず、運用者は今も `identity.merge` / `identity.dismiss` を手入力する必要がある。

### Issue の陳腐化と最適化（依頼「issue が古いかもしれない」への回答）

issue 本文（2026-05-30 起票）の核心（プリセット値 `identity.merge` / `identity.dismiss`）は**現行 API と完全一致しており陳腐化していない**。陳腐化していたのは記載パスのみで、本 workflow で以下に最適化する。

| 陳腐化箇所 | issue 本文の記載 | 最新コードの実値（最適化後） |
|---|---|---|
| ページパス | `apps/web/src/app/...`（暗黙） | `apps/web/app/(admin)/admin/audit/page.tsx`（App Router は `apps/web/app/` 配下） |
| 苦戦箇所の worktree パス | `.worktrees/task-20260529-180246-wt-8/...` | 本ワークツリー `.worktrees/task-20260601-121301-wt-5/...`（パスは worktree 非依存に正規化） |
| component test ファイル | `AuditLogPanel.component.spec.tsx`（場所未明記） | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx`（実在確認済み） |
| page test ファイル | `app/(admin)/admin/audit/page.page.spec.tsx`（拡張子 `.tsx`） | 実在は `apps/web/app/(admin)/admin/audit/page.page.spec.ts`（`.ts`） |

> 根本問題（運用者が identity 操作 action を手入力しないと監査できない）は、上記最新パスへ写像した上で**1 サイクル内で完結する単一スコープ**（`AuditLogPanel.tsx` の datalist 化 + 回帰テスト）として確定する（CONST_007）。

---

## 1. 根本問題（最適化後の1文定義）

> `/admin/audit` の action フィルタは自由入力テキストのみで、`identity.merge` / `identity.dismiss` を一字一句正確に手入力しないと identity 操作の監査ログを絞り込めない。
> その根本原因は「**よく使う action の入力補助（提示）が存在しない**」ことであり、#987 で API producer 側の `identity.dismiss` 記録（根本機能）は成立済みだが、閲覧側の操作性が未着手で残っている。

### 最適化された解決方針（Phase 2 で確定する設計の要旨）

| 論点 | 決定 | 根拠 |
|------|------|------|
| 提示方式 | **HTML5 `<datalist>` + `<Input list="...">`**（combobox 相当のネイティブ入力補助） | 自由入力を殺さず（AC-3）、`name="action"` / URL query 契約を不変に保つ（AC-2）。React state 不要・SSR 親和・追加 a11y 配線不要 |
| プリセット値 | `identity.merge`, `identity.dismiss` | API 現行値（`identity-merge.ts:147` / `identity-conflict.ts:250`）と一致。最適化済み |
| Select への置換 | **しない** | Select 化すると任意 action（`member.delete` 等）が入力不能になり AC-3 退化 |
| URL query 契約 | `action=<value>` を不変。`buildAuditHref` は無変更 | deep link / cursor pagination 保持（AC-2 / AC-4） |
| 配置 | 既存 `action` FormField 内の `<Input>` に `list` 属性付与 + 同 FormField 直下に `<datalist>` | identity 系だけが唯一の選択肢に見えない配置（issue リスク表「低」対策） |

---

## 2. スコープ

### 含む（今回サイクル内で完了 — CONST_007）

1. `apps/web/src/components/admin/AuditLogPanel.tsx`: action `<Input>` への `list` 属性付与 + `<datalist id="audit-action-presets">`（`identity.merge` / `identity.dismiss` option）追加。
2. `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx`: datalist 提示・自由入力維持・`name="action"` 不変・defaultValue 復元の回帰テスト追加。既存 6 テストの非退化確認。
3. `apps/web/app/(admin)/admin/audit/page.page.spec.ts`: `?action=identity.dismiss` SSR searchParams 復元の回帰テスト追加。
4. Issue #987 Phase 12 実装ガイドとの参照関係記録（implementation-guide 内）。
5. aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory / lessons / changelog 同期。

### 含まない（別タスク化。理由・実施先を明記 — CONST_007 例外条件）

| 除外項目 | 理由 | 実施先 |
|---------|------|--------|
| `apps/api/src/routes/admin/audit.ts` / `repository/auditLog.ts` の変更 | producer 側は #987 で成立済み。閲覧 UI 改善のみが本スコープ | 実施しない（不要） |
| D1 migration / `audit_log` schema 変更 | スキーマ非依存の UI 入力補助 | 実施しない（不要） |
| `identity.dismiss` audit producer 実装の再変更 | #987 で根本機能成立済み | 実施しない（不要） |
| staging / production deploy・commit・push・PR 作成 | ローカル実装・focused evidence 取得後の外部操作 | Phase 13（user-gated） |

> 上記は「分量が多い」ためではなく、**API producer / schema は #987 で既に閉じており、本 issue が UI 閲覧の操作性改善に限定**されているため。今回スコープ（datalist + 回帰テスト）は単独で機能完結する垂直スライスで、1 サイクル完了済み。**未タスク（バックログ）への分離は無し**。

---

## 3. 不変条件（実装時に厳守）

1. D1 直接アクセスは `apps/api` に閉じる。`apps/web` から D1/API producer に触れない — CLAUDE.md invariant #5。本タスクは閲覧 UI のみで API 非接触。
2. action の URL query key（`action`）と GET form 契約（`form action="/admin/audit"`）を不変に保つ — issue AC-2。
3. 自由入力 `<Input name="action">` を維持（datalist は入力補助であり Select 置換ではない）— issue AC-3。
4. 色は OKLch token のみ。datalist は native UI のため追加スタイル原則不要。装飾を足す場合も `--ubm-color-*` トークン経由（HEX 直書き禁止）— UI prototype alignment 不変条件 #2。
5. 既存 UI primitive（`FormField` / `Input`）経由を標準とし、`apps/web/src/components/admin/` 配下で直接 `<input>` を増やさない — CLAUDE.md invariant #9。`<datalist>` は native element で `<input>` ではないため抵触しない。
6. admin panel の新規 primitive を生やさない — UI prototype alignment 不変条件 #3。
7. 新規 test は `*.spec.{ts,tsx}` のみ — CLAUDE.md invariant #8。本タスクは既存 spec への追記。
8. `buildAuditHref` の出力（cursor pagination href）を不変に保つ — issue AC-4。
9. プリセット値は API 現行 action 文字列（`identity.merge` / `identity.dismiss`）と一致させる。

---

## 4. タスク表

| Task | スコープ | 想定ファイル数 | 並列 |
|------|---------|--------------|------|
| Task A — datalist UI | `AuditLogPanel.tsx` の `<Input list>` + `<datalist>` | 1 | 単独 |
| Task B — 回帰テスト | component spec + page spec の追記 | 2 | A の実装方針確定後（仕様書上は同一サイクル） |

> Task A/B は本 cycle で実コードへ反映済み。Phase 13 は commit / push / PR / staging runtime screenshot の user-gated 境界のみを扱う。

---

## 5. Phase 成果物マップ

| Phase | ファイル | 区分 |
|-------|---------|------|
| Phase 1 要件定義 | `phase-1.md` | 設計（直列） |
| Phase 2 設計 | `phase-2.md` | 設計（直列） |
| Phase 3 設計レビュー | `phase-3.md` | 設計（直列・ゲート） |
| Phase 4 テスト作成 | `phase-4.md` | 実装仕様 |
| Phase 5 実装 | `phase-5.md` | 実装仕様 |
| Phase 6 テスト拡充 | `phase-6.md` | 実装仕様 |
| Phase 7 カバレッジ確認 | `phase-7.md` | 実装仕様 |
| Phase 8 リファクタリング | `phase-8.md` | 実装仕様 |
| Phase 9 品質保証 | `phase-9.md` | 実装仕様 |
| Phase 10 最終レビュー | `phase-10.md` | 実装仕様 |
| Phase 11 手動テスト | `phase-11.md` | 実装仕様（VISUAL_ON_EXECUTION） |
| Phase 12 ドキュメント更新 | `phase-12.md` | 実装仕様 |
| Phase 13 PR作成 | `phase-13.md` | 実装仕様（user-gated） |

---

## 6. 参照

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/1039
- 親 issue #987 実装ガイド: `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/implementation-guide.md`
- 対象 component: `apps/web/src/components/admin/AuditLogPanel.tsx`
- 対象 page: `apps/web/app/(admin)/admin/audit/page.tsx`
- 対象 component test: `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx`
- 対象 page test: `apps/web/app/(admin)/admin/audit/page.page.spec.ts`
- API identity action 正本: `apps/api/src/repository/identity-merge.ts:147` / `apps/api/src/repository/identity-conflict.ts:250`
- 既存 UI primitive: `apps/web/src/components/ui/Input.tsx` / `apps/web/src/components/ui/FormField.tsx`
