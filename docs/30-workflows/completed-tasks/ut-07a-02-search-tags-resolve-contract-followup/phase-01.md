# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

「07a で確定した resolve API の discriminated union 契約を、apps/web admin client の型・08a contract test・正本仕様 / implementation-guide の 4 層に伝播させ drift を解消する」という単一責務に scope を固定する。
本タスクは tag queue resolve workflow 本体の再設計や staging smoke（UT-07A-03）を含まない。

---

## 実行タスク

1. 上流 07a の Phase 12 完了状況（`outputs/phase-12/implementation-guide.md` の body shape 記述）を点検する
2. 正本仕様 `docs/00-getting-started-manual/specs/12-search-tags.md` の resolve API 節と 07a implementation-guide の body shape を突き合わせ drift を抽出する
3. apps/web 配下の admin API client（`apps/web/src/**/admin*` / `lib/api*` 等）における `resolveTagQueue` 呼び出し箇所と引数型を grep ベースで全列挙する
4. 既存の 08a contract test（`apps/api/test/**` または `tests/contract/**`）における resolve API 関連 fixture / case 一覧を抽出する
5. 06c 由来の「空 body 時代」記述が残っている doc / code を全て検出する（`resolveTagQueue(queueId)` 単独呼び出しなど）
6. 4 条件（価値性・実現性・整合性・運用性）を仮判定し、open question を 3 件未満に整理する

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | 正本契約（discriminated union）|
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/implementation-guide.md | 上流実装指示書 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API 一覧と body shape |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | admin client 構造 |
| 必須 | .claude/skills/aiworkflow-requirements/references/lessons-learned-07a-tag-queue-resolve-2026-04.md | L-07A-001 / L-07A-005 |
| 参考 | apps/web/ | client 実装の現状調査対象 |
| 参考 | apps/api/ | route 実装と contract test の参照元 |

---

## 実行手順

### ステップ 1: 上流 07a の AC 引き継ぎ確認
- 07a の Phase 12 implementation-guide が discriminated union を採用しているか確認
- 仕様語 `confirmed` ↔ DB enum `resolved` の alias 表が 07a 側で確定済みか確認
- Phase 12 完了タグ（artifacts.json `phase: 12, status: completed`）を点検

### ステップ 2: drift inventory の作成
- 正本仕様（12-search-tags.md L99-L114）の body shape を真とする
- apps/web client の resolve 呼び出し箇所を `rg "resolveTagQueue"` で全列挙
- 旧契約（空 body）と新契約（discriminated union）の差分を「修正対象 / 既追従済」で分類
- 06c 系 docs に残る stale 記述（L-07A-005）を別表で記録

### ステップ 3: AC リストアップ
- AC-1: `resolveTagQueue` の TypeScript 型が discriminated union に一致する
- AC-2: 08a contract test に `confirmed` 成功ケースが存在する
- AC-3: 08a contract test に `rejected` 成功ケースが存在する
- AC-4: 08a contract test に validation error（400: action 欠落 / tagCodes 空 / reason 空）ケースが存在する
- AC-5: 08a contract test に同一 payload 再投入 idempotent（200 + `idempotent: true`）ケースが存在する
- AC-6: 12-search-tags.md と implementation-guide.md の body shape が文字列レベルで一致する
- AC-7: 06c 由来の旧契約記述が残存していない（grep でゼロ件）

### ステップ 4: 4 条件 仮判定 + 次 Phase 引き継ぎ
- 価値性 / 実現性 / 整合性 / 運用性を「PASS / TBD」で仮判定
- blocker（07a Phase 12 未完了 / shared schema の置き場が未定 など）を記録

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | drift inventory を「追従対象表」と alias 表に展開 |
| Phase 4 | AC を 08a contract test ケース表にマップ |
| Phase 7 | AC マトリクスの base としてここで列挙した AC-1〜AC-7 を使う |
| Phase 10 | 4 条件判定を GO/NO-GO 判定の根拠として再利用 |
| 後続 UT-07A-03 | 本タスクで型整合した admin client を staging smoke の前提とする |

---

## 多角的チェック観点（不変条件）

- 不変条件 #11（admin は本人本文を直接編集できない）: resolve 経路が `member_tags` 経由のタグ確定のみで本文を触らないことを Phase 4 で test 化
- 不変条件 #5（apps/web → D1 直接禁止）: client 型変更によって D1 binding を apps/web 側に持ち込まないことを lint で再確認（薄め検証）
- 不変条件 #2（consent キー統一）: 本タスクは resolve API 契約のみで consent 系に触れない（影響なしを明記）
- 無料枠制約（不変条件 #10）: 契約変更のみで request volume 増減なし（薄め検証）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 07a Phase 12 完了確認 | 1 | pending | implementation-guide.md の body shape |
| 2 | apps/web client の resolveTagQueue 呼び出し全列挙 | 1 | pending | rg ベース |
| 3 | 08a contract test 既存 fixture 点検 | 1 | pending | confirmed/rejected/validation/idempotent |
| 4 | drift inventory 作成 | 1 | pending | spec ↔ guide ↔ client ↔ test |
| 5 | AC-1〜AC-7 列挙 | 1 | pending | Phase 7 マトリクスの base |
| 6 | 4 条件仮判定 | 1 | pending | Phase 10 で最終判定 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope / drift inventory / AC-1〜AC-7 / 4 条件仮判定 / open question |
| メタ | artifacts.json | Phase 1 を completed に更新 |

---

## 完了条件

- [ ] `outputs/phase-01/main.md` が AC-1〜AC-7 を含めて書かれている
- [ ] 上流 07a Phase 12 の AC 引き継ぎ状況が「達成済み / 部分 / 未達」のいずれかでマーク済み
- [ ] drift inventory に「修正対象 / 既追従済」の 2 列で全エントリが分類済み
- [ ] 4 条件が「PASS / TBD」のいずれかで仮判定済み
- [ ] open question が 3 件未満（多い場合は Phase 3 で alternative 検討）

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-01/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 上流 07a Phase 12 が未完了の場合は本タスクをブロックし、本 Phase で NO-GO 候補としてマーク
- artifacts.json の phase 1 を completed に更新

---

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: drift inventory / AC-1〜AC-7 / 4 条件仮判定 / open question / blocker 一覧
- ブロック条件: 上流 07a Phase 12 が未完了、または drift inventory に分類不能エントリが残る場合は次 Phase に進まず Phase 10 で NO-GO 候補とする

---

## 真の論点

- shared zod schema を新設して apps/api / apps/web 双方で参照すべきか、それとも apps/web 側で TypeScript type のみ複製すべきか（Phase 3 で alternative として比較）
- 08a contract test を「正本仕様の body shape を import して runtime 検証する」スタイルにするか、ハードコードした fixture でケース個別に書くか
- 06c の旧 docs に残る空 body 記述を「削除」するか「履歴として注記付きで残す」か（後者は drift 検出を弱める）
- DB enum 語（`resolved` / `rejected`）と仕様語（`confirmed` / `rejected`）の alias 表をどこの正本に置くか（12-search-tags.md か api-endpoints.md か）

---

## 依存境界

- 本タスクが触る: apps/web admin client の resolveTagQueue 型定義 / 08a contract test の resolve API ケース / 12-search-tags.md ↔ 07a implementation-guide.md の body shape 整合 / api-endpoints.md と architecture-admin-api-client.md の記述同期
- 本タスクが触らない: tag queue resolve workflow 本体（07a で確定済み）/ staging 並行 POST smoke（UT-07A-03）/ tag dictionary 編集 UI / member_tags の DB スキーマ変更

---

## 価値とコスト

- 初回価値: client 実装と contract test を正本契約に追従させ、空 body 旧契約を呼び出して 400 を踏むリスクを排除する
- 初回で払わないコスト: staging deploy / production smoke（UT-07A-03 で対応）/ tag queue UI の再設計

---

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | client / test を正本契約に揃えることで本当に regression リスクを下げるか | PASS（07a Phase 12 で正本契約は確定済み・あとは伝播のみ） |
| 実現性 | 中規模スコープで 1〜2 営業日の差分修正で完了するか | TBD（apps/web 側の呼び出し箇所数が drift inventory で確定） |
| 整合性 | 07a 本体（workflow）と UT-07A-03（staging smoke）と scope が重複しないか | PASS（scope 定義で重複なし） |
| 運用性 | 失敗時に 07a 本体ではなく本タスクのみ差し戻せる経路が明確か | PASS（contract 伝播のみで本体に影響しない） |
