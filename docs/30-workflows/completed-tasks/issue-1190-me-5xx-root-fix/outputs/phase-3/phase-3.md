# Phase 3: 設計レビュー

## メタ情報
正本: `outputs/phase-3/phase-3.md` / 上位 SSOT: `../../_shared-context.md`

## 目的
Phase 2 設計を 4 条件（シンプルさ・正本整合・テスト容易性・ロールバック容易性）で評価し、リスクと対策・CONST_007 スコープ妥当性を確認して Phase 4 進行（GO/NO-GO）を判定する。

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| シンプルさ | ◎ | 変更は catch ブロック 4 箇所（`.catch` 方式・既存 photoUrl 前例と同型）+ import 数行に閉じる。新規 production ファイル 0・新規エラーコード 0（既定義 `UBM-5001` 使用）・新規ログイベント 0・helper 抽象化なし（Phase 8 で再評価）。errorHandler / repository 層 / apps/web は無変更 |
| 正本整合 | ◎ | SSOT §3.1 の擬似コードと実 `ApiError` 契約の乖離（`cause`/`context` は `log` 配下）を Phase 2 §3 で実コード Read により確定し、乖離注記を残した（SSOT 自身の委譲指示どおり）。行番号は P1-P8 全件実測一致（Phase 1 §1.3）。scope 識別子 3 値・status 体系不変・正本順位（SSOT §10）に矛盾なし |
| テスト容易性 | ◎ | 既存 spec の fake 注入（`createMeRoute({ resolveSession })` + InMemoryD1）がそのまま使え、追加は onError 付きハーネスと SQL パターン選択式 failing Proxy のみ。TC-1〜TC-4 はすべて node 環境 vitest で決定的に再現でき、staging 実機に依存しない。console.error spy で不変条件 #11 も機械検証可能 |
| ロールバック容易性 | ◎ | 各 catch ブロックは独立に revert 可能（T01 と T02 は互いに依存しない）。挙動変更は「P4 が 500→200」「P1-P3 の code が UBM-5000→UBM-5001」のみで、response shape・status 体系・D1 schema・endpoint surface は不変のため、`git revert` 1 回で完全に旧挙動へ戻る。データ migration・設定変更を伴わない |

## 2. 真の論点

1. **真の論点**: 「staging /profile の 5xx」は真因（H3/H4/H5）未確定だが、確定を待つこと自体が deferred の構造的原因だった。本設計は「真因がどれでも価値が出る」形（F-1 根治 + F-2 で再発時 1 ログ確定 + F-3 で挙動固定）に問題を再定義しており、Issue の現行コード最適化として妥当。
2. **依存・責務境界**: 分類（scope 付与）は呼び出し側（session-guard / route）、整形・出力は既設 onError、という一方向の責務分離。repository 層に scope を持ち込まない判断は再利用境界を守る（他 route から同 repository を使う際に /me の scope が混入しない）。
3. **価値とコストの不均衡チェック**: 高コスト案（`/me` 全 endpoint への横展開・503 化・retry 機構）は採らず、観測された欠陥 3 件に最小手で対処。fail-soft の追加対象を P4 の 1 箇所に限定したのは「一次データを fail-soft にして嘘の 200 を返す」過剰適用の回避でもある。
4. **改善優先順位**: ① T02（分類）— 再発時の確定能力が最優先 ② T01（fail-soft）— 回避可能な全体 500 の根治 ③ T03（契約テスト）— ①②の固定 ④ T04（Issue 草稿）— 運用整合。

## 3. 設計上のリスクと対策

| # | リスク | 対策 |
|---|--------|------|
| R1 | `.catch((err): never => { throw ... })` の型推論が TS 設定によっては union に `never` を残し typecheck で警告になる | 明示の `: never` 注釈を仕様に含めた（Phase 2 §5）。万一不調なら同等の try/catch + let 宣言へ機械的に書き換え可（挙動同一・Phase 5 実装ノートに代替記載） |
| R2 | failing D1 Proxy の SQL パターンが経路を一意に選択できない懸念（sessionGuard と builder が同テーブルを読む） | TC-2 は builder 専用テーブル（`member_responses`/`response_fields` 系）で fail させる設計。Phase 4 で builder.ts:319-381 の実 SQL を確認しパターンを 1 テーブルへ確定する |
| R3 | console.error spy が logging.ts の JSON 文字列化（`emit`）後の行を捕捉するため、アサーションが文字列依存になる | 捕捉行を `JSON.parse` して構造化アサート（`context.scope` 等値・`m_001` 非含有は文字列 `not.toContain` 併用）。Phase 4 期待値表で payload shape を契約固定 |
| R4 | `context` への動的値混入で不変条件 #11 が将来破られる | context は literal `{ scope: "<3値のいずれか>" }` 固定と仕様に明記 + T03 アサーション + Phase 9 grep gate の 3 層（Phase 2 §6） |
| R5 | P2（findAdminByEmail）の分類追加で「admin 判定失敗時も /me 全体 500」が維持される（fail-soft 化しない判断）への異論 | isAdmin は SessionUser の一次属性（誤って false に degrade すると admin UI 導線が消える嘘になる）。fail-hard 維持 + 分類が正。SSOT §3 T02 とも一致 |
| R6 | 既存テストが onError なしの sub-app 直叩きのため、TC-1/TC-2 ハーネス追加が既存 describe と混在し可読性低下 | ハーネスは spec 内ローカル関数 `buildAppWithErrorHandler` として既存 `buildApp` の隣に置き、5xx 系 describe を分離（Phase 2 §7.2） |

## 4. CONST_007 スコープ妥当性（1 サイクル完了可能か）

- 変更ファイル: production 2（`session-guard.ts`・`routes/me/index.ts`）+ spec 2（既存追記 1・新規 1）+ docs（T04 草稿）。catch 4 箇所・テスト 4 系統（TC-1〜TC-4）。
- 外部依存なし: 新規パッケージ・migration・env 変更・GitHub mutation・staging deploy のいずれも不要（実機確認は user-gated でスコープ外）。
- 先送り分割なし: T01-T04 すべて本設計で実装手順まで確定可能。**1 本サイクルで完了可能と判定**。

## 5. Phase 4 進行判定

**GO（PASS）。**

根拠:
1. 4 条件すべて ◎ — 最小差分・正本整合（乖離は実測で解消済み）・決定的テスト・単一 revert で復旧可能。
2. 残リスク R1-R6 はすべて対策が設計内で確定しており、唯一の未確定要素（R2 の fail パターン 1 テーブル化）は Phase 4 の期待値表作成で機械的に解消できる。
3. CONST_007 充足（§4）。AC-1〜AC-10 と設計の対応に欠落なし（AC-1↔T01 / AC-2,3↔T02 / AC-4,5↔T03+grep / AC-6,7↔非接触 gate / AC-8↔validation path / AC-9,10↔T04+user-gated）。

Phase 4（I/O 契約：problem+json フィールド・logError payload・テスト期待値表）へ進む。

## 統合テスト連携
Phase 4 で TC-1〜TC-4 の期待値（status / content-type / body フィールド / console.error payload shape）を I/O 契約として固定し、Phase 6 のテスト拡充がそのまま参照できる形に落とす。

## 参照資料
- `../phase-1/phase-1.md` / `../phase-2/phase-2.md` / `../../_shared-context.md`

## 成果物
- `outputs/phase-3/phase-3.md`

## 完了条件
- [x] 4 条件評価・リスクと対策（R1-R6）・CONST_007 妥当性を記録し、Phase 4 進行を GO 判定した。

## 次 Phase への引き継ぎ
- 判定 **GO**。Phase 4 は problem+json（`code`/`status`/`title`/`detail`/`traceId` + `x-request-id`/`x-trace-id`）と logError payload（`context.scope`・cause 縮約形）を I/O 契約表へ固定する。
- R2 対応として builder.ts:319-381 の実 SQL を確認し、TC-2 の fail パターンを 1 テーブルへ確定すること。
- R1 の代替実装（try/catch + let）を Phase 5 実装ノートに併記し、typecheck 失敗時の迷いを残さないこと。
- 不変条件 #11 の 3 層保証（literal context・T03 アサーション・grep gate）を Phase 6/9 のチェックリストへ転記すること。
