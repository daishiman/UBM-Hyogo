# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | 01a (D1 schema), 01b (zod / view model) |
| 下流 | Phase 2 (設計) |
| 状態 | pending |

## 目的

管理者ドメイン（admin_users / admin_member_notes / audit_log / sync_jobs / magic_tokens）の D1 アクセス層 **に加えて**、同 Wave 全体（02a/02b/02c）の **data access 境界** を確定する。`apps/web` から D1 への直接アクセスを構造で禁じ（不変条件 #5）、`admin_member_notes` が public/member view model に絶対に混ざらない契約（不変条件 #12）を Phase 1 で固定する。

## 真の論点

1. **`admin_member_notes` が builder 経路に混入しないことを「型」と「import 構造」の両輪で守れるか**（不変条件 #12）
2. **`apps/web` → D1 直接 import を、ESLint と dependency-cruiser のどちらで止めるか、両方か**（不変条件 #5）
3. **`audit_log` が append-only であることを repository API の存在しない設計で守れるか**（UPDATE/DELETE API を作らない）
4. **`magic_tokens.consume()` の single-use を、楽観 lock / `used_at` UPDATE のどちらで実装するか**
5. **`sync_jobs` の状態遷移（`running → succeeded/failed`）を 02b の tagQueue と同じ ALLOWED_TRANSITIONS パターンで統一するか**
6. **prototype data.jsx 相当 fixture が「dev seeder」と「本番昇格」の境界を超えないことを構造で守れるか**（不変条件 #6）

## 依存境界

| 種別 | 対象 | 引き渡し内容 |
| --- | --- | --- |
| 上流: 01a | D1 schema migration | `admin_users` / `admin_member_notes` / `audit_log` / `sync_jobs` / `magic_tokens` の DDL と index |
| 上流: 01b | zod schema / branded type | `AdminEmail` / `MagicToken` / `AuditAction` の brand、`AdminMemberNote` の zod |
| 並列: 02a | 共通基盤共有 | `_shared/db.ts` / `_shared/brand.ts` を 02c が **正本管理**、02a がここから import |
| 並列: 02b | 共通基盤共有 | 同上、in-memory D1 fixture loader を 02c が提供 |
| 下流: 03a / 03b | sync 連携 | `syncJobs.start/succeed/fail` を呼ぶ |
| 下流: 04c | admin API | `adminNotes` / `auditLog` / `adminUsers` を呼ぶ |
| 下流: 05a | admin gate | `adminUsers.findByEmail()` で role lookup |
| 下流: 05b | Magic Link | `magicTokens.issue/verify/consume` |
| 下流: 07c | admin workflow | `auditLog.append` / `adminNotes` |
| 下流: 08a | repository test | unit test fixture と公開 interface |

## 価値とコスト

| 区分 | 内容 |
| --- | --- |
| 初回価値 | 03a/b / 04c / 05a/b / 07c / 08a が「型と関数 signature」と「lint 境界」を確定して並列着手できる、`apps/web` 開発で D1 import を踏み抜く事故を排除 |
| 払うコスト | dep-cruiser config の維持コスト、ESLint plugin 導入の初期コスト、in-memory fixture loader の API 設計に時間 |
| 払わないコスト | adminNotes を builder 経路に組込む、audit_log に UPDATE API を作る、magicTokens を multi-use にする |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | PASS | 03a/b / 04c / 05a/b / 07c / 08a が同じ repository と境界を使うため、認可 / 監査 / ジョブ管理の重複実装を回避 |
| 実現性 | 無料運用の初回スコープで成立するか | PASS | adminNotes / auditLog の write は admin 操作のみ（〜数十/day 想定）、無料枠 100k writes/day 内 |
| 整合性 | 型 / branch / runtime / data / secret が矛盾しないか | PASS | dep-cruiser + ESLint で boundary を二重に守る、append-only は API 不在で守る |
| 運用性 | rollback / handoff / same-wave sync が可能か | PASS | repository は idempotent、boundary tooling は 02a/02b が即 import 可能 |

## 実行タスク

1. **入力確認**
   - 01a の DDL を読み、扱うテーブル 5 種（admin_users / admin_member_notes / audit_log / sync_jobs / magic_tokens）を確定
   - 01b の zod を読み、`AdminMemberNote` / `AuditLogEntry` / `SyncJob` / `MagicToken` の型を確定
2. **責務確定**
   - repository ファイル 5 つ + boundary tooling 3 つ（dep-cruiser config / ESLint rule / fixture loader）
   - builder 経路に adminNotes が **存在しない** ことを 02a Phase 2 と整合
3. **境界 tooling 設計**
   - dep-cruiser ルール: `apps/web/**` → `apps/api/src/repository/**` 禁止
   - ESLint rule: `apps/web/**` で `D1Database` import 禁止
   - 両者の役割分担を明確化（CI 段で dep-cruiser、ローカル即時で ESLint）
4. **不変条件マッピング**
   - 不変条件 #5 / #6 / #11 / #12 を「どのファイル / どの tool でどう守るか」表に落とす
5. **AC 抽出**
   - index.md の AC-1〜AC-11 を Phase 1 main.md にコピーし、test 検証可能性をチェック
6. **handoff document**
   - 03a/b / 04c / 05a/b / 07c / 08a が読むべき「上流引き渡し interface」をリスト化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | admin gate / Magic Link |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル DDL / index |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 機能仕様 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 / OTP |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2c 詳細 |

## 実行手順

### ステップ 1: input と前提の確認
- 01a 完了物（DDL）と 01b 完了物（zod）の差分を読む
- 01a の `admin_users` / `admin_member_notes` / `audit_log` / `sync_jobs` / `magic_tokens` テーブルが Phase 1 で扱う 5 テーブル全てを含むか確認
- 02a / 02b の Phase 1 main.md と「`_shared/` の正本所在」が整合しているか確認

### ステップ 2: Phase 成果物の作成
- `outputs/phase-01/main.md` に下記を書く
  - 「責務一覧」: repository 5 + boundary tooling 3 + fixture loader 1
  - 「公開 interface 文章版」
  - 「不変条件マッピング表」（特に #5 を ESLint / dep-cruiser 二重防御で）
  - 「AC-1〜AC-11 と test 戦略の対応」

### ステップ 3: 4 条件と handoff の確認
- 4 条件全て PASS 再確認
- 03a/b / 04c / 05a/b / 07c / 08a が読む「上流引き渡し interface」を箇条書き化

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の責務一覧から module map を起こす |
| Phase 4 | AC を verify suite に変換する |
| Phase 7 | AC matrix のトレース起点 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | implementation-guide.md の入力 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | dep-cruiser + ESLint の二重防御計画あり |
| GAS prototype 昇格防止 | #6 | seed/fixture が dev scope のみと文書で明示 |
| admin 本文編集禁止 | #11 | adminNotes は別テーブル、本文 `member_responses` (02a) には触れない |
| view model 分離 | #12 | builder 経路に adminNotes が混入しない（02a builder の引数で受け取る設計と整合） |
| append-only | — | audit_log に UPDATE/DELETE API を作らない（API 不在で守る） |
| single-use | — | magicTokens は `used_at` set で再利用阻止 |
| 状態遷移 | — | sync_jobs は ALLOWED_TRANSITIONS を 02b と統一 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 01a DDL 読込 | 1 | pending | 5 テーブル確認 |
| 2 | 01b zod 読込 | 1 | pending | 4 型確認 |
| 3 | 責務一覧文書化 | 1 | pending | 5 repo + 3 tooling + 1 loader |
| 4 | 不変条件マッピング表 | 1 | pending | #5/#6/#11/#12 |
| 5 | AC test 戦略 mapping | 1 | pending | AC-1〜AC-11 |
| 6 | handoff interface 抽出 | 1 | pending | 下流 6 タスク向け |
| 7 | 02a/02b との `_shared` 正本合意 | 1 | pending | 書面化 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 の主成果物 |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] 主成果物 `outputs/phase-01/main.md` が作成済み
- [ ] 不変条件 #5 / #6 / #11 / #12 が「どの tool / file で守るか」表で書かれている
- [ ] AC-1〜AC-11 が test 戦略にマップ済み
- [ ] 03a/b / 04c / 05a/b / 07c / 08a 向け handoff interface 一覧が完成
- [ ] 02a / 02b との `_shared/` 正本所在が合意済み

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が completed
- [ ] outputs/phase-01/main.md が指定パスに配置
- [ ] 完了条件 5 項目に全てチェック
- [ ] 不変条件 #5 / #6 / #11 / #12 への対応が表で確認可能
- [ ] artifacts.json の Phase 1 を completed に更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ事項: 責務一覧 / 公開 interface 文章版 / 不変条件マッピング表 / `_shared` 正本合意
- ブロック条件: outputs/phase-01/main.md が未作成、または `_shared` 正本所在が 02a / 02b と矛盾していたら Phase 2 に進めない
