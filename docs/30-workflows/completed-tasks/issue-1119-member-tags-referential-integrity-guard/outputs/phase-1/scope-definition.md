# Phase 1 — スコープ定義詳細

> **[実装区分: 実装仕様書]** / `implementation_mode: new` / **NON_VISUAL**
> CONST_007（03.実装.md の 1 サイクルで完結）を満たすことを本書で根拠付けする。

## 1. スコープ全体像

`member_tags.tag_id` の参照整合性ギャップを、documented no-FK 架構（`apps/api/migrations/0022_member_photos.sql:4`）を尊重したまま **application 層の孤児行検出ガード**で根本解決する。DB-level FK は追加せず（採用しない確定）、migration はゼロ。

## 2. 含む（1 サイクル完結）

| # | 成果物 | 対象ファイル | 変更種別 | 根拠 AC |
|---|--------|--------------|----------|---------|
| 1 | 孤児行検出 repository 関数 `detectOrphanMemberTags` / `countOrphanMemberTags` + 型 `OrphanMemberTag` | `apps/api/src/repository/memberTags.ts` | 編集 | AC-2 |
| 2 | admin 監査 endpoint `GET /admin/tags/orphans`（read-only） | `apps/api/src/routes/admin/tags.ts` | 編集 | AC-6 |
| 3 | 孤児検出 repository spec（不変条件 0 件・SQL 検証・エッジケース） | `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | 新規 | AC-2 / AC-7 |
| 4 | endpoint contract test 追加 | `apps/api/src/routes/admin/tags.contract.spec.ts` | 編集 | AC-6 |
| 5 | INSERT 3 経路の tag_id 先在検証 回帰 baseline（fixture 健全性確認含む） | `apps/api/src/routes/admin/members.contract.spec.ts` | 確認のみ | AC-3 / AC-5 |
| 6 | 意思決定レポート（DB FK 不採用根拠・責務分離） | Phase 2 ADR-1119 / Phase 12 | ドキュメント | AC-1 / AC-4 |

### 1 サイクル完結（CONST_007）の根拠

- 追加コードは **read 関数 2 つ + read-only endpoint 1 つ**のみ。状態を変える mutation はゼロ。
- migration / D1 schema 変更 / Google Form 仕様変更 が**いずれもゼロ**。デプロイ前提条件の連鎖が発生しない。
- テストは新規 1 ファイル + 既存 2 ファイルへの追記で、相互依存のない局所変更。
- フロントエンド（apps/web）非接触ゆえ UI 連動の追加サイクルが発生しない。
- → 03.実装.md の単一サイクル（設計 → テスト → 実装 → 検証）内で閉じ、後続サイクルへ繰り越す未完了スコープが残らない。

## 3. 含まない（境界・先送りではなく別関心事）

| 除外項目 | 区分 | 理由 |
|----------|------|------|
| **DB-level FK の migration 追加（0026 等）** | **不採用の確定**（先送りではない） | documented no-FK 架構（0022:4）を尊重。AC-1 で意思決定として確定。下記 §4 参照 |
| issue-1070 の `countMemberTagReferences` + 409 ガードの撤去 | 維持（非破壊） | 削除時参照防壁として継続。orphan detection と責務分離して共存 |
| issue-1117 の `migrateTo` 強制移行 | 別タスク・別 Issue | 参照付き tag の物理削除時の移行経路は本タスクの関心外 |
| 既存孤児行の自動クリーンアップ・修復 mutation | 別関心事 | 本タスクは**検出・可視化まで**。自動削除/修復は invariant #13（write は `assign*` 限定）にも抵触するため範囲外 |
| issue-1105 の member_status FK | 別タスク・別 Issue | 別テーブルの FK 評価で本タスクと独立 |
| staging / production deploy、commit、push、PR 作成 | Phase 13 / user-gated | 仕様書作成段階では実行しない |
| 実 D1 への孤児行調査クエリ実行 | user-gated | read-only だが実環境クエリ実行はユーザー承認を要する |

## 4. 「DB-level FK 不採用」は先送りではなく不採用の確定である根拠

issue 原文は「DB-level FOREIGN KEY 追加の是非を**評価**する」評価タスクだった。本タスクは評価結論を以下の通り確定させる。

| 論点 | 確定内容 |
|------|----------|
| 評価の結論 | DB-level FK は **採用しない**（=「将来再検討」ではなく本タスクで結論を出す） |
| 確定の根拠 | `0022_member_photos.sql:4` の documented no-FK invariant が既にリポジトリの設計判断として存在。FK 後付けはこの invariant を**反転**する破壊的変更になる |
| 技術的裏付け | D1（SQLite）は接続ごとに `PRAGMA foreign_keys` の ON/OFF が決まり enforcement が不確実。SQLite は `ALTER TABLE ADD CONSTRAINT` 非対応でテーブル再作成が必要・既存孤児があると移行失敗 |
| 代替の根本解決 | 評価で止めず、no-FK 架構に整合する application 層の孤児検出ガードを**実コードで実装**して根本問題を解消する |
| 「先送り」との違い | 先送り = 解決手段を後続タスクへ繰り越す。本タスクは孤児ギャップを本サイクル内で実コードとして解消するため、未解決の繰り越しが残らない |

→ ユーザー承認（2026-06-06）により approach = 「App 層整合性ガード強化（整合性重視・migration 追加なし）」が確定済み。

## 5. スコープ境界の不変条件適合

| 不変条件 | スコープ内での適合 |
|----------|--------------------|
| invariant #5（D1 は apps/api に閉じる） | 全変更が `apps/api` の repository / route / spec。apps/web 非接触 |
| invariant #8（`*.spec.ts` のみ） | 新規 test は `memberTags.orphan.repository.spec.ts`（`.spec.ts`） |
| invariant #13（write は `assign*` 4 関数限定） | 追加は read 関数のみ。mutation ゼロ |
| no-FK 架構（0022:4） | FK 追加せず維持・強化 |
| issue-1070 ガード非破壊 | count guard / 409 を撤去せず共存 |

## 完了条件（Phase 1 — スコープ）

- [x] 含む / 含まない を確定（成果物 6 点・除外 7 点）
- [x] CONST_007 1 サイクル完結根拠を明記
- [x] DB-level FK 不採用が「不採用の確定」である根拠を §4 で固定
- [x] スコープ境界の不変条件適合を確認
