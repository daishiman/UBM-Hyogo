# shell collapse cookie の Secure 属性 production hardening - タスク指示書

```yaml
issue_number: 1063
task_id: issue-1024-followup-001-cookie-secure-attribute-production-hardening
task_name: shell collapse cookie に production 限定で Secure 属性を付与
category: セキュリティ
target_feature: apps/web/src/components/shell/shell-collapse-cookie.ts
priority: 低
scale: 小規模
status: 未実施
source_phase: issue-1024-sidebar-collapse-cookie-persistence Phase 12 / 2回目独立検証
created_date: 2026-05-31
dependencies: [issue-1024-sidebar-collapse-cookie-persistence]
```

## メタ情報

| 項目         | 内容                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| タスクID     | issue-1024-followup-001-cookie-secure-attribute-production-hardening                                    |
| タスク名     | `ubm_shell_collapsed` cookie に production 限定で `Secure` 属性を付与する                                |
| 分類         | 改善 / セキュリティ hardening                                                                           |
| 対象機能     | `apps/web/src/components/shell/shell-collapse-cookie.ts`（cookie writer / serializer）                  |
| 優先度       | 低                                                                                                     |
| 見積もり規模 | 小規模                                                                                                 |
| ステータス   | spec_created（未着手・実装/commit/PR は user-gated）                                                    |
| 発見元       | issue-1024-sidebar-collapse-cookie-persistence Phase 12 / 2回目独立検証（unassigned-task-detection §1） |
| 発見日       | 2026-05-31                                                                                             |
| GitHub Issue | [#1063](https://github.com/daishiman/UBM-Hyogo/issues/1063)                                             |

## 親 / 関連 workflow

- 起点 workflow: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/`（移動後 path）
- 起点 outputs: `.../outputs/phase-12/unassigned-task-detection.md`（§1 候補「cookie に Secure 属性を付与」=意図的見送り）
- 関連実装: `apps/web/src/components/shell/shell-collapse-cookie.ts`（現状 `Path=/; Max-Age=...; SameSite=Lax` のみ。`Secure` 無し）
- 制約根拠: `apps/web/src/lib/env.ts`（環境判定アクセサ正本）/ CLAUDE.md「`apps/web` env アクセス不変条件」

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-1024 で sidebar collapse 状態を cookie（`ubm_shell_collapsed`）へ永続化した。cookie 属性は `Path=/; Max-Age=31536000; SameSite=Lax` で、**`Secure` 属性は意図的に付与していない**。理由は localhost dev（`http://`）で cookie が送信されなくなり開発体験を阻害するため。これは issue-1024 の `implementation-guide.md` cookie 属性表および `unassigned-task-detection.md` §1 に設計判断として記録済み。

### 1.2 問題点・課題

- production（`https://`）では UI 設定 cookie であっても `Secure` を付与するのが Web セキュリティのベストプラクティス。平文 HTTP 経路への cookie 漏出（中間者による cookie 読取り）を構造的に防げる。
- 現状は dev / production で同一の cookie 文字列を生成しており、production でも `Secure` が無い。
- 秘匿情報を含まない UI 設定 cookie のためリスクは低いが、cookie 属性ポリシーの一貫性（将来 cookie を増やす際の標準）として hardening 余地がある。

### 1.3 放置した場合の影響

- 後続で他の UI 設定 cookie（density 等）を追加する際、`Secure` 無しの先例を踏襲してしまい、秘匿性の高い cookie にも `Secure` 漏れが波及するリスク。
- セキュリティレビュー / 監査時に「production cookie に Secure 無し」が指摘事項になりうる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`ubm_shell_collapsed` cookie を **production（HTTPS）でのみ `Secure` 付き**で発行し、localhost dev では従来どおり `Secure` 無しで発行する環境分岐を導入する。

### 2.2 最終ゴール

- production runtime で `document.cookie` 書込み時に `; Secure` が付与される。
- dev runtime（localhost / http）では `Secure` が付かず、cookie が従来どおり送受信される。
- 環境判定は `apps/web/src/lib/env.ts` の公開アクセサ（`getPublicEnv()` 等）経由で行い、`process.env.*` 直接参照を増やさない（CLAUDE.md env 不変条件）。
- 既存の collapse 永続化 / SSR seed 挙動は回帰しない。

### 2.3 スコープ

#### 含むもの

- `shell-collapse-cookie.ts` の serializer（cookie 文字列生成）へ `Secure` 条件付与ロジックを追加。
- 環境判定ヘルパの参照（`getPublicEnv()` の `ENVIRONMENT`/`NODE_ENV` 相当、または既存の `is-browser` と併用した production 判定）。判定経路は env アクセサ正本に従う。
- focused Vitest（production 判定時 `Secure` 付与 / dev 判定時 `Secure` 無し / parser 後方互換の 3 観点）。

#### 含まないもの

- cookie 名・value 形式・`SameSite`・`Max-Age`・`Path` の変更（issue-1024 の不変条件 I-6 を維持）。
- 他 UI 設定 cookie（density 等）の Secure 化（本タスクは collapse 1 cookie に限定）。
- API endpoint / D1 schema / Google Form 仕様変更（親不変条件 #1 / #5）。
- HttpOnly 付与（client が読み書きするため付与不可。issue-1024 I-6 維持）。

### 2.4 成果物

- `shell-collapse-cookie.ts` の Secure 環境分岐差分。
- focused Vitest spec（`shell-collapse-cookie.spec.ts` への追記）。
- 本 follow-up を consumed に更新する記録（実装 workflow 側）。

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 環境判定の正本経路（最重要）

`apps/web` では `process.env.*` 直接参照が CLAUDE.md「env アクセス不変条件」で禁止されており、env 参照は `apps/web/src/lib/env.ts` の公開アクセサ（`getEnv()` / `getPublicEnv()` 等）経由のみ。client component から呼ぶ writer で production 判定する際、`getPublicEnv()` がクライアントバンドルで安全に解決できる値（公開 var）であることを確認する必要がある。`getEnv()`（zod throw 経路）を client writer の同期パスで握ると throw 補足設計（error boundary）に乗らないため、**throw しない安全な判定**（`getPublicEnv()` の公開値 or `browserDocument().location.protocol === "https:"` のような runtime 判定）を選ぶこと。後者は env を増やさず client 単独で完結する利点があり有力候補。

### 3.2 cookie 文字列の単一 source 維持

issue-1024 では cookie I/O を `shell-collapse-cookie.ts` 1 module へ集約した（不変条件）。Secure 分岐を serializer の内側に閉じ込め、呼出側（`useSidebarState` の toggle）は分岐を意識しないよう設計すること。read 側（parser）は `Secure` 有無に依存しない（属性は送信制御であり value には現れない）ため parser は無改修で良い点に注意。

### 3.3 テストでの環境分岐モック

Vitest（jsdom）で production 判定をどうモックするか。`getPublicEnv()` 経由なら env モック、`location.protocol` 経由なら `window.location` のスタブが必要。issue-1024 の既存テストは `browserDocument()` を介して cookie を検証しているため、その流儀（`is-browser` アクセサのモック）に合わせると一貫する。

### 3.4 後続実装者向けの落とし穴メモ

- `Secure` を dev（http）でも付けると localhost で cookie が黙って送信されず、「collapse が永続化されない」回帰に見える。必ず環境分岐すること。
- `Secure` 有無は `document.cookie` の read 結果には現れない（書込み時の送信制御属性）。テストは「serializer が生成する文字列」を検証する（read 値で検証しない）。

---

## 4. 受入条件 (AC)

- **AC-1**: production 判定時、`shell-collapse-cookie.ts` の serializer が生成する cookie 文字列に `; Secure` が含まれる。
- **AC-2**: dev（localhost / http）判定時、cookie 文字列に `Secure` が含まれず、collapse 永続化が従来どおり機能する。
- **AC-3**: 環境判定は `apps/web/src/lib/env.ts` アクセサ経由 or client runtime 判定（`location.protocol`）で行い、`process.env.*` 直接参照を `apps/web/src` に増やさない。
- **AC-4**: cookie 名 / value / `SameSite` / `Max-Age` / `Path` は issue-1024 と同一（I-6 維持）。HttpOnly は付与しない。
- **AC-5**: parser（read 経路）は無改修で後方互換。SSR seed / hydration 挙動が回帰しない。
- **AC-6**: focused Vitest が green（production→Secure 付与 / dev→Secure 無し / parser 後方互換）。
- **AC-7**: `pnpm typecheck` / `pnpm lint`（lint-boundaries 含む）green。OKLch トークン不変・D1 直接アクセスなし（親不変条件遵守）。

---

## 5. 参照資料

- `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/implementation-guide.md` — cookie 属性表（Secure を「必要なら本番で付与検討」と明記した起点）
- `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/unassigned-task-detection.md` — §1 候補「cookie に Secure 属性を付与」
- `apps/web/src/components/shell/shell-collapse-cookie.ts` — cookie serializer / writer（本タスク改修対象）
- `apps/web/src/lib/env.ts` — env 公開アクセサ正本（環境判定経路）
- CLAUDE.md「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」 — `process.env` 直接参照禁止 / `getPublicEnv()` 経由
- issue-1024 不変条件 I-6（cookie 属性: `path=/`・`SameSite=Lax`・`max-age`・httpOnly なし）

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260531-153630-wt-4/apps/web/src/components/shell/shell-collapse-cookie.ts`
- 症状: `Secure` 属性は `document.cookie` の read 結果には現れないため、既存の cookie read/write 統合テストだけでは production 付与を検証できない。serializer 文字列を直接検証できる境界を用意する必要がある。
- 参照: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/implementation-guide.md` / `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| dev/http 環境でも `Secure` を付与し、localhost で cookie 永続化が黙って失敗する | `location.protocol === "https:"` など throw しない runtime 判定か、公開 env accessor 経由で production/HTTPS のみ付与する。dev 判定時に `Secure` が含まれない focused test を必須にする |
| `process.env.*` 直接参照を client writer に増やし、`apps/web` env 不変条件に違反する | `apps/web/src/lib/env.ts` の公開 accessor または browser runtime 情報のみを使う。実装後に `rg "process\\.env" apps/web/src/components/shell apps/web/src/lib/env.ts` で差分を確認する |
| read 結果で `Secure` を検証して false negative / false positive になる | cookie serializer の戻り値、または writer へ渡す文字列を捕捉する focused test に限定して属性を検証する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/web test:run apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
mise exec -- pnpm --filter @repo/web test:run apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx
```

期待: production/HTTPS 判定では `; Secure` が付与され、dev/http 判定では付与されない。既存 parser / SSR seed の後方互換テストも PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web lint
rg "process\\.env" apps/web/src/components/shell apps/web/src/lib/env.ts
```

期待: typecheck / lint が PASS。`apps/web/src/components/shell` に `process.env.*` 直接参照が増えていない。

## スコープ

### 含む

- `apps/web/src/components/shell/shell-collapse-cookie.ts` の cookie serializer / writer に production または HTTPS 限定の `Secure` 属性付与を追加する。
- production/HTTPS と dev/http の両分岐を focused Vitest で固定する。
- cookie 名・value・`SameSite=Lax`・`Max-Age`・`Path=/` の既存契約が変わらないことを検証する。

### 含まない

- `HttpOnly` 付与（client component が cookie を読み書きするため不可）。
- 他の UI 設定 cookie の設計・追加。
- API / D1 / Google Form / Cloudflare runtime 設定の変更。
