# 出席ダッシュボード日本語化に伴う Playwright visual snapshot baseline の再取得 - タスク指示書

## メタ情報

```yaml
issue_number: 1223
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-attendance-dashboard-jp-clarity-followup-001-visual-baseline-recapture |
| タスク名 | 出席ダッシュボード日本語化後の authenticated staging visual snapshot baseline 再取得 |
| 分類 | 後続対応（followup） |
| 補足分類 | テスト基盤（visual regression baseline）・VISUAL |
| 対象機能 | `/(admin)/admin/dashboard/attendance` の Playwright visual snapshot |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| GitHub Issue | #1223（起票済み） |
| 発見元 | `admin-attendance-dashboard-jp-clarity-and-ux` Phase 12 unassigned-task-detection.md baseline M-2 |
| 発見日 | 2026-06-11 |
| canonical source | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`admin-attendance-dashboard-jp-clarity-and-ux` workflow で、出席ダッシュボード（`/(admin)/admin/dashboard/attendance`）の英語見出し・エンジニア専門語を非エンジニア向けの平易な日本語へ置換した（`PRIMARY`→`全体の状況`、`セッション`→`開催回`、`ユニーク出席率`→`一度でも参加した人の割合` 等）。変更は apps/web 表現層の文字列・aria-label・軽微 CSS に閉じ、API / D1 / Google Form schema / `packages/shared` 型は一切変更していない（AC-7）。

この表示文言の変更により、Playwright visual snapshot テスト（`apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` 等）が参照する snapshot baseline と実画面に**差分が必ず生じる**。親タスクでは Phase 11 にて 6 件の canonical local fixture PNG を取得済みだが、authenticated staging 環境での visual baseline 再取得は **user-gated 境界**（staging deploy / commit / PR が前提）として保留されている。

### 1.2 問題点・課題

- 出席ダッシュボードの表示文言が日本語化された結果、既存の visual snapshot baseline（英語見出し・専門語の状態）は旧表示を固定しており、現行実装と乖離する。
- visual smoke（`playwright-smoke / visual`）を新表示のまま流すと、文言差分により snapshot 比較が fail し得る。
- baseline 再取得は staging deploy 後の authenticated 環境でしか正しく行えないため、親タスクのサイクル内（local 実装サイクル）では完結できない。

### 1.3 放置した場合の影響

- 機能・データ正確性には影響しない（表示文言のみの差分）。
- 影響は visual regression テストの green/red 判定に限定される。baseline が旧文言のままだと、本来意図した日本語化が visual diff として検出され、CI が継続的に赤くなる、あるいは意図しない drift を見逃すリスクがある。
- staging deploy を伴うため user-gated。親タスク landed 前に着手しても baseline 取得対象（staging 実画面）が存在しないため意味をなさない。優先度は**低**（親タスク landed 後の整備作業）。

---

## 2. 何を達成するか（What）

### 2.1 目的

出席ダッシュボード日本語化の landed 後、staging deploy + admin 認証を経て visual snapshot baseline を新しい日本語表示で再取得し、visual smoke を新 baseline で green に戻す。

### 2.2 最終ゴール

- `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts`（および出席ダッシュボードを含む関連 visual spec）の snapshot baseline が日本語表示で更新される。
- `playwright-smoke / visual` が新 baseline で PASS する。
- baseline 差分が「文言の日本語化のみ」に起因し、レイアウト・色・DOM 構造の意図しない drift を含まないことが確認される。

### 2.3 受け入れ基準

- [ ] 出席ダッシュボードを含む visual snapshot baseline が、日本語表示（`全体の状況` / `出席の移り変わり` / `くわしい一覧` / `開催回数` / `一度でも参加した人の割合` 等）で再取得されている。
- [ ] visual smoke（`playwright-smoke / visual`）が新 baseline で PASS する。
- [ ] baseline diff が文言起因のみであり、レイアウト・色・DOM 構造の drift を含まない（AC-4 / AC-5 / AC-8 と整合）。
- [ ] 再取得は staging deploy 後の authenticated 環境で実施されている（local fixture ではなく authenticated baseline）。
- [ ] 色はすべて OKLch トークン経由（`var(--ubm-color-*)`）であり、HEX 直書きがない（`verify-design-tokens` PASS）。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` | 出席ダッシュボードの visual snapshot spec。新 baseline の再取得対象 |
| `apps/web/playwright/tests/visual/admin-shell/__snapshots__/`（または spec 隣接の snapshot 格納先） | snapshot baseline 画像の更新先 |
| `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-11/` | 親タスクの local fixture PNG（再取得時の期待表示の参照） |

### 3.2 実装方針

- 親タスク（`admin-attendance-dashboard-jp-clarity-and-ux`）が dev / staging へ landed していることを前提とする（本タスクは landed 後にのみ着手）。
- staging deploy 後、admin 認証済みコンテキストで visual spec を `--update-snapshots`（Playwright の baseline 更新モード）で再取得する。
- 再取得後、diff レビューで「文言の日本語化のみ」が差分であることを目視確認し、レイアウト・色・DOM 構造の意図しない変化がないことを担保する。
- snapshot 更新コミットは user-gated（ユーザー承認後に commit / push）。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts`
- 症状: visual snapshot baseline は authenticated staging 実画面に依存するため、親タスク landed → staging deploy が完了していない状態では baseline 再取得自体が不可能。local fixture PNG（親 Phase 11）は構図確認には使えるが、authenticated staging baseline の代替にはならない。**着手前に親タスクの landed と staging deploy 完了を必ず確認する**こと。

- 対象: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/`
- 症状: 親タスクは文言変更で「DOM 構造・testid・href・role は不変」を AC-8 として保証している。baseline diff に文言以外（レイアウトずれ・色変化）が混入していた場合、それは日本語化の副作用か別要因かの切り分けが必要。diff が想定（文言のみ）と乖離したら、安易に `--update-snapshots` で塗り潰さず、原因を特定してから baseline を確定する。

- 対象: visual smoke gate（`playwright-smoke / visual`）
- 症状: snapshot 再取得のタイミングが staging deploy とずれると、CI 上で「旧 baseline vs 新表示」または「新 baseline vs 旧デプロイ」のミスマッチが発生し fail する。baseline 更新コミットと staging deploy の順序を揃える必要がある。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 親タスク未 landed の状態で着手し、baseline 取得対象が存在しない | 中 | 着手前に親タスクの dev/staging landed と staging deploy 完了を確認する。未 landed なら本タスクは待機 |
| `--update-snapshots` で文言以外の drift を無検証に塗り潰す | 中 | 再取得後に diff を目視レビューし、文言差分のみであることを確認してから baseline を確定する |
| baseline 更新コミットと staging deploy の順序ずれで CI が fail | 低 | baseline 更新と deploy の順序を揃え、visual smoke が新旧整合した状態で green になることを確認する |
| HEX 直書き等の token gate 抵触（再取得作業に伴う付随変更で混入） | 低 | 本タスクは snapshot 画像更新のみでコード変更を伴わない想定。万一コード変更が必要なら `verify-design-tokens` をローカル実行して PASS を確認する |

---

## 検証方法

### 統合検証（VISUAL）

- staging deploy 後の authenticated 環境で visual spec を再取得する（user-gated）。

```bash
# 親タスク landed・staging deploy 後にのみ実施（user 承認後）
mise exec -- pnpm exec playwright test apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts --update-snapshots
```

期待: 出席ダッシュボードの snapshot baseline が日本語表示で更新され、再実行時に visual smoke が PASS する。

### 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
```

期待: typecheck / lint が 0 error、`verify-design-tokens` が PASS（snapshot 更新のみでコード変更がない場合は drift なし）。

### 差分レビュー

- 再取得した baseline 画像の diff を目視確認し、変化が「英語見出し・専門語 → 平易日本語」の文言差分のみであること、レイアウト・色・DOM 構造の意図しない drift がないことを確認する。

---

## スコープ

### 含む

- 出席ダッシュボードを含む visual snapshot baseline の authenticated staging 再取得。
- 再取得後の diff レビュー（文言のみの差分であることの確認）。
- visual smoke（`playwright-smoke / visual`）の新 baseline での green 化確認。

### 含まない

- 出席ダッシュボードの文言・UI ロジックの変更（親タスクで完了済み・本タスクは baseline 再取得のみ）。
- API / D1 schema / Google Form 仕様 / `packages/shared` 型の変更。
- 新規 primitive / component の追加。
- staging deploy・commit・push・PR の自動実行（すべて user-gated・ユーザー承認後にのみ実施）。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/`
- canonical source（baseline M-2）: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-12/unassigned-task-detection.md`
- 実装ガイド: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-12/implementation-guide.md`
- Phase 11 local fixture PNG: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-11/screenshots/`
- visual spec: `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts`
- GitHub Issue: #1223
