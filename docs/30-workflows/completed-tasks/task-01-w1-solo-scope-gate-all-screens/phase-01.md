# Phase 01: 要件定義（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 01 / 13（要件定義） |
| 推定工数 | 0.05 人日（全体 0.5 人日のうち 10%） |
| 依存 Phase | なし（最初の Phase） |
| 並列性 | 不可（後続 Phase 02 以降の前提） |
| タスク種別 | `docs-only`（CLAUDE.md / specs / SCOPE.md の 3 ファイル編集のみ・コード変更ゼロ） |
| visualEvidence | `NON_VISUAL`（Phase 11 で screenshot 不要・docs walkthrough で代替） |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

### 0.1 上位ゴール

UI prototype alignment / MVP recovery ワークフロー全体の上位ゴールは、UBM 兵庫支部会メンバーサイトの**全 19 routes**（公開 6 / 会員 2 / 管理 8 / 共通 3）を OKLch トークンで正本化されたデザイン言語の下で稼働させること。本タスク（task-01）はその先行ゲートとして、**「全画面実装スコープ」「既存 API のみ接続」「OKLch トークン正本化」の 3 合意**を CLAUDE.md / specs/00-overview.md / SCOPE.md の 3 ファイルに明文化することが単一責務である。

### 0.2 本 Phase の責務

Phase 01 は **要件定義**。task-01 が満たすべき AC（受入基準）の番号付け、ユビキタス言語の確定、19 routes スコープの数値固定、3 合意の文言確定を行う。コード差分・画面実装・primitives 設計には踏み込まない。

### 0.3 本 Phase の出力

本 Phase そのものは仕様書ファイル `phase-01.md`（本ファイル）の確定が成果物。task-01 全体の outputs は Phase 04 以降で生成する。

---

## 1. 目的

task-01 は 19 routes / 既存 API のみ / OKLch 正本化の 3 合意を文書化する **scope gate task**。Phase 01 ではこの 3 合意を「AC（acceptance criteria）」として番号付けし、後続 Phase が参照可能な形で固定する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール（AC）

- **AC-1**: task-01 の AC（G-01〜G-05）が `01-scope/task-01-w1-solo-scope-gate-all-screens.md` §2.1 と完全一致して再列挙される。
- **AC-2**: 19 routes の内訳（公開 6 / 会員 2 / 管理 8 / 共通 3）が phase-01 内で固定され、後続 Phase で参照可能。
- **AC-3**: ユビキタス言語（「全画面スコープ」「OKLch トークン正本化」「既存 API のみ接続」「正本順位」）が定義される。
- **AC-4**: タスク種別が `docs-only` / `NON_VISUAL` であることが明記される（Phase 11 evidence テンプレ分岐の根拠）。
- **AC-5**: 上流ブロッカー（依存 0 件）が明示される（Phase 02 / Phase 03 でも重複明記する gate 重複明記ルール準拠）。

### 2.2 非ゴール

- 設計レベルの差分文面（Phase 06 で扱う）
- 画面別 component 設計（task-10 / task-11..17 の責務）
- 検証コマンドの実行（Phase 07 / Phase 11 の責務）

---

## 3. 入力（このフェーズで読むもの）

| 入力 | パス | 用途 |
|------|------|------|
| task-01 仕様書本体 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | AC・対象ファイル・3 合意の正本 |
| 上位 phase-1 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` | 19 routes 確定根拠（§2.2） |
| 上位 phase-2 | `outputs/phase-2/phase-2.md` | DAG 上の本タスク座標（W1 単独 wave） |
| 上位 phase-3 | `outputs/phase-3/phase-3.md` | API mapping 詳細（後段 Phase で参照） |
| プロトタイプ styles.css | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-70 | OKLch トークン正本（要件定義段階で「色は OKLch」を確定する根拠） |
| CLAUDE.md | リポジトリ root | 既存不変条件 6 項目（本タスクで触らないもの） |

---

## 4. 出力（このフェーズで作るもの）

- 本ファイル `phase-01.md`（要件定義の確定）
- AC-1〜AC-5（番号付き受入基準）
- ユビキタス言語表（§5）

> 本 Phase ではコード差分・docs 差分は生成しない。差分文面の確定は Phase 06 で行う。

---

## 5. ユビキタス言語（このタスク確定定義）

| 用語 | 定義 |
|------|------|
| 全画面スコープ | 公開 6 + 会員 2 + 管理 8 + 共通 3 = 計 19 routes。旧 MVP 4 画面から拡張済み |
| OKLch トークン正本化 | `claude-design-prototype/styles.css` L1-70 の `:root` 定義（`--bg`, `--accent`, `--ok`, `--warn`, `--danger`, `--info` ほか）を task-09 で `apps/web/src/styles/tokens.css` に転記し、`@theme` bridge で Tailwind に流す |
| 既存 API のみ接続 | `apps/api/src/routes/` 配下の現行 endpoint surface 内で UI 実装が完結。新 endpoint・D1 schema 変更・Google Form 改変は禁止 |
| 正本順位 | `SCOPE.md` > `outputs/phase-{1,2,3}.md` > `specs/*.md` > `claude-design-prototype/`。衝突時は上位採用 |
| プロトタイプ正本 | `claude-design-prototype/{styles.css,primitives.jsx,pages-*.jsx}` が**デザイン言語**（OKLch tokens / 13 primitives / レイアウトリズム）の正本 |

---

## 6. 受入基準（AC 詳細）

| ID | 内容 | 検証 Phase |
|----|------|-----------|
| AC-1 | task-01 §2.1 の G-01〜G-05 が phase-01 / phase-10 で再列挙され同一文言を維持 | Phase 10 |
| AC-2 | 19 routes 内訳が公開 6 / 会員 2 / 管理 8 / 共通 3 で固定（合計検算 6+2+8+3=19） | Phase 02 |
| AC-3 | ユビキタス言語 5 項目が phase-01 §5 に表として存在 | Phase 03 |
| AC-4 | `docs-only` / `NON_VISUAL` のタスク種別がメタ情報に明記 | Phase 11（evidence 分岐の根拠） |
| AC-5 | 上流ブロッカー 0 件であることが明示され、Phase 02 §依存順序 / Phase 03 §NO-GO 条件で重複明記される | Phase 03 |

---

## 7. 完了条件（Phase 02 へ進む gate）

- [ ] phase-01.md が本テンプレで配置済み
- [ ] AC-1〜AC-5 が番号付きで本文に存在
- [ ] ユビキタス言語表が確定
- [ ] 19 routes の内訳数値が固定（6+2+8+3=19）
- [ ] task-01 §2.1 の G-01〜G-05 と本 phase の AC-1 が integrity を保つ

---

## 8. プロトタイプ参照表（必須）

> Phase 01 は要件定義のため画面実装は行わないが、**「OKLch トークン正本化」要件の根拠となる prototype の該当箇所**を以下に固定する。後続 Phase / 後続 task で同じ token を参照する際の起点となる。

| 影響画面 | prototype ファイル | 行範囲 | primitive / token |
|---------|------------------|--------|-------------------|
| 全画面共通（色トークン） | `claude-design-prototype/styles.css` | L1-70 | `:root` の 23 トークン（`--bg`, `--bg-2`, `--panel`, `--panel-2`, `--border`, `--border-2`, `--text`, `--text-2`, `--text-3`, `--accent`, `--accent-soft`, `--accent-ink`, `--ok`, `--ok-soft`, `--warn`, `--warn-soft`, `--danger`, `--danger-soft`, `--info`, `--info-soft`, `--shadow-{xs,sm,md,lg}`, `--r-{sm,md,lg,xl,2xl}`, `--font-*`） |
| theme variant warm | `styles.css` | L42-55 | `[data-theme="warm"]` 上書き |
| theme variant cool | `styles.css` | L57-70 | `[data-theme="cool"]` 上書き |
| primitive 一覧（task-10 で確定する 13 primitive の起点） | `claude-design-prototype/primitives.jsx` | L1-272 | `Chip`, `Avatar`, `Button`, `Switch`, `Segmented`, `Field`, `Input`, `Textarea`, `Select`, `Search`, `Drawer`, `Modal`, `Toast`, `KVList`, `LinkPills` |
| 画面層別 entrypoint | `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` | 各ファイル冒頭 | `LandingPage` / `MemberListPage` / `MemberDetailPage` / `LoginPage` / `MyProfilePage` / `AdminDashboardPage` / `AdminMembersPage` / `AdminTagsPage` / `SchemaDiffPage` |

> **将来 phase / 後続 task が新画面を作る際**、本表の primitive と OKLch token の組み合わせを土台とすること。新 primitive を生やす提案が出た場合は、まず本表 13 primitive で表現可能か再検討する（CLAUDE.md 不変条件 #9）。

---

## 9. リスク / 注意

| リスク | 影響 | 緩和 |
|-------|------|------|
| 19 routes 数値の drift（後続 task で 18 / 20 と書かれる） | mapping 表崩壊 | 各 phase §2 で 6+2+8+3=19 を再検算 |
| `docs-only` 判定漏れによる Phase 11 で screenshot 強制 | false fail | メタ情報に `NON_VISUAL` 明記 + Phase 11 で再判定 |
| AC-1 と task-01 §2.1 の文言ドリフト | DoD 不整合 | Phase 10 レビューで grep 照合 |

---

## 10. 次 Phase への引き渡し

Phase 02（スコープ確定）は本 phase の AC-2（19 routes 固定）を入力として、含む / 含まない / 前提 / 制約を表形式で固定する。

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-01.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
