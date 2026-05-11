# COMPLETED: task-10 runtime visual + axe evidence 取得 - タスク指示書

2026-05-11 実行済み。`docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/evidence/screenshots/task10-ui-primitives-runtime.png` と `axe-report.json` に runtime screenshot / axe evidence を保存した。実行 spec は `apps/web/playwright/tests/task10-ui-primitives.spec.ts`、検証 route は `/smoke/ui-primitives`。本ファイルは履歴として残し、追加の未タスク化は不要。

## メタ情報

| 項目         | 内容                                                            |
| ------------ | --------------------------------------------------------------- |
| タスクID     | task-10-followup-002-runtime-visual-axe-evidence                |
| Issue        | #610                                                            |
| タスク名     | task-10 UI primitives の runtime screenshot / axe 取得          |
| 分類         | 検証                                                            |
| 対象機能     | `apps/web/src/components/ui/` 11 primitive                      |
| 優先度       | 中                                                              |
| 見積もり規模 | 小規模                                                          |
| ステータス   | 完了（2026-05-11）                                             |
| 発見元       | task-10-ui-primitives-spec / Phase 11 (VISUAL_ON_EXECUTION)     |
| 発見日       | 2026-05-09                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

task-10 は `VISUAL_ON_EXECUTION` 境界で、Phase 11 で runtime screenshot / axe を取得する規約。しかし `build:cloudflare` blocker（task-10-followup-001）により runtime evidence が取れず、Phase 11 ledger には local quality PASS のみが記録された状態で workflow を closed。

### 1.2 問題点・課題

- 11 primitive (Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner) の runtime レンダ確認が pending
- axe (a11y) チェックが未実施
- Phase 13 (PR) の最終 evidence パッケージに視覚検証が欠ける

### 1.3 放置した場合の影響

- 下流 task-11..17 が primitive を import した時点で初めて視覚的崩れに気付く事故リスク
- a11y (`role`、`aria-*`) の実 DOM 検証が無いと regression 検知が遅れる

---

## 2. 何を達成するか（What）

### 2.1 目的

11 primitive すべての runtime screenshot と axe レポートを取得し、task-10 の `VISUAL_ON_EXECUTION` evidence を完結させる。

### 2.2 最終ゴール

- 各 primitive の代表 variant について screenshot を取得
- axe で violations 0 件（または既知 issue のみ）を確認
- evidence を `task-10-ui-primitives-spec/outputs/phase-11/evidence/` 配下にアーカイブ

### 2.3 スコープ

#### 含むもの

- runtime での 11 primitive レンダリング
- screenshot 取得
- axe スキャン
- evidence アーカイブ

#### 含まないもの

- primitive 実装変更
- 新規 primitive 追加
- visual regression test の継続的 CI gate 化（別 issue 範囲）

### 2.4 成果物

- `outputs/phase-11/evidence/screenshots/` 配下の画像
- `outputs/phase-11/evidence/axe-report.json`
- evidence index への参照追加

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- task-10-followup-001 (esbuild mismatch) が解消済み
- `mise exec -- pnpm --filter @repo/web build:cloudflare` が PASS
- `mise exec -- pnpm --filter @repo/web dev` または `wrangler dev` で起動できる

### 3.2 依存タスク

- **task-10-followup-001 が完了している必要がある（必須前提）**

### 3.3 必要な知識

- axe-core の使い方
- Playwright もしくは Storybook + chromatic 系 tool の選択
- Cloudflare Workers の dev サーバ起動

### 3.4 推奨アプローチ

1. すでに本 repo に存在する visual / a11y tooling を `pnpm` scripts から確認する。
2. 11 primitive を 1 ページにまとめた検証ページ（既存があれば再利用）でレンダ。
3. Playwright + axe-core でスクリーンショットと a11y レポートを同時取得。
4. evidence を task-10 spec に追記し、Phase 11 ledger を `runtime-evidence-captured` に更新。

---

## 4. 実行手順

### Phase 構成

1. tooling 確認と検証ページ準備
2. screenshot 取得
3. axe スキャン
4. evidence アーカイブと spec 更新

### Phase 1: tooling 確認と検証ページ準備

#### 目的

すでに使える visual / a11y tool を再利用する。

#### 手順

1. `apps/web/package.json` の scripts を確認
2. 既存の primitive 検証ページが無ければ最小ページを追加
3. axe-core / Playwright の依存を確認

#### 完了条件

検証ページが localhost で開ける

### Phase 2: screenshot 取得

#### 目的

11 primitive の代表 variant を画像化する。

#### 手順

1. Playwright で各 primitive variant のスクショを取得
2. `outputs/phase-11/evidence/screenshots/` に保存

#### 完了条件

primitive × 主要 variant の screenshot が揃っている

### Phase 3: axe スキャン

#### 目的

a11y violations を確認する。

#### 手順

1. axe-core を検証ページに対して実行
2. レポートを JSON 出力

#### 完了条件

violations が 0 件、または既知 issue のみで内訳が記録されている

### Phase 4: evidence アーカイブと spec 更新

#### 目的

task-10 spec の Phase 11 ledger を完結させる。

#### 手順

1. evidence を spec 配下にコピー
2. `outputs/phase-11/main.md` に取得済みステータスを反映
3. `workflow_state` を `implemented-local-build-blocked` から `runtime-evidence-captured` 等の妥当な状態語へ更新

#### 完了条件

Phase 11 ledger が runtime evidence を含んだ完全形になっている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 11 primitive のスクリーンショットが揃っている
- [ ] axe レポートが取得済み
- [ ] task-10 spec の Phase 11 ledger が更新済み

### 品質要件

- [ ] axe violations が 0 件、または既知例外のみ
- [ ] スクリーンショット差分から明らかな崩れが無い

### ドキュメント要件

- [ ] `outputs/phase-11/evidence/` の index 更新
- [ ] `aiworkflow-requirements/references/ui-ux-components.md` に evidence reference を追記（必要に応じて）

---

## 6. 検証方法

### テストケース

- 各 primitive がデフォルト + 主要 variant でレンダされる
- `role="alert"` / `role="status"` 等の ARIA 属性が DOM に出力される
- axe violations 0

### 検証手順

```bash
mise exec -- pnpm --filter @repo/web build:cloudflare
mise exec -- pnpm --filter @repo/web dev
# 別タブで Playwright + axe 実行
```

---

## 7. リスクと対策

| リスク                                                  | 影響度 | 発生確率 | 対策                                                       |
| ------------------------------------------------------- | ------ | -------- | ---------------------------------------------------------- |
| token (OKLch) の Workers 環境での再現性差異             | 中     | 中       | dev / preview / production で同条件で確認、差異を記録      |
| axe が誤検知して既存 design token と衝突               | 低     | 中       | 既知 violations を allowlist で明示                        |
| Playwright / axe の依存追加で `build:cloudflare` 再 fail | 中     | 低       | devDependencies に閉じ込め、prod bundle 影響を確認         |

---

## 8. 苦戦箇所メモ（再発防止）

- `VISUAL_ON_EXECUTION` 境界の task は build まで通らないと visual evidence が取れない構造のため、task 分割時に「local-only PASS」と「runtime PASS」の 2 段階で workflow_state を設計しておくべき。
- task-10 では `implemented-local-build-blocked` という新しい workflow_state を導入したが、後続 visual 取得 task が暗黙的に必要になることが Phase 12 detection で見落とされやすい（実際 detection は 0 件と判定したが、再検証で浮上した）。

---

## 9. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-10-ui-primitives-spec/outputs/phase-11/main.md`
- `docs/30-workflows/task-10-ui-primitives-spec/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md`

### 関連 issue / task

- task-10-followup-001-opennext-esbuild-mismatch（必須前提）
- task-10-ui-primitives-spec（親 workflow）
- ui-prototype-alignment-mvp-recovery / task-11..17（下流の同種 evidence 取得）
