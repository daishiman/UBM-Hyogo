# Phase 6: 異常系（migration 失敗 / 集計 silent drift / UI default 落ち）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系 |
| 作成日 | 2026-04-30 |
| 前 Phase | 5（仕様 runbook 作成） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-mode-analysis） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

canonical 統一は「単なる文字列の差し替え」に見えて、実態は DB 制約 / 集計クエリ / UI 表示 / 意味論軸 / shared ランタイム検証の 5 層に静かに波及する。後続タスク（UT-04 / UT-09 / U-UT01-10）が実装フェーズで遭遇する異常パターンと、本タスク決定がそれをどう予防するかを文書化する。本 Phase は実コード検証ではなく、**異常モード分析（FMEA 風）** の成果物を作る。

## 完了条件チェックリスト

- [ ] 想定異常ケースが 6 件以上列挙されている（下記カバー範囲を網羅）
- [ ] 各ケースに「発生条件 / 影響 / 検出方法 / 予防策（本タスクでの決定との対応） / 後続タスクでの対応責務」の 5 項目が揃っている
- [ ] silent failure（沈黙した壊れ方）が明確に区別されている
- [ ] `skipped` の取り扱い分岐（5 値目昇格 vs `skipReason` 畳み込み）と、両者の異常モードが両論記述されている
- [ ] shared 配置選択（types only vs Zod 併設）に応じた異常モード差分が記述されている

## 異常ケース一覧

### Case 1: canonical 切替時の CHECK 制約違反による migration 失敗

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `CHECK (status IN (...))` を変換 UPDATE より先に追加した場合 |
| 影響 | production migration が `SQLITE_CONSTRAINT` で失敗、`sync_job_logs` が読み書き不能化 |
| 検出方法 | dev D1 で 2 段階 migration を順序入れ替えて apply し失敗を確認（UT-04 phase-04） |
| 予防策（本タスク） | Phase 5 runbook で「migration A: UPDATE → migration B: CHECK 追加」の **別ファイル分割** を契約として固定 |
| 後続責務 | UT-04 が migration ファイルを 2 本に分け、A → B の順で apply する |

### Case 2: 集計クエリの silent drift（成功件数 = 0 でアラート沈黙）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `status='success'` をハードコードした集計クエリが置換漏れ、status は `completed` に切替済み |
| 影響 | 「成功件数 0」が継続出力され、SLO アラートが正常稼働下でも発火しない / 逆に失敗カウントが過剰計上 |
| 検出方法 | grep ベースで `status\s*=\s*'success'` 等の旧値リテラルが 0 件であることを CI で確認 |
| 予防策（本タスク） | Phase 5 runbook の Step 3「grep-and-replace」手順を明示。Phase 4 grep 計画でリテラル列挙 |
| 後続責務 | UT-09 が監視クエリを置換、UT-08 監視ダッシュボードの参照値も連動更新 |

### Case 3: UI ラベル switch 文の default 落ち（灰色バッジで沈黙表示）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 管理画面で `switch (status) { case 'running': ...; case 'success': ...; default: <gray badge> }` のような旧値前提の分岐が残存 |
| 影響 | `in_progress` / `completed` が default に落ち、運用者は「壊れていない」と誤認 |
| 検出方法 | TypeScript `assertNever(status)` を default 節に置く設計を Phase 4 雛形で提示。UI 実装側でビルドエラー化 |
| 予防策（本タスク） | Phase 4 の exhaustive switch 雛形が default 節を `assertNever` で塞ぐ前提 |
| 後続責務 | U-UT01-10 が shared `SyncStatus` 型を提供し、UI 実装タスク（別タスク）が switch を canonical に揃える |

### Case 4: trigger 軸ずれ（actor 軸 `admin` と mechanism 軸 `manual` の混在）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `trigger_type` に `admin`（actor 軸）と `cron`（mechanism 軸）が混在したまま放置 |
| 影響 | 「cron だけど admin が手動起動」のような新ユースケース追加で再衝突。集計でも actor 軸と mechanism 軸が混線 |
| 検出方法 | Phase 2 決定で `trigger_type` は mechanism 軸（`manual` / `cron` / `backfill`）に統一、actor は `triggered_by` 別カラム化されているかをレビュー |
| 予防策（本タスク） | Phase 2 で軸分離決定 + Phase 5 runbook で `triggered_by` 追加 ALTER を Step 2 に組み込み |
| 後続責務 | UT-04 が `triggered_by` カラムを物理スキーマに追加、UT-09 が起動経路で適切な値を注入 |

### Case 5: `skipped` 値の取り扱い分岐リスク

| 項目 | 内容 |
| --- | --- |
| 発生条件 | UT-01 論理 4 値（`pending` / `in_progress` / `completed` / `failed`）に `skipped` が含まれず、扱いが未確定のまま実装着手 |
| 分岐 A（5 値目昇格） | 既存ログ保持。CHECK 制約に追加。型 / Zod / UI switch すべて 5 値前提に拡張 |
| 分岐 B（`skipReason` 畳み込み） | `status='completed' AND skipReason IS NOT NULL` で表現。既存 `skipped` 行を canonical 4 値に変換するために `skipReason` カラム新設の追加 migration が発生 |
| 異常モード A | 5 値の半端採用：型は 5 値、SQL CHECK は 4 値、または逆 → CHECK 制約違反 / 型エラーのいずれかが production で発生 |
| 異常モード B | `skipReason` 列追加が UT-04 のスコープに含まれず、UT-09 が runtime で値を入れられない silent 不整合 |
| 予防策（本タスク） | Phase 2 で **どちらかを明示採択**し、両論併記しない。マッピング表もそれに従って一義化 |
| 後続責務 | UT-04 がカラム / 制約を分岐に応じて配置、U-UT01-10 が型定義を一致させる |

> 本仕様書では推奨案 = 分岐 A（5 値目昇格、`skipped` を canonical 5 値目に）を Phase 2 で採択する想定。最終決定は Phase 2 成果物に従う。

### Case 6: shared 配置で types のみ採用時のランタイム検証漏れ

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `packages/shared/src/types/sync.ts` のみ提供、Zod schema を併設しない判断を採った場合 |
| 影響 | API 受信値（外部システム / 管理画面 POST）が canonical 外の値でも DB 直前まで通過。CHECK 制約で初めて reject されるため、エラーレスポンスが 500 になる |
| 検出方法 | API 入口で型を `SyncStatus` に narrowing する処理が存在するかをレビュー、存在しなければランタイム未検証 |
| 予防策（本タスク） | Phase 2 配置判断で「types only にする場合は API 入口で `as const` リテラル配列との includes チェックを必須」と明示 |
| 後続責務 | U-UT01-10 が Zod 併設に切り替えるか、UT-09 が手動 narrowing を実装するかを引き継ぐ |

## 異常検出マトリクス（補助）

| カテゴリ | サイレント度 | 検出層 | 対応 Phase |
| --- | --- | --- | --- |
| Case 1 | 顕在（migration 失敗で即停止） | DB | Phase 5 runbook |
| Case 2 | サイレント（メトリクス沈黙） | 集計 / 監視 | Phase 4 grep + Phase 5 Step 3 |
| Case 3 | サイレント（UI 灰色） | UI | Phase 4 雛形（assertNever） |
| Case 4 | 半サイレント（後発機能で顕在化） | 設計 | Phase 2 軸分離決定 |
| Case 5 | 種別による | DB / 型 | Phase 2 採択 |
| Case 6 | 半サイレント（500 エラー） | API 入口 | Phase 2 配置判断 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/*` | 採択値の参照 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-04/test-strategy.md` | grep / 雛形の出典 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-05/contract-runbook.md` | 順序契約 |
| 参考 | `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` § 苦戦箇所 | Case 1〜5 の起点 |

## 成果物

| 成果物 | パス | 概要 |
| --- | --- | --- |
| 異常ケース集 | `outputs/phase-06/failure-cases.md` | Case 1〜6 を 5 項目（条件 / 影響 / 検出 / 予防 / 後続責務）で記述 |

## 次 Phase への引き渡し

- Phase 7 AC マトリクスでは、各 AC が Case 1〜6 のどれを予防しているかを補助列として明記できる。
- Phase 8 DRY 化で、本 Phase の異常ケースが他タスク（U-UT01-09 / U-UT01-10）の異常系と重複していないかを確認する起点となる。

## 多角的チェック観点

- **価値性**: 「サイレント壊れ」を全件可視化できているか
- **実現性**: 各予防策が本タスク（docs-only）の成果物だけで完結しているか、または後続タスクへの委譲が明確か
- **整合性**: Case 5（`skipped` 取り扱い）が Phase 2 決定と矛盾しない両論記述になっているか
- **運用性**: 各 Case が後続タスク実装者の「事前読みチェックリスト」として機能する粒度か

## 注意事項

- 本 Phase は **異常モードの文書化のみ**。実 migration / 実テストは行わない。
- 本タスクで実装変更を行わないため、ランタイム再現テストはスコープ外。
