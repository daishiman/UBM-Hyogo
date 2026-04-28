# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 2 (設計) |
| 下流 | Phase 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 2 で確定した module 構造 / 公開 interface に対し、**3 つ以上の alternative** を出してトレードオフを比較し、PASS / MINOR / MAJOR 判定を下す。

## alternative 案 (3 案以上)

### 案 A: 採用案 = 「責務単位 8 ファイル + builder 1」

- **構造**: `members.ts` / `identities.ts` / `status.ts` / `responses.ts` / `responseSections.ts` / `responseFields.ts` / `fieldVisibility.ts` / `memberTags.ts` + `_shared/builder.ts`
- **メリット**:
  - 責務 1:1、test fixture も table 単位
  - 03b 同期は `responses.ts` + `identities.ts` + `status.ts` の 3 ファイルだけ touch すれば良い
  - 04* は `builder.ts` だけ呼べば view model が組める
- **デメリット**:
  - ファイル数が多い（9）
  - import 文が増える

### 案 B: ドメイン単位「memberRepo.ts」1 ファイル + helpers/

- **構造**: `member.ts` 単一ファイルで全機能を export
- **メリット**:
  - import 1 行で全機能利用可
  - ファイル数 1
- **デメリット**:
  - test 時に必要な機能だけ mock しづらい
  - 不変条件 #4 / #11（response 本文 immutable）の表現が弱まる
  - 03b sync が member 全体を touch する形になり diff 範囲が読めない

### 案 C: ORM (drizzle / kysely) 全面採用

- **構造**: 各 table を drizzle schema として定義し、query builder で書く
- **メリット**:
  - 型安全な query
  - column 名変更が型で検出される
- **デメリット**:
  - bundle size 増（Workers 1MB / 10MB 制限を意識）
  - Workers + D1 環境での drizzle 互換に migration risk
  - 学習コスト増、4/04* タスクとの並列着手が遅れる

### 案 D: GAS prototype 互換の単一 store

- **構造**: GAS prototype の `data.jsx` 形式を再現する単一 in-memory store
- **メリット**:
  - prototype 互換性が高い
- **デメリット**:
  - 不変条件 #6（GAS prototype 本番昇格禁止）違反
  - D1 を使わず無料枠 5GB の意味が消える
- **判定**: 即却下

## トレードオフ比較表

| 観点 | 案 A | 案 B | 案 C | 案 D |
| --- | --- | --- | --- | --- |
| 不変条件 #4 / #11 表現力 | ◎ | △ | ○ | ✗ |
| 不変条件 #5 D1 boundary | ◎ | ○ | ○ | ✗ |
| 不変条件 #6 GAS 非昇格 | ◎ | ◎ | ◎ | ✗ |
| 不変条件 #7 型混同防止 | ◎ | ○ | ◎ | ✗ |
| 03b/04*/08a 並列着手 | ◎ | △ | △ | ✗ |
| Workers bundle size | ◎ | ◎ | △ | ◎ |
| test fixture 単位 | ◎ | △ | ○ | ✗ |
| 学習コスト | ○ | ◎ | △ | ◎ |
| 採否 | **採用** | 不採 | 不採 | 却下 |

## PASS-MINOR-MAJOR 判定

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 全体設計 | PASS | 案 A は不変条件 #4/#5/#7/#11/#12 を構造で守る |
| Workers bundle | PASS | drizzle 不採用で素の D1 prepared statement、bundle 増なし |
| 並列着手性 | PASS | 03b は 3 ファイルだけ touch、04* は builder だけ呼ぶ |
| 学習コスト | MINOR | branded type 利用箇所で `memberId(str)` の wrap が必要 |
| ファイル数 | MINOR | 9 ファイルだが、責務 1:1 なので保守容易 |
| 重大 blocker | なし | MAJOR 該当なし |

総合判定: **PASS（MINOR 2 件は許容、Phase 4 へ進む）**

## レビューチェックリスト

- [x] 不変条件 #4 を responses.ts 設計で守れるか
- [x] 不変条件 #5 を repository 配置場所で守れるか
- [x] 不変条件 #7 を branded type で守れるか
- [x] 不変条件 #11 を admin context にも適用できるか
- [x] 不変条件 #12 を builder の interface で守れるか
- [x] 無料枠 D1 read 500k/day を N+1 排除で守れるか
- [x] 02b / 02c との相互 import が dependency-cruiser で阻止できるか
- [x] 03b / 04a / 04b / 08a が並列で着手可能な interface か

## 実行タスク

1. 4 案を文書化（案 A / B / C / D）
2. トレードオフ比較表作成
3. PASS-MINOR-MAJOR 判定
4. 採用理由を outputs/phase-03/main.md に記録
5. MINOR 項目への対処を Phase 5 (実装ランブック) に申し送り

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs/phase-02/* | レビュー対象 |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 2 全体方針 |
| 参考 | doc/00-getting-started-manual/specs/04-types.md | 型レイヤ 4 層 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | レビュー結果から verify suite を起こす |
| Phase 5 | MINOR 項目への対処を runbook に反映 |
| Phase 10 | GO/NO-GO 判定の上流根拠 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 案 A の責務分離 | #4, #11 | response 本文 partial update / patch を 9 ファイルどこにも置かない |
| 案 C 不採用 | #10 | Workers bundle size 制限を見越した判断 |
| 案 D 即却下 | #6 | GAS prototype を本番昇格させない |
| import 構造 | #5, #12 | 02b/02c との相互 import が dependency-cruiser で阻止 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 案文書化 | 3 | completed | A/B/C/D |
| 2 | 比較表 | 3 | completed | 不変条件軸 |
| 3 | 判定 | 3 | completed | PASS-MINOR-MAJOR |
| 4 | 採用理由 | 3 | completed | main.md 記録 |
| 5 | MINOR 申し送り | 3 | completed | Phase 5 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 判定 + 採用理由 |
| ドキュメント | outputs/phase-03/alternatives.md | 4 案詳細とトレードオフ表 |

## 完了条件

- [ ] alternative 4 案が文書化済み
- [ ] 比較表が不変条件軸で評価済み
- [ ] PASS / MINOR / MAJOR 判定が明示
- [ ] 採用理由が outputs に記録

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-03/{main,alternatives}.md が配置済み
- [ ] PASS 判定が下されている（MAJOR 0 件）
- [ ] artifacts.json の Phase 3 を completed に更新

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A / MINOR 2 件
- ブロック条件: PASS 判定が出ない場合は Phase 2 に戻る
