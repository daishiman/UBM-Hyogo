# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6（異常系検証） |
| 次 Phase | 8（DRY 化） |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜AC-12 を、Phase 4 の verify suite と Phase 5 の runbook step に一対一対応させ、抜け漏れがないことを matrix で保証する。Phase 6 の failure case (F-1〜F-22) を AC trace に組み込み、Phase 10 の GO/NO-GO 判定の入力とする。

## AC matrix

| AC | 要件（Phase 1） | 検証（Phase 4） | 実装 step（Phase 5） | failure cover（Phase 6） | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 公開フィルタで不適格 member 0 件 | leak suite (declined / hidden / deleted) + contract `GET /public/members` | Step 1 (public-filter), Step 6 (use-case), Step 7 (handler) | F-1, F-2, F-3 | #2, #11 |
| AC-2 | `PublicMemberProfile` 型 + leak keys ゼロ | contract `GET /public/members/:memberId` zod parse + unit `to-public-member-profile` | Step 5-3 (view), Step 6 (use-case) | F-16 | #3, #11 |
| AC-3 | `FieldVisibility != 'public'` の field ゼロ | unit `visibility-filter` + contract `GET /public/members/:memberId` | Step 4 (visibility-filter), Step 5-3 (view) | F-19 | #1 |
| AC-4 | 不適格 / 不在 memberId は 404（403 ではない） | leak suite 404 三種 + contract not found | Step 6 (existsPublic + 404) | F-1, F-2, F-3, F-4 | #11 |
| AC-5 | `tag` repeated query は AND 条件 | search test `tag=ai&tag=dx` + integration | Step 6-2 (use-case + tag subquery) | F-8 | - |
| AC-6 | 不正 query は default にフォールバック | unit `search-query-parser` 不正値 fallback | Step 2 (search-query-parser) | F-5, F-6 | - |
| AC-7 | `lastSync` が `ok / running / failed / never` のいずれか | unit `to-public-stats` + contract `GET /public/stats` | Step 5-1 (stats view), Step 6-1 (use-case) | F-13, F-14, F-15 | - |
| AC-8 | `form-preview` が 31 項目 / 6 セクション + responderUrl 一致 | contract `GET /public/form-preview` 31 fields / 6 sections | Step 4 + Step 5-4 + Step 6-4 | F-12, F-20 | #1, #14 |
| AC-9 | 全 endpoint 未認証で 200 | authz suite 未ログイン 200 (4 endpoint) | Step 8 (router マウント、session middleware 不適用) | F-22 (OPTIONS) | #5 |
| AC-10 | 検索対象列が公開可能フィールドに限定 | unit `search-query-parser` (system field 除外) + integration | Step 2 (parser), Step 6-2 (use-case SQL) | F-9 (`responseEmail` 検索拒否) | #3 |
| AC-11 | pagination 既定 limit=24, 上限 100 で clamp | unit `pagination` (clamp / offset) + search test `limit=200` | Step 2 (parser), Step 3 (pagination) | F-7 | #10 |
| AC-12 | response payload 自動圧縮 | manual smoke で gzip / brotli 確認 | Step 7 (handler、何もしない / Cloudflare 標準) | F-21 | - |

## 不変条件 → AC 逆引き

| 不変条件 | 対応 AC | 補足 |
| --- | --- | --- |
| #1（schema 固定禁止） | AC-3, AC-8 | visibility / form-preview を schema_questions 動的取得 |
| #2（consent キー統一） | AC-1 | `publicConsent='consented'` のみ表現 |
| #3（`responseEmail` system field） | AC-2, AC-10 | converter で delete + 検索対象除外 |
| #4（profile 本文 D1 override 禁止） | 構造的に保証 | 本タスクは read のみ |
| #5（apps/web → D1 直禁止） | AC-9 (構造) | D1 access は本 API 経由 |
| #10（無料枠） | AC-11 | limit clamp、write 0 |
| #11（admin-managed 分離） | AC-1, AC-2, AC-4 | `adminNotes` 除外、不適格 404 で隠蔽 |
| #14（schema 集約） | AC-7, AC-8 | sync_jobs 状態 + form-preview 動的 |

## failure case → AC 逆引き

| Failure case | 対応 AC |
| --- | --- |
| F-1, F-2, F-3 | AC-1, AC-4 |
| F-4 | AC-4 |
| F-5, F-6 | AC-6 |
| F-7 | AC-11 |
| F-8 | AC-5 |
| F-9 | AC-10 |
| F-10 | AC-6（衛生） |
| F-11, F-19 | AC-3, AC-4 |
| F-12, F-20 | AC-8 |
| F-13, F-14, F-15 | AC-7 |
| F-16 | AC-1, AC-2 |
| F-17 | 残存リスク（Phase 10） |
| F-18 | AC-1（empty 配列 OK） |
| F-21 | AC-12 |
| F-22 | AC-9 |

## トレース完全性チェック

- [ ] AC-1〜AC-12 のすべてに verify suite が紐づく
- [ ] AC-1〜AC-12 のすべてに runbook step が紐づく
- [ ] F-1〜F-22 のすべてが少なくとも 1 つの AC または残存リスクに紐づく
- [ ] 不変条件 #1, #2, #3, #4, #5, #10, #11, #14 がすべて AC か構造で保証

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC 由来 |
| 必須 | outputs/phase-04/test-matrix.md | verify suite |
| 必須 | outputs/phase-05/api-runbook.md | runbook step |
| 必須 | outputs/phase-06/failure-cases.md | failure cover |
| 必須 | docs/30-workflows/_design/phase-1-requirements.md | 不変条件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化を AC matrix と矛盾しない範囲で評価 |
| Phase 10 | GO/NO-GO の根拠 |
| 08a | matrix を取り込み test 実装 |

## 多角的チェック観点（不変条件マッピング）

- 全不変条件を逆引き表で網羅（理由: Phase 10 GO/NO-GO の入力）
- AC × verify × runbook の三角形が完成しない row があれば NO-GO（理由: 抜け漏れ防止）
- failure case が AC trace なし or 残存リスク扱いでもいいが、明示記録が必須

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成 | 7 | pending | outputs/phase-07/ac-matrix.md |
| 2 | 不変条件逆引き | 7 | pending | main.md |
| 3 | failure case 逆引き | 7 | pending | main.md |
| 4 | トレース完全性チェック | 7 | pending | チェックリスト 4 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 主成果物 |
| ドキュメント | outputs/phase-07/ac-matrix.md | matrix 詳細 |
| メタ | artifacts.json | Phase 7 を `completed` に更新 |

## 完了条件

- [ ] AC matrix の全 row（AC-1〜AC-12）が埋まる
- [ ] 不変条件 → AC 逆引きが完成
- [ ] failure case → AC 逆引きが完成
- [ ] トレース完全性チェック 4 項目すべて pass

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 7 を `completed` に更新

## 次 Phase

- 次: 8（DRY 化）
- 引き継ぎ事項: matrix を破壊しない範囲で helper / converter / schema の共通化候補を抽出
- ブロック条件: matrix に空欄があれば次 Phase に進まない
