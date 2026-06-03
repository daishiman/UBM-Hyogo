# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-06-02 |
| Wave | 0 |
| 実行種別 | serial |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / implementation_mode: new |
| 実装区分 | **実装仕様書**（コード変更を伴う / CONST_004 デフォルト） |

## 目的

`apps/api/src/use-cases/public/list-public-members.ts` に残る fields N+1 を、`response_id IN (...)`
の 1 batch query へ置換して解消するための要件を固定する。tags 側は issue-224 で
`listTagsByMemberIds` により batch 化済みであり、本タスクは同一 use-case の summary fields ループ
（member 毎に 1 query）を対称的に batch 化する積み残しを実装可能粒度で確定する。

## 真の論点 (true issue)

- 本タスクの本質は「公開一覧の summary fields 取得が member 件数 N に比例して `response_fields`
  クエリを N 回発行している」ことを、**view 出力 `PublicMemberListResponse` の形状・値を一切変えずに**
  1 query へ畳むこと。
- 副次論点: (1) groupBy キーは tags=`member_id` に対し fields=`current_response_id`(=`response_id`)
  であり、混同すると引き当てが破綻する（F-2）。(2) 初回調査が実コードと食い違った前例があるため
  （F-1）、helper のシグネチャ・返り値型・引き当てキーを実ファイルから verbatim 確認した上で
  設計する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の新規実装（implementation_mode: new）とする |
| upstream（main/dev）にマージ済み | No | 未実装。`list-public-members.ts:97-101` に per-member ループが現存 |
| 前提タスク（依存タスク）が完了済み | Yes | issue-224（tags batch）は landed 済み。本タスクは独立して着手可能（depends_on 空） |

## 現状コード（verbatim 確認結果 / F-1 対応）

### 問題箇所: `apps/api/src/use-cases/public/list-public-members.ts`

```ts
// L94-121（抜粋）: summary fields を 1 query / member で取得 = fields N+1
const items: PublicMemberListItemSource[] = [];
for (const m of memberRows) {
  const fields = await listFieldsByResponseId(
    ctx,
    m.current_response_id as never,
  );
  const byKey = new Map<string, string | null>();
  for (const f of fields) {
    if ((SUMMARY_KEYS as readonly string[]).includes(f.stable_key)) {
      byKey.set(f.stable_key, f.value_json);
    }
  }
  items.push({ memberId: m.member_id, fullName: ..., /* 以下 byKey 引き当て */ });
}
```

### 既 batch 化済みの対称実装（tags 側 / 流用元）: 同ファイル L82-92

```ts
const memberIds = memberRows.map((m) => asMemberId(m.member_id));
const tagRows = await listTagsByMemberIds(ctx, memberIds); // 1 query・フラット配列
tagsByMember = new Map();
for (const r of tagRows) {
  const arr = tagsByMember.get(r.member_id) ?? [];
  arr.push({ code: r.code, label: r.label, category: r.category });
  tagsByMember.set(r.member_id, arr);
}
```

### repository の現状: `apps/api/src/repository/responseFields.ts`

- `listFieldsByResponseId(c, rid: ResponseId): Promise<ResponseFieldRow[]>` のみ存在（単数）。
- batch 版 `listFieldsByResponseIds`（複数）は **未実装**。
- `ResponseFieldRow` は `{ response_id, stable_key, value_json, raw_value_json }`。`response_id` 列を
  保持するため、フラット配列を `response_id` でキー化した groupBy が可能。

### 流用すべき共通部品

- `placeholders(n)`（`apps/api/src/repository/_shared/sql.ts`）: `?1,?2,...` を生成。`listTagsByMemberIds`
  と同じ IN 句構築に使う。
- `asResponseId`（`@ubm-hyogo/shared` / `apps/api/src/repository/_shared/brand.ts` 経由）: `current_response_id`
  を `ResponseId` brand へ変換する正本 helper。

## 価値とコスト

- 価値: 公開一覧（最大 limit 100）の fields クエリを N 回 → 1 回に削減。表示遅延の顕在化前に
  N+1 を恒久解消し、tags 側と読み取り経路の対称性を回復する。
- コスト: repository に 1 関数追加 + use-case のループ 1 箇所置換 + テスト 2 ファイル拡充。小。
- 機会コスト: D1 schema 変更・endpoint 追加なしで完結するため、運用負荷追加なし。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | N+1 を ≦1 query に削減。公開一覧の DB ラウンドトリップが member 件数に依存しなくなる |
| 実現性 | PASS | `listTagsByMemberIds` と同型の batch helper + Map groupBy で実装可能。新規概念なし |
| 整合性 | PASS | 不変条件 #5（D1 は apps/api 内）維持。view 出力形状不変で fail-close（#2/#3/#11）に非接触 |
| 運用性 | PASS | schema/endpoint 不変。ロールバックは 1 コミット revert で復元可能 |

## 実行タスク

1. 問題箇所（`list-public-members.ts:94-121` の per-member fields ループ）を fields N+1 として確定する（完了条件: 本 Phase に verbatim 引用済み）。
2. helper シグネチャ・返り値型・引き当てキーを実ファイルから verbatim 確認する（完了条件: F-1/F-2 を本 Phase に記録済み）。
3. groupBy キーが fields=`current_response_id`(=`response_id`) であることを固定する（完了条件: F-2 として明記）。
4. 受入条件 AC-1〜AC-6 を `index.md` と一致させる（完了条件: index.md と同値）。
5. タスク種別を implementation / NON_VISUAL / implementation_mode: new で固定する（完了条件: artifacts.json.metadata と一致）。
6. スコープ外（tags / D1 schema / endpoint / Google Form / apps/web）を明記する（完了条件: §スコープに記載）。
7. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/issue-224-followup-001-public-members-fields-batch-fetch-n1-prevention.md | 由来仕様書（F-1/F-2/F-3 の知見元） |
| 必須 | apps/api/src/use-cases/public/list-public-members.ts | 問題箇所（fields N+1） |
| 必須 | apps/api/src/repository/responseFields.ts | helper 追加先 |
| 必須 | apps/api/src/repository/memberTags.ts | `listTagsByMemberIds` batch 流用元 |
| 必須 | apps/api/src/repository/_shared/sql.ts | `placeholders` |
| 参考 | apps/api/src/repository/__tests__/responseFields.repository.spec.ts | repository テスト拡充先 |
| 参考 | apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts | use-case 回帰テスト追加先 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- `listFieldsByResponseIds` の repository 追加仕様
- `list-public-members.ts` のループ → Map groupBy 置換仕様
- fields クエリ数 ≦ 1 の回帰テスト仕様
- view 出力 `PublicMemberListResponse` 不変の保証仕様

### 含まない

- tags 側ロジックの変更（issue-224 で完了済み）
- D1 schema 変更 / 新 endpoint / Google Form 仕様変更 / `apps/web` 変更（不変条件 #5）
- pagination / filter / sort ロジックの変更
- Issue #1059 の状態変更（OPEN のまま）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（問題箇所 / F-1 / F-2 / AC / 4 条件評価） |
| メタ | artifacts.json | Phase 1 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・helper シグネチャ・groupBy キー・スコープ境界を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-6 をテスト戦略のトレース対象に渡す |
| Phase 5 | 実装ランブックの起点（helper 追加 + ループ置換） |
| Phase 11 | NON_VISUAL 宣言と自動テスト証跡の方針を渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] fields N+1 の問題箇所が verbatim 引用で確定している
- [x] F-1（helper シグネチャ verbatim 確認）/ F-2（groupBy キー = response_id）が記録されている
- [x] AC-1〜AC-6 が `index.md` と一致している
- [x] タスク種別 implementation / NON_VISUAL / implementation_mode: new が固定されている
- [x] スコープ外が明記されている
- [x] 4 条件評価が全 PASS で確定している

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が completed
- 成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（F-1 初回調査食い違い / F-2 groupBy キー混同）が本 Phase の記録で予防されている
- artifacts.json の `phases[0].status` が completed

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - helper `listFieldsByResponseIds(c, rids: ResponseId[])` を `listTagsByMemberIds` と同型で設計
  - groupBy キー = `current_response_id`(=`response_id`)（F-2）
  - 出力 `PublicMemberListResponse` の形状・値は不変
  - 流用部品: `placeholders` / `asResponseId`
- ブロック条件:
  - helper シグネチャ確認が実ファイルと乖離
  - 4 条件のいずれかに MAJOR が残る
