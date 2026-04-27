# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 5 (実装ランブック) |
| 下流 | Phase 7 (AC マトリクス) |
| 状態 | completed |

## 目的

repository 層の異常系を「**起こりうる事故 / D1 由来失敗 / 認可境界違反**」の 3 軸で洗い、Phase 5 runbook で対処済みかを確認する。

## failure cases

### 軸 1: D1 由来失敗

| ID | ケース | 期待 repository 動作 | 期待エラー shape |
| --- | --- | --- | --- |
| F-1 | `member_identities.current_response_id` が `member_responses` に存在しない | `findCurrentResponse` が `null` を返す（throw しない） | builder で `null` 返却 |
| F-2 | `member_status` row が無い memberId | `getStatus` が `null` を返す | builder が `null` 返却 |
| F-3 | `member_responses.answers_json` が壊れた JSON | parse 失敗を `Error("InvalidAnswersJson")` で throw | 03b sync の retry で吸収 |
| F-4 | D1 接続失敗（5xx） | repository は throw、builder で catch して null 返却（route 層で 5xx に変換） | `D1Error` chain の保持 |
| F-5 | UNIQUE 制約違反（`response_email`） | `upsertMember` の ON CONFLICT で UPDATE | 例外 throw しない |
| F-6 | `LIMIT 0` の list query | 空配列 `[]` を返す | `null` ではなく `[]` |

### 軸 2: 認可境界違反（不変条件）

| ID | ケース | 期待動作 | 守る不変条件 |
| --- | --- | --- | --- |
| A-1 | `is_deleted = 1` の member を `buildPublicMemberProfile` | `null` 返却 | データ漏洩防止 |
| A-2 | `public_consent != 'consented'` の member を public list | items に含まれない | データ漏洩防止 |
| A-3 | `publish_state = 'hidden'` を public list | items に含まれない | データ漏洩防止 |
| A-4 | `publish_state = 'member_only'` を public list | items に含まれない | データ漏洩防止 |
| A-5 | `member_field_visibility.visibility = 'admin'` を public/member view | sections に含まれない | #12 |
| A-6 | `adminNotes` を `PublicMemberProfile` 型に注入試行 | TS コンパイルエラー | #12 |
| A-7 | admin context が `member_responses` 本文を partial update 試行 | API 不在 | #4 / #11 |
| A-8 | `apps/web` から `apps/api/src/repository/*` を import | dep-cruiser で error | #5 |

### 軸 3: 起こりうる事故

| ID | ケース | 期待動作 |
| --- | --- | --- |
| E-1 | `MemberId` の代わりに `ResponseId` を渡す | TS コンパイルエラー（不変条件 #7） |
| E-2 | `findCurrentResponse(c, "raw_string")` で raw string | TS コンパイルエラー（branded type） |
| E-3 | builder が `tags.listTagsByMemberId` を 100 回呼ぶ N+1 | builder 設計で `listTagsByMemberIds`（バッチ）を強制 |
| E-4 | `setPublishState` を session check なしで route から呼ぶ | repository では検証しない（route 層責務）、ただし repository test で「自由に呼べる」ことを確認 |
| E-5 | 削除済み member に対する `setVisibility` | repository は通す（ビジネス validation は API 層）、ただし API 層で 404 |

## 異常系 → runbook 対処マッピング

| ID | runbook での対処 step | 実装 placeholder の該当箇所 |
| --- | --- | --- |
| F-1 | Step 5 builder で `if (!resp) return null` | `buildPublicMemberProfile` 冒頭 |
| F-2 | Step 5 builder で `if (!st) return null` | 同上 |
| F-3 | Step 4 responses.ts の `parseAnswersJson` で try/catch | `parseAnswersJson` 関数 |
| F-4 | repository は throw、builder では catch しない（route 層責務） | runbook Step 4 末尾コメント |
| F-5 | `INSERT ... ON CONFLICT(response_email) DO UPDATE` | `upsertMember` placeholder |
| F-6 | `if (ids.length === 0) return []` ガード | `listMembersByIds` placeholder |
| A-1〜A-5 | builder の if 句で除外 | `buildPublicMemberProfile` / `buildMemberProfile` placeholder |
| A-6 | `PublicMemberProfile = Omit<MemberProfile, ...>` の型定義 | 01b 完了物に依存 |
| A-7 | responses.ts に partial update API なし | 構造で守る |
| A-8 | dep-cruiser ルール | Step 7 |
| E-1, E-2 | brand.ts | Step 2 |
| E-3 | builder で `listTagsByMemberIds(c, ids)` 強制 | `buildPublicMemberListItems` placeholder |
| E-4, E-5 | API 層で validation（このタスクでは scope 外） | 04b/04c へ申し送り |

## 実行タスク

1. failure case 表 3 軸を `outputs/phase-06/failure-cases.md` に作成
2. runbook 対処マッピング表を `outputs/phase-06/main.md` に作成
3. E-3（N+1）について、builder の placeholder を再確認
4. A-7 / A-8 が「構造で守る」ことを検証

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 outputs/phase-05/runbook.md | 対処 step の参照 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | 公開条件 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型混同 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC matrix の検証列に追加 |
| Phase 8 | 共通エラー形を DRY 化候補に |
| 04* / 08a | API 層 validation の入力 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 漏洩防止 | — | A-1〜A-5 が builder で確実に除外 |
| 型混同 | #7 | E-1, E-2 が TS で防御 |
| immutability | #4, #11 | A-7 が API 不在で構造的に防御 |
| boundary | #5 | A-8 が dep-cruiser で防御 |
| view 分離 | #12 | A-5, A-6 が型 + builder ロジック双方で防御 |
| 無料枠 | #10 | E-3 が batch fetch で防御 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-1〜F-6 文書化 | 6 | completed | D1 由来 |
| 2 | A-1〜A-8 文書化 | 6 | completed | 認可境界 |
| 3 | E-1〜E-5 文書化 | 6 | completed | 事故 |
| 4 | runbook 対処マップ | 6 | completed | 19 ケース |
| 5 | API 層 申し送り | 6 | completed | E-4, E-5 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | runbook 対処マップ + API 層申し送り |
| ドキュメント | outputs/phase-06/failure-cases.md | F/A/E ケース全 19 |

## 完了条件

- [ ] F/A/E 計 19 ケースが文書化
- [ ] 各ケースに対処 step or 「構造で防ぐ」が明記
- [ ] API 層申し送り（04b/04c）が抽出済み

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-06/{main,failure-cases}.md が配置済み
- [ ] 不変条件 #4 / #5 / #7 / #11 / #12 / #10 全てに対応 case がある
- [ ] artifacts.json の Phase 6 を completed に更新

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ事項: failure case + runbook 対処
- ブロック条件: 不変条件 5 件のいずれかに対応 case が無い場合 Phase 7 に進めない
