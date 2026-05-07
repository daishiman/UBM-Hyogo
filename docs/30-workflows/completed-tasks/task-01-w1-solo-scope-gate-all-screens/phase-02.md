# Phase 02: スコープ確定（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 02 / 13（スコープ確定） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 01 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

task-01 は 3 ファイル（CLAUDE.md edit / specs/00-overview.md edit / SCOPE.md new）を編集し、後続 task-02..22 が共通参照する scope gate を立てる docs-only タスク。本 Phase ではその「含む / 含まない / 前提 / 制約」を表形式で固定する。

---

## 1. 目的

Phase 01 で確定した 19 routes / 3 合意 / docs-only 種別を踏まえ、task-01 の **物理的な変更スコープ**（どのファイルを触り、どのファイルに触らないか）を確定する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- 含むファイル 3 件・触らないファイル群が明示される
- 19 routes 内訳（6+2+8+3=19）が再固定される
- 上流ブロッカー 0 件が再明記される（gate 重複明記ルール）

### 2.2 非ゴール

- 差分文面の確定（Phase 06）
- API mapping 詳細（Phase 03 で参照のみ）
- コード変更（task 全体で 0 件）

---

## 3. 入力

- `phase-01.md`（AC-1〜AC-5）
- task-01 §3 / §5 / §8（変更対象ファイル）
- `outputs/phase-2/phase-2.md` §3（DAG 座標）

---

## 4. 出力

- 本 phase-02.md（スコープ確定文書）
- 含む / 含まない 表（§5）
- 19 routes 内訳表（§6）
- 依存順序明記（§7）

---

## 5. 含む / 含まない

### 5.1 含むファイル（3 件）

| path | 種別 | 概要 | Phase 06 差分定義箇所 |
|------|------|------|----------------------|
| `CLAUDE.md` | edit | 「UI prototype alignment / MVP recovery」セクション追記（19 routes / 3 不変条件 / 正本順位） | task-01 §5.1 |
| `docs/00-getting-started-manual/specs/00-overview.md` | edit | 末尾に「画面一覧（19 routes）と API mapping」節追加 | task-01 §5.2 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | new | §1 routes / §2 API mapping / §3 不変条件 / §4 正本順位 / §5 後続導線 | task-01 §5.3 |

### 5.2 触らないファイル群（明示除外）

| 範囲 | 理由 |
|------|------|
| `apps/web/**` | task-09 以降の責務（本タスクは docs only） |
| `apps/api/**` | 既存 API のみ接続（追加・変更禁止） |
| `packages/**` | 共有型・shared schema は task-10 以降 |
| `apps/api/migrations/*.sql` | D1 schema 不変条件 |
| `outputs/phase-{1,2,3}/phase-N.md` | 確定済 / 触らない（task-01 §5 注） |
| `docs/00-getting-started-manual/specs/0[1-9]-*.md` 等 | 00-overview.md 以外の specs は本タスク責務外 |
| `docs/00-getting-started-manual/claude-design-prototype/**` | プロトタイプ正本（不変） |

---

## 6. 19 routes 内訳（再固定）

| 層 | 数 | routes 内訳 |
|----|----|------------|
| 公開 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | 2 | `/login`, `/profile` |
| 管理 | 8 | `/(admin)/admin`, `/(admin)/admin/members`, `/(admin)/admin/tags`, `/(admin)/admin/meetings`, `/(admin)/admin/schema`, `/(admin)/admin/requests`, `/(admin)/admin/identity-conflicts`, `/(admin)/admin/audit` |
| 共通 | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx` |
| **合計** | **19** | 6 + 2 + 8 + 3 = 19（検算） |

---

## 7. 依存順序（gate 重複明記）

- **依存元（前提完了）**: なし。本タスクは workflow 全体の最初の wave (W1)。
- **依存先（このタスク完了で着手可）**: task-02..22 の 21 タスク全て。
- **並列性**: W1 単独。task-01 完了まで W2 を起動しない。
- **DAG 詳細**: `outputs/phase-2/phase-2.md` §3。

> Phase 01 §6 AC-5 / Phase 03 §NO-GO 条件で同じブロッカーを重複明記する（spec-creator skill: gate 重複明記ルール）。

---

## 8. 前提・制約

| 区分 | 内容 |
|------|------|
| 前提 | CLAUDE.md / specs/00-overview.md が編集可能な状態（branch protection 抵触なし） |
| 前提 | 後続 task が `[SCOPE.md](../SCOPE.md)` 相対パスで参照可能なディレクトリ構造（`01-scope/` 配下から `../SCOPE.md` で解決） |
| 制約 | コード変更ゼロ（`apps/`, `packages/` への diff があれば NO-GO） |
| 制約 | phase-{1,2,3}.md には触らない（既に確定済み） |
| 制約 | CLAUDE.md 既存セクション（スタック・主要ディレクトリ・フォーム固定値・参照ドキュメント等）を破壊しない |

---

## 9. プロトタイプ参照表

本 Phase は scope 確定のため画面実装はしないが、scope 内に「prototype をデザイン言語の正本として明示する」文面が含まれるため、参照先を固定する。

| 影響画面 | prototype ファイル | 行範囲 | 用途 |
|---------|------------------|--------|------|
| 全画面（OKLch token 参照根拠） | `styles.css` | L1-70 | SCOPE.md §3 不変条件 #3「OKLch トークン正本化」の参照先 |
| 全画面（primitive 参照根拠） | `primitives.jsx` | L1-272 | SCOPE.md §3 不変条件 #5「新 primitive を生やさない」の参照先 |
| 公開層 mock | `pages-public.jsx` | L1-472 | SCOPE.md §1 「プロトタイプ掲載: 有」の根拠 |
| 会員層 mock | `pages-member.jsx` | L1-373 | 同上 |
| 管理層 mock | `pages-admin.jsx` | L1-658 | 同上（部分掲載） |

---

## 10. リスク / 注意

| リスク | 緩和 |
|-------|------|
| 「触らないファイル」への意図しない diff 混入 | Phase 11 で `git diff --stat` を確認し、正本 docs / task package / approved archive 以外があれば FAIL |
| 19 routes の数値ドリフト | Phase 06 / 10 で再検算 |
| 後続 task の相対パス解決失敗（SCOPE.md の配置位置誤り） | Phase 06 で `ls` 検証 |

---

## 11. 完了条件（Phase 03 へ進む gate）

- [ ] 含む 3 ファイル / 触らない範囲が表として固定
- [ ] 19 routes 内訳が再固定
- [ ] 依存 0 件 / W1 単独 wave が明記
- [ ] phase-01 AC-2 / AC-5 と整合

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-01 scope gate の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化の要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照先 |
| workflow 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1 -> W7 DAG |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-02.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
