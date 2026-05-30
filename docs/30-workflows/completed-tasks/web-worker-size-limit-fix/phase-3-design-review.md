# Phase 3: 設計レビュー

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow 名 | `web-worker-size-limit-fix` |
| 入力 | `phase-1-requirements.md` / `phase-2-design.md` |
| 出力 | PASS/MINOR/MAJOR 判定・simpler alternative 検討記録・Phase 4 開始条件・Phase 13 blocked 条件・MINOR 追跡テーブル |
| taskType | `implementation` / `NON_VISUAL` |
| 状態 | `implemented_local_evidence_captured` |

## 目的

Phase 1〜2 の設計が Phase 4（テスト作成）へ進める品質に達しているかを判定する。
責務境界（Task A / Task B）・並列性（disjoint 編集）・size gate の依存順序・
受入条件（AC-1〜AC-6）と validation matrix（V-1〜V-9）の対応が閉じているかをレビューする。

## 実行タスク

### レビュー判定

| 判定軸 | 結果 | 根拠 |
|--------|------|------|
| 責務境界（SRP） | PASS | lane-A=OG 撤去 / lane-B=minify+gate が disjoint。編集ファイル重複 0 |
| 受入条件の網羅 | PASS | AC-1〜AC-6 が V-1〜V-9 に 1 対 1 以上で対応（下表） |
| 依存順序の整合 | PASS | size gate green 判定が lane-A 完了後である依存を dependency matrix に明記 |
| 不変条件遵守 | PASS | `*.spec.{ts,tsx}` のみ / `cf.sh` 経由 / HEX 直書き禁止（PNG 側で色決定）/ `next build --webpack` 維持 / D1 直アクセスなし |
| 4 条件（価値/実現/整合/運用） | PASS | 下記評価 |

### AC ↔ validation 対応確認

| AC | 対応 validation | 充足 |
|----|----------------|------|
| AC-1（staging deploy size 超過なし成功） | V-4, V-5, V-6 | ✅ |
| AC-2（無料プラン維持） | 設計上 wrangler.toml 差分なし・Paid 移行（F）却下 | ✅ |
| AC-3（OG メタが有効 og:image 出力） | V-1, V-3（Playwright public-metadata.spec.ts） | ✅ |
| AC-4（サイズ超過を CI で事前検知） | V-5, V-6（web-cd.yml gate step） | ✅ |
| AC-5（next/og 参照 0 件） | V-7, V-3（regression assert） | ✅ |
| AC-6（wasm 不在） | V-8, V-4 | ✅ |

### 4 条件評価

| 条件 | 評価 |
|------|------|
| 価値性 | deploy 失敗リスクを解消し無料構成を維持。受益者=運用者（CI 緑化）+ 利用者（OG メタ維持） |
| 実現性 | 削除 2 + 編集 4 + 新規 2 の小〜中規模。`next/og` 使用 2 箇所のみで影響局所 |
| 整合性 | lane disjoint・size gate 状態所有権が `check-worker-size.sh` に単一化・依存順序が明記され矛盾なし |
| 運用性 | size gate が CI に常駐し再発を deploy 前に検知。dry-run 計測は `cf.sh` 経由で監査運用と整合 |

## 参照資料

| 種別 | パス |
|------|------|
| 入力 | `phase-1-requirements.md` / `phase-2-design.md` |
| 無料構成正本 | `docs/00-getting-started-manual/specs/08-free-database.md` |
| Worker bundle size ガード | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |

## 実行手順

1. 責務境界・AC 網羅・依存順序・不変条件・4 条件を判定する。
2. simpler alternative（A 単独で十分か）を検討記録する。
3. MINOR 指摘を追跡テーブルへ登録する。
4. Phase 4 開始条件と Phase 13 blocked 条件を固定する。

## simpler alternative 検討記録

| 検討 | 結論 |
|------|------|
| **Task A（OG 撤去）だけで AC-1（3MiB 以下）を満たせるか？** | **Yes**。wasm/font ~1539KB を撤去すれば gzip 700KB+ 削減 → 試算 ~2.5MiB で 3072KiB を下回る。A 単独で deploy 成功要件は満たせる |
| では Task B（production minify 維持 + gate）は不要か？ | **必要**。B の minify は追加マージン確保（余裕の薄い 3MiB 上限に対する安全側）。size gate（C）は AC-4（CI 事前検知）の要件そのものであり、A 単独では満たせない。よって A+B+C を採る |
| **Sentry trim（E）は必要か？** | **不要**。A で 3MiB 以下に到達するため Sentry 撤去は観測性を犠牲にするだけ。E は contingency（A+B 後も超過する場合）に留める |
| 静的 PNG ではなく簡易 SVG/HTML OG にできるか？ | 不採用。Cloudflare Workers の OG 配信は静的 asset（`public/`）が最小依存で確実。動的生成は `next/og` 回帰リスクを残す |

## MINOR 追跡テーブル

| ID | 指摘 | 解消先 Phase | 扱い |
|----|------|-------------|------|
| MINOR-1 | OpenNext v1.19.4 に `minify` config key が存在するか不明 | **Phase 5**（実装時に型定義で確認） | 解消済み: `minify` config key は存在しないため無効な設定を追加せず、debug 有効化禁止 guard で production 既定 minify を維持 |
| MINOR-2 | `check-worker-size.sh` の dry-run 出力パースが透過的にサイズを取れるか（出力フォーマット依存） | **Phase 4**（dry-run 出力を実測しパース可否を確認。不可なら `.open-next` gzip 合算フォールバックを主経路化） | 2 段フォールバック設計済みのため fail しても安全 |
| MINOR-3 | `og-default.png` の視覚品質（ブランド整合）は NON_VISUAL 範囲外だが asset 品質として後追い確認余地 | Phase 11（NON_VISUAL 宣言下で asset 存在 + メタ参照を代替証跡として確認） | low |

> いずれも MINOR。MAJOR 指摘なし。Phase 4 進行を妨げない。

## Phase 4 開始条件

- [ ] 本 Phase の判定が **PASS**（MAJOR 0 件）であること
- [ ] AC-1〜AC-6 と V-1〜V-9 の対応が確定していること
- [ ] lane-A / lane-B の編集ファイルが disjoint であること
- [ ] size gate green 判定が lane-A 完了後である依存順序が合意されていること
- [ ] MINOR-1（minify API 名）は Phase 5、MINOR-2（dry-run パース不可時は OpenNext gzip 合算を主経路化）は Phase 4/5 で解消する追跡が登録済みであること

## Phase 13 blocked 条件

Phase 13（PR 作成）は以下が全て満たされるまで blocked:

- [ ] AC-1〜AC-6 が本実装サイクル の実装・テストで実証されていること
- [ ] `check-worker-size.sh` が gzip ≤ 3072KiB を実測で green にしていること（lane-A 完了後）
- [ ] regression spec / Playwright / grep / find（V-3,V-5,V-7,V-8）が全て green であること
- [ ] **user の明示承認**（commit / push / PR / staging deploy は全て user-gated）

## 統合テスト連携

本実装サイクル で走るテストは Phase 1/2 と同一（vitest regression / Playwright public-metadata / grep / find / size gate / coverage-guard）。本 Phase はその対応関係（AC ↔ validation）のレビューを担う。

## 多角的チェック観点（AIが判断）

| 系統 | 観点 |
|------|------|
| システム系 | size gate が deploy 前段に入ることで「bundle 肥大 → deploy 失敗」の遅い負帰還を「PR 段階での fail」という早い負帰還へ前倒しする。状態所有権の単一性を再確認 |
| 戦略・価値系 | A 単独で価値（deploy 成功）を確保しつつ、B/C で運用安全網を足す段階性が妥当。E/F の将来層分離を維持 |
| 問題解決系 | simpler alternative で A 単独十分性を確認した上で、AC-4 を満たすため C を必須化する論点整理が閉じている |

## サブタスク管理

| サブタスク | 状態 |
|-----------|------|
| レビュー判定（5 軸） | PASS |
| AC ↔ validation 対応確認 | 完了 |
| simpler alternative 検討 | 完了（A 単独十分・B/C 必須・E 不要） |
| MINOR 追跡登録 | MINOR-1/2/3 登録 |

## 成果物

- 本 Phase: `phase-3-design-review.md`（本ファイル）

## 完了条件

- [ ] PASS/MINOR/MAJOR 判定を 5 軸で記録した（MAJOR 0 件で PASS）
- [ ] AC-1〜AC-6 と V-1〜V-9 の対応を確認した
- [ ] simpler alternative（A 単独十分 / B・C 必須 / Sentry trim 不要）を記録した
- [ ] MINOR 追跡テーブル（解消先 Phase 付き）を作成した
- [ ] Phase 4 開始条件と Phase 13 blocked 条件を固定した

## タスク100%実行確認【必須】

- [ ] 責務境界・AC 網羅・依存順序・不変条件・4 条件の 5 軸を全て判定した
- [ ] Task A 単独で AC-1（3MiB 以下）を満たせる旨を simpler alternative に記録した
- [ ] MINOR-1（minify API 名→Phase 5）・MINOR-2（dry-run 透過確認→Phase 4）を追跡登録した
- [ ] commit/push/PR/staging deploy が user-gated（Phase 13 blocked）であることを明記した
- [ ] 全完了条件チェックリストを満たした

## 次Phase

Phase 4（テスト作成）以降は本タスクのスコープ外（本実装サイクル が担う）。本 workflow の Phase 1〜3 設計レビューが PASS したため、Phase 4 開始条件を満たした時点で本実装サイクル が RED/GREEN サイクルへ進む。
