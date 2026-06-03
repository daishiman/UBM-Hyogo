# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー（着手可否ゲート） |
| 作成日 | 2026-06-02 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

Phase 2 の設計（D-1〜D-7 / 関数シグネチャ / 突合マトリクス / 変更 5 ファイル）が Phase 4 以降へ進めるかを、代替案比較と 4 条件の再評価で判定する。AC-1〜AC-11 が設計でカバーされているかを突合し、MAJOR がなければ着手可とする。

## レビュー対象サマリー

| 観点 | 設計の結論 | 判定 |
| --- | --- | --- |
| パーサ実装 | 自作行パーサ（D-1） | PASS |
| 突合スコープ | env.ts=applied 全 kind / 棚卸し=applied 全 kind（D-5） | PASS |
| 突合方向 | wrangler → env.ts の片方向 fail（D-6） | PASS |
| read-only | readFileSync のみ（D-7） | PASS |
| 現存ドリフト是正 | 棚卸し表 MEMBER_PHOTOS 追記（AC-10） | PASS |

## 代替案比較

| 案 | 概要 | 採否 | 理由 |
| --- | --- | --- | --- |
| 案 A（採用） | 自作行パーサ + 片方向突合 + Current Cloudflare inventory | **採用** | コメント block を applied:false 捕捉可能。依存ゼロ。D1 / Analytics も同じ SSOT で扱える |
| 案 B | `@iarna/toml` でパース | 不採用 | コメントアウト block を無視し applied:false を区別不能（D-1） |
| 案 C | 双方向突合（env.ts → wrangler も fail） | 不採用 | 型が将来 binding を先行宣言する正当ケースを誤検出（D-6） |
| 案 D | D1/analytics も棚卸し表突合対象 | **採用へ昇格** | CONST_005 により未タスク化せず同一サイクルで解消。表を Current Cloudflare binding inventory へ拡張 |
| 案 E | gate を先に CI 導入し MEMBER_PHOTOS 是正は別 PR | 不採用 | CONST_007 違反（先送り）。導入直後に gate が赤になる。AC-10 で同梱是正 |

## AC カバレッジ確認

| AC | 設計での担保 | 判定 |
| --- | --- | --- |
| AC-1 | D-2/D-3/D-4 パーサ + 集約 | PASS |
| AC-2 | 突合マトリクス `ENV_TYPE_MISSING` | PASS |
| AC-3 | 突合マトリクス `INVENTORY_MISSING`（applied 全 binding） | PASS |
| AC-4 | 突合マトリクス `INVENTORY_KIND_MISMATCH` / `INVENTORY_ORPHAN` | PASS |
| AC-5 | applied:false → PASS（info） | PASS |
| AC-6 | D-5/D-6 除外ルール | PASS |
| AC-7 | D-7 read-only | PASS |
| AC-8 | Phase 4 で TC-01〜TC-10 設計（次 Phase） | PASS（設計委譲） |
| AC-9 | Phase 5 で workflow 設計（変更ファイル一覧に記載） | PASS（設計委譲） |
| AC-10 | 変更ファイルに deployment-cloudflare.md 追記 | PASS |
| AC-11 | 本 Phase の 4 条件再評価 | PASS |

## 4 条件 再評価

| 観点 | 判定 | 根拠（Phase 1 から変化なし） |
| --- | --- | --- |
| 価値性 | PASS | 三者乖離の機械検出 + MEMBER_PHOTOS 現存ドリフト是正 |
| 実現性 | PASS | 既存 verify-* 先例 + 標準 Node fs。新規依存ゼロ |
| 整合性 | PASS | 不変条件 #5 read-only / #8 `.spec.ts` / env.ts の一対一対応運用を機械強制 |
| 運用性 | PASS | 変更 path トリガ CI + ローカル script。revert 1 コミット粒度 |

## レビュー指摘（MINOR / 未タスク候補）

| # | 指摘 | 重大度 | 扱い |
| --- | --- | --- | --- |
| R-1 | DB / SYNC_ALERTS を棚卸し表に含めないため、D1/analytics のドリフトは本 gate では検出しない | MINOR | **解決済み**。表を Current Cloudflare binding inventory へ拡張し、DB / SYNC_ALERTS 行と全 applied binding inventory 突合を追加 |
| R-2 | KV alert policy ↔ binding 活性連動の検出は本 gate 対象外 | MINOR | issue-57-followup-003 の射程（責務分離） |
| R-3 | 棚卸し表の state 表記揺れで未知語が出た場合 unknown 扱い | MINOR | warn にとどめ誤 fail 回避（Phase 2 D 方針）。Phase 6 異常系で固定 |

## 着手可否判定

**判定: 着手可（GO）**。MAJOR 0 件。MINOR 3 件はいずれも scope 明示または別 Issue 射程で、本タスクの 1 サイクル完了（CONST_007）を阻害しない。Phase 4（テスト戦略）へ進む。

## 実行タスク

1. 代替案 A〜E を比較し採用案を確定する（完了条件: 比較表に採否 + 理由）。
2. AC-1〜AC-11 の設計カバレッジを突合する（完了条件: AC カバレッジ表が全 PASS）。
3. 4 条件を再評価する（完了条件: 全 PASS + 根拠）。
4. MINOR 指摘を列挙し未タスク候補 / 別 Issue 射程に振り分ける（完了条件: R-1〜R-3 が扱い付きで存在）。
5. 着手可否（GO/NO-GO）を判定する（完了条件: GO 判定 + MAJOR 0 の明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 設計方針 D-1〜D-7 / シグネチャ / 突合マトリクス |
| 必須 | phase-01.md | AC-1〜AC-11 / 4 条件評価 |
| 必須 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビューゲート基準 |
| 必須 | docs/30-workflows/unassigned-task/issue-57-followup-003-kv-alert-policy-drift-detection.md | R-2 の責務分離先 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レビュー | outputs/phase-03/main.md | 代替案比較 / AC カバレッジ / 4 条件再評価 / MINOR 指摘 / GO 判定 |
| メタ | artifacts.json | Phase 3 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | GO 判定とともに突合マトリクスをテスト期待値に渡す |
| Phase 10 | MINOR R-1〜R-3 を最終レビューの未解決指摘トラッキングに渡す |
| Phase 12 | R-1 解決済みを未タスク0件として記録 |

## 完了条件

- [x] 代替案 A〜E が比較され採用案（A）が確定している
- [x] AC-1〜AC-11 の設計カバレッジが全 PASS で突合されている
- [x] 4 条件が再評価され全 PASS
- [x] MINOR 指摘（R-1〜R-3）が扱い付きで列挙されている
- [x] 着手可否が GO（MAJOR 0）で判定されている

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が `completed`
- 成果物 `outputs/phase-03/main.md` が配置済み
- GO 判定が MAJOR 0 で確定
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - GO 判定（MAJOR 0 / MINOR 3 は scope 明示・別 Issue 射程）
  - 突合マトリクス（TC 期待値の基礎）
  - MINOR R-1（全 binding inventory 化）は同一サイクルで解決済み
- ブロック条件:
  - 実装サイクルで突合マトリクスから逸脱した設計変更が入る
