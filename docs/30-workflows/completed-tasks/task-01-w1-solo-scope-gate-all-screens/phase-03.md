# Phase 03: 設計（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 03 / 13（設計） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 01, 02 |
| 並列性 | 不可 |
| タスク種別 | `docs-only` / `NON_VISUAL` |

---

## 0. 自己完結コンテキスト

本 Phase は task-01（docs 編集タスク）の「設計」。コード設計は無いが、**SCOPE.md の章立て構造**・**CLAUDE.md / specs 追記アンカー位置**・**正本順位ルール**・**API mapping 表構造**を確定する。これらは後続 task-02..22 が grep / 相対パス参照する正本シグネチャになる。

---

## 1. 目的

3 ファイル（CLAUDE.md / specs/00-overview.md / SCOPE.md）の **構造的設計**（追記位置・章立て・表列構成・連携シグネチャ）を確定し、Phase 06（実装計画）で差分を作成可能な状態にする。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- SCOPE.md の章立て（§1〜§5）が確定
- CLAUDE.md 追記アンカーと位置（`## 参照ドキュメント` 直前）が確定
- specs/00-overview.md 追記アンカー（末尾「画面一覧（19 routes）と API mapping」）が確定
- API mapping 表の列構成が確定（後続 task が依存）
- 正本順位 4 段階が確定

### 2.2 非ゴール

- 各表のセル内容そのもの（Phase 06 で差分文面として確定）
- API endpoint の shape 詳細（`outputs/phase-3/phase-3.md` 参照のみ）

---

## 3. 入力

| 入力 | 用途 |
|------|------|
| `phase-01.md` / `phase-02.md` | AC・含むファイル |
| task-01 §0.6（連携シグネチャ） | 後続 task の参照シグネチャ正本 |
| task-01 §5.1 / §5.2 / §5.3 | 差分文面（Phase 06 で展開） |
| `outputs/phase-3/phase-3.md` §2 / §7 | API mapping の正本（SCOPE.md §2 はその要約） |
| `apps/api/src/routes/` 列挙 | 既存 endpoint surface（task-01 §0.4 参照） |

---

## 4. 出力

- SCOPE.md 章立て骨子（§5）
- CLAUDE.md / specs 追記アンカー（§6）
- 連携シグネチャ表（§7）
- 正本順位 4 段階（§8）
- NO-GO 条件（§9・gate 重複明記）

---

## 5. SCOPE.md 章立て骨子

| 章 | タイトル（厳守） | 列構成 / 必須要素 |
|----|----------------|------------------|
| §1 | `## 1. 全画面実装スコープ（19 routes）` | 表列: `\| 層 \| route \| プロトタイプ掲載 \| 設計指針 \|`。19 行（合計検算 6+2+8+3） |
| §2 | `## 2. API 接続マッピング要約` | 表列: `\| 画面群 \| 主要 endpoint \|`。詳細は phase-3 §2 へリンク |
| §3 | `## 3. 不変条件（task-02..22 共通）` | 番号付き 6 項目（既存 API のみ / D1・Form 不変 / OKLch 正本化 / D1 直接アクセス禁止 / 新 primitive 禁止 / shape 乖離は UI adapter） |
| §4 | `## 4. 正本順位` | 4 段階 ordered list |
| §5 | `## 5. 後続タスク導線` | 表列: `\| 責務 dir \| tasks \| 依存 \|`。8 dir × tasks マッピング |

---

## 6. 追記アンカー位置（不変）

### 6.1 CLAUDE.md

- 追記アンカー: `## UI prototype alignment / MVP recovery（進行中ワークフロー）`
- 挿入位置: 既存 `## 参照ドキュメント` セクション**直前**
- 触らない既存セクション: スタック / 主要ディレクトリ / フォーム固定値 / 重要な不変条件 / ブランチ戦略 / Governance / CODEOWNERS / 開発環境セットアップ / ワークツリー作成 / よく使うコマンド / PR作成の完全自律フロー / Claude Code 設定 / シークレット管理 / 参照ドキュメント

### 6.2 specs/00-overview.md

- 追記アンカー: `## 画面一覧（19 routes）と API mapping`
- 挿入位置: ファイル末尾
- 触らない範囲: 既存 overview 本文（システム構成・3 層モデル・データフロー）

### 6.3 SCOPE.md

- 配置: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`（workflow root 直下）
- 後続 task の相対パス: `01-scope/` 配下から `../SCOPE.md`、`02-runtime/` 配下からも `../SCOPE.md`

---

## 7. 連携シグネチャ（後続 task が grep / link 参照）

| シグネチャ | 値 | 参照先 |
|-----------|----|-------|
| SCOPE.md §1 列構成 | `\| 層 \| route \| プロトタイプ掲載 \| 設計指針 \|` | task-09..22 が画面の設計指針を引く |
| SCOPE.md §2 列構成 | `\| 画面群 \| 主要 endpoint \|` | task-11..17 が API 接続を引く |
| CLAUDE.md anchor | `## UI prototype alignment / MVP recovery（進行中ワークフロー）` | grep で本セクション存在確認 |
| specs anchor | `## 画面一覧（19 routes）と API mapping` | grep で 19 routes 記述確認 |
| relative path | `../SCOPE.md` | 各タスクディレクトリから 1 階層上 |

---

## 8. 正本順位（4 段階）

衝突時は上位を採用:

1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
2. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-{1,2,3}/phase-N.md`
3. `docs/00-getting-started-manual/specs/*.md`
4. `docs/00-getting-started-manual/claude-design-prototype/`

> 既存 API endpoint surface と UI 期待 shape が乖離した場合は、API を変更せず UI 側に adapter を置く（phase-1 §3 末尾方針）。本ルールも SCOPE.md §3 に明記。

---

## 9. NO-GO 条件（gate 重複明記）

以下のいずれかが真なら Phase 04 へ進まない:

- [ ] phase-01 AC-1〜AC-5 のいずれかが未確定
- [ ] phase-02 §5 含むファイル 3 件が決まっていない
- [ ] 上流ブロッカーが追加で発見された（現状 0 件・追加発見なし）

> Phase 01 §6 AC-5 / Phase 02 §7 と同じ「依存 0 件」を本 phase でも明記する重複ルール。

---

## 10. プロトタイプ参照表

本 phase は構造設計のため画面実装はしない。SCOPE.md §3 不変条件 #3 の参照先として OKLch token 正本を再列挙する。

| 影響画面 | prototype ファイル | 行範囲 | primitive / token |
|---------|------------------|--------|-------------------|
| 全画面（色） | `styles.css` | L1-40（`:root`） | `--accent: oklch(0.58 0.10 55)`, `--ok: oklch(0.55 0.10 155)`, `--warn: oklch(0.62 0.12 75)`, `--danger: oklch(0.55 0.15 25)`, `--info: oklch(0.55 0.09 230)` ほか |
| theme variant warm | `styles.css` | L42-55 | `[data-theme="warm"]` |
| theme variant cool | `styles.css` | L57-70 | `[data-theme="cool"]` |
| 13 primitive | `primitives.jsx` | L5-272 | `Chip` L5 / `Avatar` L37 / `Button` L92 / `Switch` L113 / `Segmented` L118 / `Field` L129 / `Input/Textarea/Select` L145-147 / `Search` L150 / `Drawer` L158 / `Modal` L177 / `Toast` L201 / `KVList` L226 / `LinkPills` L248 |

---

## 11. 完了条件（Phase 04 へ進む gate）

- [ ] SCOPE.md 章立て §1〜§5 が確定
- [ ] CLAUDE.md / specs 追記アンカーが確定
- [ ] 連携シグネチャ表が確定
- [ ] 正本順位 4 段階が確定
- [ ] NO-GO 条件が明記
- [ ] phase-01 / phase-02 と矛盾なし（PASS / MINOR / MAJOR レビュー）

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
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-03.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
