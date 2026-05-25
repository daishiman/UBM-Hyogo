# admin-mutation-timeout-policy — タスク指示書

## メタ情報

| 項目         | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| タスクID     | admin-mutation-timeout-policy                                                                     |
| タスク名     | admin 全体 destructive mutation の timeout / retry / idempotency reliability policy 統一          |
| 分類         | 改善 / cross-admin reliability policy                                                             |
| 対象機能     | `apps/web/src/features/admin/hooks/useAdminMutation` を利用する admin 配下全 destructive mutation |
| 優先度       | 中（P2）                                                                                          |
| 見積もり規模 | 中（policy 設計 + hook シグネチャ拡張 + 既存 caller 横展開 + spec/test 追記）                     |
| ステータス   | consumed_by_canonical_workflow                                                                   |
| 発見元       | `step-06-meetings-attendance-implementation` Phase 12 `unassigned-task-detection.md`              |
| 発見日       | 2026-05-19                                                                                        |

## Canonical Workflow Status

- 正規 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- 正規化日: 2026-05-24
- 状態: `consumed_by_canonical_workflow`（本 one-pager は履歴参照として保持し、実行時は正規 workflow を参照する）
- 親 workflow: `docs/30-workflows/step-06-meetings-attendance-implementation/`
- 親 workflow 状態: `implemented_local_evidence_captured`（step-06 単独スコープでは完了。timeout policy は admin 全体に波及するため切り出し）
- 発見元 evidence: `docs/30-workflows/step-06-meetings-attendance-implementation/outputs/phase-12/unassigned-task-detection.md`（"mutation timeout policy" 行）
- 修正対象（候補）:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`（policy 拡張本体）
  - `apps/web/src/features/admin/hooks/index.ts`（公開 API 整理）
  - `apps/web/src/lib/useAdminMutation.ts`（legacy — 廃止統合方針確定対象）
  - `apps/web/src/components/admin/**`（既存 caller を新 policy に追従）
  - `apps/web/app/(admin)/admin/**`（route segment 側で hook を直接呼ぶ箇所）
- 関連 PR / 親サイクル成果:
  - `MeetingAttendancePanel.tsx`（step-06 で `useAdminMutation` + `useConfirmDialog` に統一）
  - `MeetingPanel.tsx`（同サイクルで `ConfirmDialog` 導入済）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

step-06（meetings attendance 管理画面）で admin destructive mutation を `apps/web/src/features/admin/hooks/useAdminMutation` に統一し、`useConfirmDialog` を介した確認 → 実行フローを `MeetingAttendancePanel.tsx` / `MeetingPanel.tsx` に適用した。

このサイクル内で `useAdminMutation` 自体は「fetch ラッパ + エラーハンドリング + invalidate」までは正本化したが、以下の reliability 観点が **未整備のまま admin 全体に温存**されていることが Phase 12 で確認された:

- **timeout**: fetch がハングした場合の打ち切り基準（5s / 10s / endpoint 別の SLA）が未定義
- **retry**: 一過性の 5xx / network error に対する自動再試行ポリシー（exponential backoff / 上限回数）未定義
- **idempotency**: 出席登録・解除のような POST/DELETE の重複押下に対する保護（client 側デバウンス + server 側 idempotency-key）未定義
- **edge case 標準化**: 「他管理者が先行解除した場合の 404」を成功相当に倒すか失敗扱いにするかの policy が caller ごとに散在

step-06 では `MeetingAttendancePanel.tsx` で「DELETE attendance → 404 attendance_not_found は『他管理者先行解除』として成功 toast を出す」という個別実装を入れたが、これは admin 全体に共通する pattern であり、hook 側で吸収しなければ tags / members / requests / identity-conflicts の同種 mutation が同じ判断を別々に下すことになる。

### 1.2 問題点・課題

- legacy `apps/web/src/lib/useAdminMutation` と新基盤 `apps/web/src/features/admin/hooks/useAdminMutation` が **二重に存在**しており、endpoint SSOT 判定で手戻りが発生した（CLAUDE.md 不変条件 10 で参照先は新基盤に限定済だが、legacy ファイル自体は残置）
- UI surface の `/attendances`（複数形 / 現行 UI 期待）と legacy API-only contract の `/attendance`（単数）の混在が hook caller に染み出しており、timeout/retry 判断より前段の path 解決でブレが生じる
- caller 個別の try/catch で 404 や AbortError を独自処理しているため、timeout 導入時に AbortError ハンドリングと 404 success-relaxation の責務境界が caller 側に再分散してしまう
- ConfirmDialog の focus trap / focus restore は step-06 で `useConfirmDialog` 経由に統合済だが、timeout 中に dialog を閉じた場合の AbortController 連動が未仕様

### 1.3 放置した場合の影響

- admin 配下で長時間ハング → 管理者が画面リロード or 別タブ操作 → 重複 mutation で audit log 汚染
- 「他管理者先行解除」を成功扱いにする判断が caller ごとに揺れ、tags / requests など別 surface で 404 を error toast 表示してしまう regression
- legacy `lib/useAdminMutation` への新規参照が将来追加されると CLAUDE.md 不変条件 10 違反、かつ timeout policy が片側にしか実装されない split brain を生む

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/src/features/admin/hooks/useAdminMutation` を admin destructive mutation の **唯一の reliability policy 注入点**として確立し、timeout / retry / idempotency / 404-as-success の共通 edge case を hook 内部で吸収する。

### 2.2 最終ゴール

- `useAdminMutation` のシグネチャに `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` 等の policy オプションを追加（既定値はサイト全体 SLA に整合）
- 内部実装に `AbortController` ベースの timeout 打ち切りと exponential backoff retry を追加
- 「他管理者先行解除」相当の 404 success-relaxation を policy オプションで宣言可能にし、`MeetingAttendancePanel.tsx` の個別実装を hook 経由に置換
- `ConfirmDialog` / `useConfirmDialog` と timeout の連動（dialog close 時に進行中 mutation を abort）を実装
- legacy `apps/web/src/lib/useAdminMutation.ts` の **廃止 or 完全な薄い re-export ラッパ化**を判断・実行
- admin 配下既存 caller を新 policy に揃え、UI surface `/attendances` を hook 引数経路上で正規化（caller での path 直書きを禁止）

### 2.3 スコープ

#### 含むもの

- `useAdminMutation` の policy オプション拡張（型・既定値・doc コメント）
- timeout (`AbortController`) / retry (idempotent method 限定 / backoff) / idempotency-key 注入の hook 実装
- 404 success-relaxation policy（`treat404AsSuccess: 'silent' | 'toast' | false` 等の三択）
- `useConfirmDialog` との連動（dialog unmount 時 abort）
- legacy `lib/useAdminMutation.ts` の取扱い決定（削除 / re-export / deprecate コメント）
- 既存 admin caller の hook 引数移行（path、policy 指定）
- 仕様書・spec test（`useAdminMutation.spec.ts(x)` 追加）
- ローカル `mise exec -- pnpm typecheck` / `pnpm lint` / 該当 vitest 実行

#### 含まないもの

- **API endpoint surface の追加・変更**（既存 `/attendances` 含む現行 endpoint shape は不変、CLAUDE.md UI prototype alignment 不変条件 1）
- **D1 schema 変更**
- **server 側 idempotency-key の永続化**（本タスクは client 側送出と header 設計まで。server 側の idempotency table 整備は別タスク）
- **Google Form 仕様変更**
- **`apps/web` からの D1 直接アクセス**（CLAUDE.md 不変条件 5）
- **ConfirmDialog 自体の UI/UX 変更**（focus trap / restore は step-06 完了済）
- **admin 以外（公開 / 会員 mypage）の mutation 経路への波及**（admin scope に限定）

### 2.4 成果物

- `apps/web/src/features/admin/hooks/useAdminMutation.ts` policy 拡張差分
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts(x)` 追加
- 既存 caller の policy 注入差分（少なくとも `MeetingAttendancePanel.tsx` の 404-handling を hook 経由に移譲）
- legacy `lib/useAdminMutation.ts` の処置差分（削除 or re-export）
- typecheck / lint / vitest PASS の evidence log

---

## 3. 苦戦箇所 (Struggle Points)

> step-06 サイクルで実際に手戻りが発生したポイントを、将来同種タスクが同じ落とし穴を踏まないように具体化して残す。

### 3.1 legacy と新基盤の二重存在による endpoint SSOT 判定の手戻り

`apps/web/src/lib/useAdminMutation` と `apps/web/src/features/admin/hooks/useAdminMutation` が同名で並存しているため、step-06 実装中に「どちらを正本とみなして endpoint パスを揃えるか」の判定で複数回の戻りが発生した。CLAUDE.md 不変条件 10 で新基盤参照が宣言されてはいるが、legacy ファイル自体が残置しているため import auto-suggest が legacy に誘導する事故が起きやすい。

**対処方針**:
- 本タスク冒頭で legacy ファイルの処置（削除 / 1 行 re-export 化 / `@deprecated` JSDoc + lint rule）を **最初に決定**する
- 決定までに endpoint policy 設計を進めない（SSOT が二重のままだと policy も二重実装される）

### 3.2 UI surface `/attendances`（複数形）と legacy API-only contract `/attendance`（単数）の混在

現行 UI 期待 path は `/attendances` だが、legacy 経路で `/attendance`（単数）が残っており、step-06 では caller 側で path を直書きすることで合わせ込んだ。timeout/retry policy を hook 側に集約するなら、caller が path を直接渡す前に **hook 側で path 正規化 layer**（少なくとも単複表記の SSOT 化）を持たないと、retry 時に 404 を引いて success-relaxation policy が誤発火する。

**対処方針**:
- hook 引数を `resource: 'attendances' | 'meetings' | 'tags' | ...` + `action`（method + sub-path）に分解、または既存 API client 経由でパス解決を hook の外に出す
- caller 側の path 直書きを禁止する lint rule または review checklist を追加

### 3.3 ConfirmDialog の focus trap / focus restore と timeout abort の責務分離

step-06 で `MeetingAttendancePanel.tsx` の直接 fetch を `useAdminMutation` 経由に置換する際、`ConfirmDialog` の focus trap / focus restore は `useConfirmDialog` 内に閉じて実装した。これに timeout policy を加えると「ダイアログ閉じ → AbortController.abort → finally で focus restore」の順序が caller / hook / dialog の 3 者にまたがる。実装順序を誤ると focus が呼び出し元に戻らない、または abort 後に成功 toast が出る regression が起きやすい。

**対処方針**:
- `useConfirmDialog` の close 関数が `useAdminMutation` の `abort()` を呼べるよう、両 hook を結ぶ contract（`onCancelMutation?: () => void` 等）を明示
- AbortError は `useAdminMutation` 内で握り潰し、toast を出さない（caller / dialog 側で「キャンセル時に成功扱いしない」ことを保証）
- focus restore は dialog 側責務、mutation 結果 toast は hook 側責務、と層を切る

### 3.4 出席解除 404 を「他管理者先行解除」として成功相当に扱う edge case 解釈

step-06 では `DELETE /meetings/:id/attendances/:userId` で 404 `attendance_not_found` が返った場合、他管理者が先行解除した結果と解釈し成功 toast を出した。これを policy 化する際の論点は次のとおり:

- 「成功 silent」 vs 「情報 toast（"他の管理者によって解除されました"）」 vs 「失敗 toast」のどれを既定にするか
- tags / requests / identity-conflicts の同種 DELETE で同じ意味になるとは限らない（tag の 404 はバグ可能性が高い）
- 楽観的 UI 更新（先に UI 側で消す）と組み合わせると、404 を silent success にしないと UI が「失敗 → 巻き戻し → 再表示」する flicker を起こす

**対処方針**:
- hook オプションを `treat404AsSuccess: false | 'silent' | { toast: string }` の 3 値で表現し、caller が resource 特性ごとに宣言
- 既定値は **`false`**（明示しなければ 404 は失敗扱い）として安全側に倒す
- step-06 で実装済の `MeetingAttendancePanel.tsx` は `{ toast: '他の管理者により既に解除されています' }` 相当を明示指定する形で hook 経由に移譲

### 3.5 学んだこと / 横展開メモ

- legacy / 新基盤の同名 hook 二重存在は、policy 拡張前に **強制的に片寄せ**しないと拡張中の SSOT 判定が爆発する
- destructive mutation の reliability policy は「caller ごとの try/catch」ではなく hook オプションで宣言する形に倒すと、admin 横展開コストが線形に収まる
- ConfirmDialog / useConfirmDialog と mutation hook の責務境界は「dialog = focus と open 状態 / hook = 通信ライフサイクル」で切ると abort 連携が直感的になる
- 404 success-relaxation は resource 特性依存。policy は 3 値（false / silent / toast）が現状の admin surface を網羅する最小集合

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/src/features/admin/hooks/useAdminMutation` のシグネチャに `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` 相当のオプションが追加され、型定義と JSDoc が揃っている
- **AC-2**: timeout 経過時に `AbortController.abort()` が発火し、AbortError は caller に「失敗 toast」として伝播しない（silent abort）
- **AC-3**: retry は idempotent method（GET / PUT / DELETE）に限定し、POST のような非冪等 method には retry を適用しない既定が type レベルで表現されている
- **AC-4**: `treat404AsSuccess` の 3 値（`false` / `'silent'` / `{ toast: string }`）が型で表現されており、既定値は `false`
- **AC-5**: `useConfirmDialog` の close で進行中 mutation が abort され、focus が呼び出し元 element に restore される
- **AC-6**: `MeetingAttendancePanel.tsx` の「他管理者先行解除」相当ロジックが hook オプション宣言に置換され、caller 側 try/catch から 404 個別処理が消えている
- **AC-7**: legacy `apps/web/src/lib/useAdminMutation.ts` の処置（削除 / re-export / deprecate）が決定され、適用差分が含まれている
- **AC-8**: 既存 admin caller のうち本タスクで触る範囲が新基盤 `features/admin/hooks/useAdminMutation` のみを参照している（CLAUDE.md 不変条件 10）
- **AC-9**: `apps/api` の endpoint surface に新規 endpoint 追加が無い（CLAUDE.md UI prototype alignment 不変条件 1）
- **AC-10**: D1 schema 変更が無い（CLAUDE.md 不変条件 5 継承）
- **AC-11**: `apps/web` から D1 binding への直接アクセスが導入されていない（CLAUDE.md 不変条件 5）
- **AC-12**: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts(x)` に timeout 発火 / retry 上限 / idempotency-key 注入 / 404 三値挙動 / abort 連携の 5 観点が追加され PASS
- **AC-13**: `mise exec -- pnpm typecheck` がローカルで 0 error
- **AC-14**: `mise exec -- pnpm lint` がローカルで 0 error / 0 warning（既存 baseline 維持）
- **AC-15**: 該当 vitest が 0 fail で完走

---

## 5. 参照資料

- `docs/30-workflows/step-06-meetings-attendance-implementation/` — 親 workflow（発見元サイクル）
- `docs/30-workflows/step-06-meetings-attendance-implementation/outputs/phase-12/unassigned-task-detection.md` — 発見元 evidence（"mutation timeout policy" 行）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` — 拡張対象本体
- `apps/web/src/features/admin/hooks/useConfirmDialog.ts` — abort 連携対象
- `apps/web/src/components/ui/ConfirmDialog.tsx` — focus trap / restore 実装（step-06 で導入）
- `apps/web/src/lib/useAdminMutation.ts` — legacy（処置判断対象）
- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` — 404 success-relaxation の現行 caller 実装
- `apps/web/src/components/admin/MeetingPanel.tsx` — ConfirmDialog 経由 destructive mutation の参考実装
- CLAUDE.md 不変条件:
  - 5（`apps/web` からの D1 直接アクセス禁止）
  - 9（admin form input は `FormField` 経由）
  - 10（admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準）
- CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 1（既存 API endpoint surface 不変）

---

## メタ（末尾）

| key      | value |
| -------- | ----- |
| priority | P2    |
| scope    | cross-admin (features/admin/hooks/useAdminMutation 配下の全 caller) |
| parent   | docs/30-workflows/step-06-meetings-attendance-implementation/ |
| status   | consumed_by_canonical_workflow |
| canonical_workflow | docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/ |
