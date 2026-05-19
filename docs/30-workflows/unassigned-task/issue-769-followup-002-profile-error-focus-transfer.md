# issue-769-followup-002 `/profile/error.tsx` h1 自動 focus 横展開 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| タスクID     | issue-769-followup-002-profile-error-focus-transfer                                                 |
| タスク名     | `/profile/error.tsx` に root error boundary 同等の a11y hardening（h1 自動 focus 等）を横展開       |
| 分類         | 改善 / a11y (accessibility) horizontal-hardening                                                    |
| 対象機能     | `/profile` route segment error boundary のスクリーンリーダー読み上げ促進                            |
| 優先度       | 中（会員マイページ中核 route の a11y 改善。root 完了済を前提に横展開）                              |
| 見積もり規模 | 小（既存 `profile/error.tsx` の置き換え相当 + spec 1 本 + test 1 本）                               |
| ステータス   | pending                                                                                             |
| 発見元       | issue-769 Phase 12 unassigned-task-detection（followup candidate: `/profile/error.tsx` focus 転送） |
| 発見日       | 2026-05-17                                                                                          |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`（a11y hardening 系列として位置付け）
- 親 workflow 状態: `implemented_local_evidence_captured`（root error.tsx focus は issue-769 で完了済）
- 直接の起点 spec: `docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md`（Follow-up Candidates 行 `/profile/error.tsx` focus transfer）
- 横展開元実装: `apps/web/app/error.tsx`（root, issue-769 で `useRef` + `headingRef.current?.focus({ preventScroll: true })` を実装済み）
- 関連 followup:
  - issue-769-followup-001（`useAutoFocusOnMount(ref)` 共通 hook 抽出案。merge 済なら本タスクで利用し、未抽出ならインライン実装）
  - 別 followup（`/admin/error.tsx` focus transfer）— 本タスクスコープ外

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-769 で root `apps/web/app/error.tsx` に対し以下の a11y hardening を完了した:

1. `role="alert"` + `aria-live="assertive"` 設定
2. `error.digest` 表示
3. `useRef<HTMLHeadingElement>` + `tabIndex={-1}` + `useEffect` 内 `headingRef.current?.focus({ preventScroll: true })` による h1 自動 focus
4. `logger.error` での構造化ログ出力

一方、`/profile` route segment の `apps/web/app/profile/error.tsx` は現時点で以下のみ実装されており、root と比べて a11y 品質に明確な差がある:

- `role="alert"` は付与済（`section` 要素に付与）
- `aria-live` 未設定
- `error.digest` 未表示
- h1 自動 focus 未実装（`useRef` / `tabIndex={-1}` / `focus({ preventScroll })` すべて欠落）
- `console.error` のみで構造化 logger 未使用
- `error.stack` の dev-only 表示なし

issue-769 の Phase 12 unassigned-task-detection でも「`/profile/error.tsx` focus transfer」が follow-up candidate として明示記録されており、root 完了の正本性を `/profile` に横展開する必要がある。

### 1.2 問題点・課題

- `/profile` は会員マイページの中核で頻繁にアクセスされる route であり、`fetchAuthed` non-2xx 等で error boundary が発火するシナリオは現実的に起こり得る
- スクリーンリーダー利用者がエラー発生に気付くまで遅延が生じる（`role="alert"` のみで `aria-live` も focus 移譲もない現状）
- root と `/profile` で a11y 実装品質の段差があり、後続で `/admin/error.tsx` 等を追加する際に「どちらを倣えばよいか」が曖昧になる
- `error.digest` 非表示のため、ユーザーから運用担当への問い合わせ時に identifier を共有できない

### 1.3 放置した場合の影響

- `/profile` route の a11y degradation が継続し、UI prototype alignment / MVP recovery の a11y baseline が route 間でばらつく
- 後続の admin route boundary 追加時にも同じ漏れが再発し、focus 管理の共通 hook（issue-769-followup-001）整備が進まない
- task-22 regression smoke で a11y baseline を取りに行く際、profile error boundary の自動 focus baseline が無いため diff 検知が成立しない
- issue-769 Phase 12 で記録された followup candidate が消化されないまま蓄積し、ui-prototype-alignment-mvp-recovery workflow の closing が遅れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/app/profile/error.tsx` を root `apps/web/app/error.tsx` と同等の a11y 仕様まで引き上げ、スクリーンリーダー利用者がプロフィール画面エラー時に即時通知されるようにする。

### 2.2 最終ゴール

- `apps/web/app/profile/error.tsx` が以下を満たす:
  - `useRef<HTMLHeadingElement>(null)` で h1 を bind
  - `useEffect` 内で `logger.error({ event: "error.boundary.caught", scope: "profile", digest, err })` → `headingRef.current?.focus({ preventScroll: true })` の順で副作用実行
  - h1 に `ref={headingRef}` と `tabIndex={-1}` を付与
  - 外側コンテナに `role="alert"` + `aria-live="assertive"` を付与（既存 `section role="alert"` を再構成 / `<main>` 配下の意味論は維持）
  - `error.digest` 存在時に エラーID として表示
  - `process.env.NODE_ENV !== "production"` 時のみ `error.stack` を dev pre 表示（任意 / root に倣う）
  - `console.error` を `logger` 経由に置換
- `apps/web/app/profile/error.component.spec.tsx`（新規 / 既存 `_components/__tests__/` ではなく `profile/` 直下、root の `apps/web/app/__tests__/error.component.spec.tsx` 配置慣行に倣う）に focus 移譲・digest 表示・aria 属性の単体検証を追加
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 該当 vitest が PASS
- issue-769 Phase 12 unassigned-task-detection の follow-up candidate `/profile/error.tsx` focus transfer が消化済として参照可能

### 2.3 スコープ

#### 含むもの

- `apps/web/app/profile/error.tsx` の a11y hardening 置き換え（root と同等パターンに揃える）
- issue-769-followup-001（共通 hook `useAutoFocusOnMount`）が merge 済なら hook を import して利用、未抽出なら i06 / issue-769 と同じインライン実装で実装
- 単体テスト（focus / digest / aria-live / logger 呼び出し検証）の追加
- ローカル `pnpm typecheck` / `pnpm lint` / 該当 vitest 実行
- issue-769 Phase 12 unassigned-task-detection 表内の `/profile/error.tsx` 行を「消化済（本タスクで対応）」として参照できる evidence の作成

#### 含まないもの

- `apps/web/app/profile/page.tsx` / `loading.tsx` / `not-found.tsx` の変更
- `apps/web/app/profile/_components/**` の UI 変更
- `apps/api` 側 endpoint shape / 戻り値変更（CLAUDE.md 不変条件 1: 既存 API のみ接続）
- D1 schema / Google Form 仕様変更（CLAUDE.md 不変条件 1）
- `/login/error.tsx` / `/admin/error.tsx` / `(member)/error.tsx` 等への横展開（別 followup）
- 新規 OKLch トークン / primitive 追加（CLAUDE.md 不変条件 2, 3）
- error.tsx 文言の本文変更（既存「マイページの読み込みに失敗しました」を維持）
- segment-level error boundary の配置変更（後述 §3.2 で判断理由を記録）

### 2.4 成果物

- `apps/web/app/profile/error.tsx` の修正差分
- `apps/web/app/profile/error.component.spec.tsx`（新規 / または既存 test 配置慣行に整合した path）
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / vitest PASS log（evidence）
- issue-769 Phase 12 unassigned-task-detection への back-link を含む完了報告

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 Next.js App Router segment-level error boundary の配置判断

Next.js App Router の `error.tsx` は **配置された segment 配下の render error のみ** を catch する。`/profile/error.tsx` の配置は以下のいずれかが候補となる:

- (a) `apps/web/app/profile/error.tsx`（現状の配置） — `/profile` route 直下の error のみ catch
- (b) `apps/web/app/(member)/error.tsx`（route group 単位） — `(member)` group 配下の全 route で共通 boundary

本タスクでは **(a) 現状配置を維持** する。理由:

1. `(member)` route group が現時点でリポジトリに存在しない（profile が member 系の唯一の route）。将来 `(member)` group 化する際は別タスクで設計判断する
2. 親 workflow `ui-prototype-alignment-mvp-recovery` の SCOPE が profile を「会員」層の単一 route として扱っており、segment 移動はスコープ外
3. issue-769 で root が完了済のため、`/profile/error.tsx` 未配置時は root boundary が補完する fallback 構造はすでに健全。本タスクは「profile segment にも同等品質を持たせる」ことが目的であり、配置移動を伴わない

### 3.2 issue-769-followup-001（共通 hook 抽出）との依存関係

issue-769-followup-001 は `useAutoFocusOnMount(ref, { preventScroll: true })` という共通 hook の抽出 task で、現時点で merge 状態が未確定。本タスクの実装方針は以下の分岐で決定する:

| followup-001 merge 状態 | 本タスクの実装                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| merge 済                | `useAutoFocusOnMount(headingRef)` を import して利用（DRY 維持）               |
| 未 merge                | i06 / issue-769 と同じインライン実装（`useRef` + `useEffect` 内 `focus` 呼出） |

未 merge を選択した場合の trade-off:

- DRY 違反は許容（root / profile の 2 箇所のみ。3 箇所目（admin）追加時に hook 抽出を強く推奨）
- 並列で followup-001 が進行している場合、本タスクと同ファイル編集で衝突する可能性 → 本タスク完了後に followup-001 が profile を hook 化リファクタする想定

### 3.3 既存 test 配置慣行との整合

`apps/web/app/profile/_components/` 配下の test は `_components/RequestActionPanel.component.spec.tsx` 形式（コンポーネントと同ディレクトリ）と `_components/__tests__/VisibilityRequest.component.spec.tsx` 形式（`__tests__/` サブディレクトリ）が混在している。
root error.tsx の test は `apps/web/app/__tests__/error.component.spec.tsx`（`__tests__/` ディレクトリ）に配置済。

本タスクでは以下のいずれかを実装時に選択する:

- (a) `apps/web/app/profile/__tests__/error.component.spec.tsx`（root と同じ `__tests__/` 慣行）— **推奨**
- (b) `apps/web/app/profile/error.component.spec.tsx`（components 直配置慣行）

選択基準: root の test 配置に揃えて (a) を推奨。implementation 時に既存の他の route segment（`/login` 等）の error test 配置を確認し、最頻パターンに合わせる。CLAUDE.md 不変条件 8（`*.spec.{ts,tsx}` のみ）は両 path で満たされる。

### 3.4 `console.error` → `logger` 置換時の SSR / Edge runtime 制約

`apps/web/src/lib/logger` は root error.tsx で既に client component 内で使用されているため、`/profile/error.tsx`（`"use client"` directive 済）でも問題なく動作する。ただし以下を確認する:

- `logger.error` の signature が root と同じ `{ event, digest, err }` であること
- `scope: "profile"` のような route 識別 field を追加するかどうかを実装時に判断（root が `scope` field を持たない場合は追加しない、運用観測性を上げたいなら追加する。最小差分を優先するなら root に倣う）

### 3.5 解決策候補（実施順）

1. **followup-001 merge 状態の確認**: 本タスク着手時に最新 `dev` を fetch し、`apps/web/src/lib/a11y/useAutoFocusOnMount.ts` 等の hook ファイルが存在するか確認する
2. **root 実装パターンの忠実な横展開**: `apps/web/app/error.tsx` を 1 行ずつ参照し、文言（「マイページの読み込みに失敗しました」/「再読み込み」）と segment 固有要素のみ差し替える
3. **test の追加**: root の `error.component.spec.tsx` から focus / digest / aria-live の test ケースを複写し、profile 固有の文言・logger 呼出 expectation に書き換える
4. **typecheck / lint / vitest 実行**: `mise exec --` 経由で品質ゲートを通す
5. **横展開メモ**: 完了報告に「次は `/admin/error.tsx` への展開を別 followup として推奨」「2 箇所揃った段階で followup-001（hook 抽出）の merit が増した」旨を記録

### 3.6 学んだこと / 横展開メモ（実装後に追記する想定）

- root → profile の 2 箇所が同パターンで揃った時点で、3 箇所目（admin 等）を追加する前に hook 抽出（followup-001）を実施するのが DRY / 漏れ防止の両面で最も効率的
- error boundary の DoD チェックリスト（ref / useEffect / tabIndex / preventScroll / aria-live / digest / logger）を route segment 追加時の必須項目として spec template 化することを提案
- `role="alert"` を `<section>` から `<div>`（root と同じ要素種別）に変更する場合、既存 e2e / visual smoke が要素 selector に依存していないかを確認する

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/app/profile/error.tsx` で h1 に `ref={headingRef}` と `tabIndex={-1}` が付与されている
- **AC-2**: 同ファイル内 `useEffect` で `logger.error → headingRef.current?.focus({ preventScroll: true })` の順序で副作用が実行される（`console.error` は除去）
- **AC-3**: `useRef<HTMLHeadingElement>(null)` で ref が生成されている（または issue-769-followup-001 merge 済の場合は `useAutoFocusOnMount(headingRef)` を利用）
- **AC-4**: 外側コンテナに `role="alert"` と `aria-live="assertive"` が同時に付与されている
- **AC-5**: `error.digest` 存在時に エラーID として表示される
- **AC-6**: `apps/web/app/profile/__tests__/error.component.spec.tsx`（または既存慣行に整合した path）に以下の検証が存在し PASS する
  - マウント直後に h1 に focus が当たる
  - `error.digest` を表示する
  - `role="alert"` + `aria-live="assertive"` が外側コンテナに付与されている
  - `logger.error` が `event: "error.boundary.caught"` 相当のペイロードで呼ばれる
- **AC-7**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がローカルで 0 error / 0 warning（既存 baseline 維持）
- **AC-8**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/error` 相当（または該当 spec を含む実行コマンド）が 0 fail で完走
- **AC-9**: issue-769 Phase 12 unassigned-task-detection の follow-up candidate 表内 `/profile/error.tsx` focus transfer 行に対し、「本タスクで消化済」を参照できる cross-link が成立している（本 spec の path を back-link として記録可能）
- **AC-10**: `/admin/error.tsx` / `/login/error.tsx` / その他 route の error.tsx を本タスクで変更していない（横展開先を絞り、別 followup と衝突しないこと）
- **AC-11**: 既存 `apps/web/app/profile/page.tsx` / `loading.tsx` / `not-found.tsx` / `_components/**` を変更していない（スコープ厳守）
- **AC-12**: CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 1〜4 を満たす（既存 API 接続のみ / OKLch トークン正本 / プロトタイプ primitives 使用 / D1 直接アクセスなし）

---

## 5. 参照資料

- `docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md` — 本タスク発見元（follow-up candidate `/profile/error.tsx` focus transfer 行）
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` — 同根 (root) の先行タスク指示書。実装パターン / AC 構造の元
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` — root focus 管理の親 spec（Before/After サンプルコード含む）
- `apps/web/app/error.tsx` — 横展開元の正本実装（issue-769 で完了済）
- `apps/web/app/profile/error.tsx` — 修正対象実装（現状: `console.error` のみ / focus 未実装 / aria-live 未設定 / digest 未表示）
- `apps/web/app/__tests__/error.component.spec.tsx` — テスト複写元
- `apps/web/src/lib/logger` — 構造化ログ entry point（root が使用中）
- 関連 followup:
  - issue-769-followup-001（共通 hook `useAutoFocusOnMount` 抽出案 / 状態確認必要）
  - `/admin/error.tsx` focus transfer（別 followup として将来切り出し）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件 1〜4 継承
- CLAUDE.md「重要な不変条件」項 5（`apps/web` から D1 直接アクセス禁止）/ 項 8（`*.spec.{ts,tsx}` のみ）継承
