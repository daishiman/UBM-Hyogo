# Phase 11: 実行検証 / エビデンス（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 11 / 13（実行検証 / evidence） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 01..10 |
| タスク種別 | `docs-only` / `NON_VISUAL` |
| visualEvidence | `NON_VISUAL`（screenshot 不要 / docs walkthrough で代替） |
| spec_created vs completed | `spec_created`（docs 編集完了をもって完了。runtime evidence なし） |

---

## 0. 自己完結コンテキスト

task-01 はコード変更ゼロ・UI なしのため、Phase 11 は **NON_VISUAL 縮約テンプレ** に従う（phase-template-phase11.md `## docs-only / NON_VISUAL 縮約テンプレ`）。screenshot は生成禁止（false green 防止）。代わりに以下 3 ファイルで evidence を残す。

---

## 1. 目的

Phase 07 / Phase 10 で定義した検証コマンド・DoD を実際に実行し、結果を `outputs/phase-11/` 配下に evidence として記録する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- `outputs/phase-11/main.md` 作成（NON_VISUAL / docs walkthrough 種別を明記）
- `outputs/phase-11/manual-smoke-log.md` 作成（実行コマンド / 期待 / 実測 / PASS/FAIL）
- `outputs/phase-11/link-checklist.md` 作成（リンク到達性 OK/Broken）
- DoD §3 全項目が PASS で記録

### 2.2 非ゴール

- screenshot 生成（NON_VISUAL のため禁止）
- Playwright smoke（task-18）
- runtime mutation（cloud deploy 等は本タスク範囲外）

---

## 3. 必須 outputs（NON_VISUAL 3 点）

> phase-template-phase11.md `## docs-only / NON_VISUAL 縮約テンプレ` に準拠。

| ファイル | 役割 | 最小フォーマット |
|---------|------|----------------|
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式 = NON_VISUAL / docs walkthrough、発火条件、必須 outputs 一覧、第一適用例参照 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / mapping 整合の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」表 |
| `outputs/phase-11/link-checklist.md` | SCOPE.md / CLAUDE.md / specs から各リンク先への到達性 | 「参照元 → 参照先 / 状態（OK / Broken）」表 |

> VISUAL タスクの outputs（manual-test-checklist.md / manual-test-result.md / discovered-issues.md / screenshot-plan.json）は本タスクでは作成しない。

---

## 4. main.md 必須記載項目

```markdown
# Phase 11 — task-01-w1-solo-scope-gate-all-screens

## テスト方式
- visualEvidence: NON_VISUAL
- 種別: docs walkthrough（`spec_created`）
- screenshot: 不要（false green 防止のため生成禁止）

## 発火条件
- artifacts.json.metadata.visualEvidence == "NON_VISUAL"
- task は CLAUDE.md / specs / SCOPE.md の 3 ファイル docs 編集のみ・コード変更ゼロ

## 必須 outputs
- manual-smoke-log.md
- link-checklist.md

## 第一適用例
- ut-gov-005-docs-only-nonvisual-template-skill-sync の outputs/phase-11/

## 状態
- spec_created（docs 編集完了 = タスク完了。runtime evidence は N/A）
```

---

## 5. manual-smoke-log.md 必須項目

| # | 実行コマンド | 期待結果 | 実測 | PASS / FAIL |
|---|-------------|---------|------|-------------|
| 1 | `test -f CLAUDE.md && test -f docs/00-getting-started-manual/specs/00-overview.md && test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | exit 0 | （実行時記入） | |
| 2 | `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` | 1 行以上 | | |
| 3 | `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` | 1 行以上 | | |
| 4 | `grep -cE "^\| (公開\|会員\|管理\|共通) \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 19 | | |
| 5 | `grep -c "^\| 公開 \|" SCOPE.md` | 6 | | |
| 6 | `grep -c "^\| 会員 \|" SCOPE.md` | 2 | | |
| 7 | `grep -c "^\| 管理 \|" SCOPE.md` | 8 | | |
| 8 | `grep -c "^\| 共通 \|" SCOPE.md` | 3 | | |
| 9 | `mise exec -- pnpm lint` | exit 0 | | |
| 10 | `git diff --name-status main...HEAD` | 正本 docs / task package / approved archive のみ、apps/packages 変更 0 | | |

### 必須メタ

- 証跡の主ソース: コマンド実出力（stdout）
- screenshot を作らない理由: `NON_VISUAL` / `docs-only` / `spec_created`
- 実行日時 / 実行者（worktree なら branch 名）

---

## 6. link-checklist.md 必須項目

| 参照元 | 参照先 | 状態 |
|-------|-------|------|
| SCOPE.md §1 行末リンク | `outputs/phase-1/phase-1.md` §2.2 | OK / Broken |
| SCOPE.md §2 行末リンク | `outputs/phase-3/phase-3.md` §2 | |
| SCOPE.md §5 行末リンク | `outputs/phase-2/phase-2.md` §3 | |
| CLAUDE.md 追記内リンク | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` | |
| specs/00-overview.md 追記内 SCOPE.md リンク | `../../30-workflows/.../SCOPE.md` | |
| specs/00-overview.md 追記内 phase-3 リンク | `../../30-workflows/.../outputs/phase-3/phase-3.md` | |
| specs/00-overview.md 追記内 phase-1 リンク | `../../30-workflows/.../outputs/phase-1/phase-1.md` | |
| 後続 task の `../SCOPE.md` 想定解決 | `01-scope/` → `../SCOPE.md` = `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | |

### prototype 参照リンクチェック

- [ ] `styles.css` L1-70 が現存（OKLch token 23 件）
- [ ] `primitives.jsx` L1-272 が現存（13 primitive）
- [ ] `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` が現存

---

## 7. 状態語彙

本タスクは `taskType=docs-only` / `visualEvidence=NON_VISUAL` のため、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 系の語彙は使用しない。代わりに以下を使う:

- **PASS**: §5 / §6 全項目が PASS
- **PARTIAL**: 一部 FAIL（修正後再実行）
- **FAIL**: 重大ブロッカー（Phase 06 へ差し戻し）

---

## 8. プロトタイプ参照表

| 確認項目 | prototype ファイル | 行 | 確認方法 |
|---------|------------------|---|----------|
| OKLch token 正本存在 | `styles.css` | L1-70 | `grep -c "oklch" docs/00-getting-started-manual/claude-design-prototype/styles.css` >= 10 |
| 13 primitive 正本存在 | `primitives.jsx` | L5-248 | `grep -cE "^const (Chip\|Avatar\|Button\|Switch\|Segmented\|Field\|Input\|Textarea\|Select\|Search\|Drawer\|Modal\|Toast\|KVList\|LinkPills) " primitives.jsx` >= 13 |
| 公開層 mock | `pages-public.jsx` | L4 / L208 / L339 | `grep -E "^const (LandingPage\|MemberListPage\|MemberDetailPage)" pages-public.jsx` |
| 会員層 mock | `pages-member.jsx` | L4 / L220 | `grep -E "^const (LoginPage\|MyProfilePage)" pages-member.jsx` |
| 管理層 mock | `pages-admin.jsx` | L4 / L162 / L369 / L508 | `grep -E "^const (AdminDashboardPage\|AdminMembersPage\|AdminTagsPage\|SchemaDiffPage)" pages-admin.jsx` |

---

## 9. coverage AC 適用外（再記載）

phase-template-core.md `## 共通ルール` 6 項に従い、本タスクは以下理由で coverage AC 適用外:

- pure-docs タスク（code diff 0 件）
- vitest 対象なし（`.md` 編集のみ）
- `scripts/coverage-guard.sh` 実行不要

---

## 10. リスク

| リスク | 緩和 |
|-------|------|
| coverage 未取得を fail と誤判定 | §9 適用外理由を明示 |
| screenshot を作って false green | §3 で生成禁止を明記 |
| link-checklist で「OK」を目視で雑に判定 | `ls` 実行ログを併記 |

---

## 11. 完了条件（Phase 12 へ進む gate）

- [ ] `outputs/phase-11/main.md` 作成
- [ ] `outputs/phase-11/manual-smoke-log.md` 全 10 行 PASS 記録
- [ ] `outputs/phase-11/link-checklist.md` 全リンク OK
- [ ] DoD §3 全項目が evidence で実証
- [ ] 状態 = PASS

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-11.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
