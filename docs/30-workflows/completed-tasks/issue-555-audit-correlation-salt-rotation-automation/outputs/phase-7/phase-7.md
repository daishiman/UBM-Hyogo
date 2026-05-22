# Phase 7: correlate.ts 実装（v1 + v2 group merge）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/src/audit-correlation/correlate.ts` |
| 実装区分 | 実装仕様書（pure function 拡張） |

## 目的

`groupByActor` 関数を拡張し、record 集合に v1 / v2 fingerprint hash が混在する場合でも「同一 actor」を 1 group に統合する。これにより rotation 期間（dual-hash 期間 7 日想定）を跨ぐ HIGH alert 検知が分裂しない連続性を担保する。既存 HIGH severity 判定（時系列順 IP 急変検知）は無変更とし、副作用なしの pure function 維持を不変条件とする。

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `apps/api/src/audit-correlation/correlate.ts` | 既存編集 |

## アルゴリズム

入力は既存 `NormalizedAuditEvent` 列。新形式 record は `fingerprintHashes.v1?` と `fingerprintHashes.v2` を持つ。既存 v1 record は `fingerprintHashes` を持たず `fingerprintHash` + `fingerprintVersion: 1` のみで流入しうるため、最初に adapter で `fingerprintHashes.v1 = fingerprintHash` へ正規化する。

### Union-Find ベースの group merge

```
1) 各 record を正規化する。v2 があれば「初期 group key」は fingerprintHashes.v2、v1-only legacy は fingerprintHashes.v1 を採用する。
2) v1 hash が存在する record について、(v1, v2) ペアを「同一 group」として union する。
3) また、ある record A が { v2: X } のみ、別 record B が { v1: X, v2: Y } を持つ場合、
   X 経由で A と B を同一 group に統合する（B の v1 が A の v2 と一致するため）。
4) 1 pass で v1/v2 hash を逆引き Map に登録し、衝突時に union を実行する。
5) 最終 group は「代表 v2 hash」をキーとして export する。
```

データ構造（擬似コード）:

```ts
const parent = new Map<string, string>(); // hash -> root hash
function find(h: string): string { /* path compression */ }
function union(a: string, b: string): void { /* by-rank or by-size */ }

for (const r of records) {
  const v2 = r.fingerprintHashes.v2;
  if (!parent.has(v2)) parent.set(v2, v2);
  const v1 = r.fingerprintHashes.v1;
  if (v1) {
    if (!parent.has(v1)) parent.set(v1, v1);
    union(v1, v2);
  }
}

// group key は find(v2)
const groups = new Map<string, ActorGroup>();
for (const r of records) {
  const key = find(r.fingerprintHashes.v2);
  pushOrCreate(groups, key, r);
}
```

### 計算量

- 1 record あたり償却 O(α(N)) ≈ O(1)。
- 全体 O(N · α(N))。N=10^4 程度を想定し、現行 correlate.ts の単純 group 化（O(N)）からの劣化は無視できる範囲。

## 関数シグネチャ

```ts
export interface ActorGroup {
  /** 代表 hash（union-find の root v2 hash） */
  groupKey: string;
  /** group に属する record。時系列順は呼び出し側の入力順を保持 */
  records: NormalizedAuditEvent bridge shape[];
}

export function groupByActor(
  records: NormalizedAuditEvent bridge shape[],
): ActorGroup[];
```

入出力:

| 項目 | 内容 |
| --- | --- |
| 入力 | 時系列順 `NormalizedAuditEvent bridge shape[]`（Phase 6 が出力する shape）|
| 出力 | `ActorGroup[]`。group 内 record は入力順を保持 |
| 副作用 | なし（pure） |

## HIGH severity 判定との関係

既存 HIGH severity 判定は group 単位で「短時間内 IP 急変」を検知する。本 Phase の merge 拡張により、rotation を跨いで同一 actor の event が 1 group に統合され、IP 急変検知が rotation 直前/直後で分裂しない。

判定ロジック自体（しきい値 / 時間窓）は **無変更**。group 化結果のみが拡張される。

## 異常系

| 条件 | 挙動 |
| --- | --- |
| `fingerprintHashes.v1` のみ存在し `v2` 欠落 | legacy v1 として許容。adapter で v1-only group に入れ、同 window 内の bridge record と union できる場合だけ v2 group へ連結 |
| 全 record が single-hash（v2 のみ） | 既存挙動と等価。union 操作は発生しない |
| 全 record が rotation 期間中（v1 + v2 両方持ち） | union が発生し、v1 = 旧 actor の v2 と一致する record と group merge |
| 入力が空配列 | 空配列を返す |

## テスト方針（Phase 10 と連携）

vitest fixture は `apps/api/src/audit-correlation/__tests__/fixtures/rotation/`（Phase 4 で計画）配下を利用:

- v1-only（rotation 前のレガシー入力 simulating）→ 1 group / 連続性維持
- v2-only（rotation 終了後）→ 1 group
- v1+v2 mix（rotation 期間中）→ 旧 actor の v2 hash と新 record の v1 hash が一致して 1 group に merge
- merge により HIGH severity が rotation 直前/直後で発火し続けることを assert
- 入力順序を逆転させても同一 group 結果（決定論性）

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run audit-correlation/correlate \
  | tee outputs/phase-7/correlate-test.log
```

## 完了条件（DoD）

- [ ] union-find ベースの merge アルゴリズム仕様確定。
- [ ] `groupByActor` シグネチャ確定。
- [ ] 既存 HIGH severity 判定が無変更であることが明記。
- [ ] pure function 不変条件が明記。
- [ ] 決定論性（入力順序逆転で同一結果）の test 観点が列挙。
- [ ] 計算量見積もり（O(N · α(N))）が明記。

## 次 Phase 連携

- Phase 8 の rotation script は本 Phase の merge 動作を前提に「rotation 期間 7 日」のデフォルトを設定する。
- Phase 11 staging evidence で「dual-hash 期間中の HIGH alert 連続性」が観察される根拠は本 Phase の group merge。
