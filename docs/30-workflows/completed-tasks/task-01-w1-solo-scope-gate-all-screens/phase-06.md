# Phase 06: 実装計画（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 06 / 13（実装計画） |
| 推定工数 | 0.30 人日（ST-A 0.15 + ST-B 0.10 + ST-C 0.05） |
| 依存 Phase | Phase 01..05 |
| 並列性 | ST-A / ST-B / ST-C 並列可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |

---

## 0. 自己完結コンテキスト

task-01 §5.1〜§5.3 の差分文面を **そのまま** 3 ファイルに適用する。本 Phase はその実行手順・対象ファイル・差分方針を確定する。コード変更ゼロ。

---

## 1. 目的

ST-A / ST-B / ST-C の各サブタスクで、どのファイルにどの文面をどの位置に適用するかを **完全な差分文面** として確定する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- ST-A: SCOPE.md の完全骨子（§1〜§5）が文面として記述される
- ST-B: CLAUDE.md 追記文面が確定（task-01 §5.1 と完全一致）
- ST-C: specs/00-overview.md 追記文面が確定（task-01 §5.2 と完全一致）
- 各差分の挿入位置・前後文脈が明記

### 2.2 非ゴール

- 検証コマンド実行（Phase 07 / Phase 11）
- 文面の意味的レビュー（Phase 03 で確定済）

---

## 3. 入力

| 入力 | 用途 |
|------|------|
| task-01 §5.1 | CLAUDE.md 追記文面（正本） |
| task-01 §5.2 | specs 追記文面（正本） |
| task-01 §5.3 | SCOPE.md 骨子（正本） |
| Phase 03 §6 | 追記アンカー位置 |
| Phase 04 §3 | サブタスク分割 |

---

## 4. 出力

- 本 phase-06.md（実装計画）
- 各 subtask の差分手順 table（§5）
- 適用後の検算手順（§6）

---

## 5. 実装手順（subtask 別）

### 5.1 ST-A: SCOPE.md 新規作成

| step | アクション | 期待結果 |
|------|----------|---------|
| A-1 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` を Write tool で新規作成 | ファイル生成 |
| A-2 | 冒頭に `# UI prototype alignment / MVP recovery — SCOPE` H1 と 改訂日 / 正本順位 1 行を配置 | header 確定 |
| A-3 | §1 全画面実装スコープ（19 routes 表）を task-01 §5.3 骨子と完全一致で記載 | 19 行表 |
| A-4 | §2 API 接続マッピング要約を 13 行表（公開トップ / 公開一覧 / register / login / profile / dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit / 共通）で記載 | 13 行表 |
| A-5 | §3 不変条件 6 項目（既存 API のみ / D1・Form 不変 / OKLch / D1 binding 禁止 / 新 primitive 禁止 / shape 乖離 adapter） | 番号付き 6 項目 |
| A-6 | §4 正本順位 4 段階を ordered list で記載 | 4 行 |
| A-7 | §5 後続タスク導線表（責務 dir × tasks × 依存）を 8 行で記載 | 8 行表 |

### 5.2 ST-B: CLAUDE.md セクション追記

| step | アクション | 期待結果 |
|------|----------|---------|
| B-1 | `CLAUDE.md` を Read で読み込み、`## 参照ドキュメント` の行番号を特定 | アンカー位置確定 |
| B-2 | `## 参照ドキュメント` の直前に `---` 区切り + `## UI prototype alignment / MVP recovery（進行中ワークフロー）` セクションを Edit tool で挿入 | セクション追加 |
| B-3 | 挿入内容: スコープ表（4 行） / 不変条件 4 項目（番号付き） / 正本順位 4 段階（ordered list） / shape 乖離 adapter 注 | task-01 §5.1 完全一致 |
| B-4 | 既存セクションを破壊していないことを `git diff CLAUDE.md` で確認 | 追加行のみ |

### 5.3 ST-C: specs/00-overview.md 末尾追記

| step | アクション | 期待結果 |
|------|----------|---------|
| C-1 | `docs/00-getting-started-manual/specs/00-overview.md` を Read で末尾を確認 | 既存末尾確定 |
| C-2 | ファイル末尾に `---` + `## 画面一覧（19 routes）と API mapping` セクションを Edit tool で追加 | セクション追加 |
| C-3 | 内容: SCOPE.md / phase-3 §2 / phase-1 §1〜§3 への参照リンク 3 行 + 層別 routes 早見 4 行 + API 接続不変条件 3 行 | task-01 §5.2 完全一致 |
| C-4 | 既存 overview 本文（システム構成・3 層モデル等）が無傷であることを `git diff` で確認 | 追加行のみ |

---

## 6. 適用後の検算手順

```bash
# A. 3 ファイル存在 / 種別確認
test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # new
git diff --stat CLAUDE.md docs/00-getting-started-manual/specs/00-overview.md   # edit のみ

# B. 文言一致確認
grep -c "^| 公開 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # 6 期待
grep -c "^| 会員 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # 2 期待
grep -c "^| 管理 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # 8 期待
grep -c "^| 共通 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # 3 期待

grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md   # 1 件以上
grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md   # 1 件以上

# C. CLAUDE.md 既存セクション無傷確認
grep -c "^## " CLAUDE.md   # 既存セクション数 + 1 になっているか
```

---

## 7. プロトタイプ参照表（差分文面に含まれる prototype 参照）

| 差分箇所 | prototype ファイル | 行範囲 | token / primitive |
|---------|------------------|--------|-------------------|
| SCOPE.md §3 不変条件 #3「OKLch トークン正本化」 | `styles.css` | L1-70 | `:root` 23 トークン（`--accent` / `--ok` / `--warn` / `--danger` / `--info` 系） |
| SCOPE.md §3 不変条件 #5「新 primitive を生やさない」 | `primitives.jsx` | L1-272 | 13 primitive |
| SCOPE.md §1 「プロトタイプ掲載: 有」根拠 | `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` | 各冒頭 | `LandingPage` L4 / `LoginPage` L4 / `AdminDashboardPage` L4 ほか |
| CLAUDE.md 不変条件 #2 OKLch 言及 | `styles.css` | L12-22 | `oklch(0.58 0.10 55)` 等 |

> 後続タスクが prototype の特定行・特定 token を参照する際の **起点 anchor** として、本表を SCOPE.md §3 に間接リンク化することを推奨（将来改善）。

---

## 8. 差分の最小性原則

- CLAUDE.md / specs は **追記のみ**。既存行の削除・並べ替え禁止
- SCOPE.md は new file のため既存衝突なし
- `git diff --stat` で正本 docs / task package / approved archive 以外の変更が検出されたら NO-GO
- 自動生成物（lockfile / dist）への意図せぬ touch は revert

---

## 9. リスク

| リスク | 緩和 |
|-------|------|
| `## 参照ドキュメント` の前に他セクションが挿入されていて位置がずれる | B-1 で行番号を grep で動的取得 |
| markdown table 列数ミスで lint fail | A-3〜A-7 の各表を Phase 07 で `pnpm lint` 検証 |
| 後続 task の相対パス `../SCOPE.md` 解決失敗 | A-1 で workflow root 直下配置を厳守 |

---

## 10. 完了条件（Phase 07 へ進む gate）

- [ ] ST-A 7 step / ST-B 4 step / ST-C 4 step が文書化
- [ ] 検算手順が実行可能なコマンドとして列挙
- [ ] 差分文面が task-01 §5.1〜§5.3 と整合
- [ ] プロトタイプ参照表が SCOPE.md §3 と整合

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-06.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
