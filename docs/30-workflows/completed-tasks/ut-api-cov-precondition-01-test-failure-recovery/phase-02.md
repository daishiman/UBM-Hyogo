# Phase 2: 設計 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 2 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の F01-F13 を、調査順、修復候補、test fixture / helper 戦略、NON_VISUAL evidence へ落とす。設計は実装準備であり、green 実測や coverage 達成を意味しない。

## 設計方針

| group | failure IDs | primary boundary | design rule |
| --- | --- | --- | --- |
| form sync | F01-F04 | response identity / responseEmail / external form payload | fixture drift と実装 regression を分け、responseId と memberId を混同しない |
| workflow | F05-F06 | schema alias / tag queue status | 仕様語と実装語の alias 表を作り、単発修正で他 endpoint を壊さない |
| repository | F07 | admin member notes query | D1 seed、soft delete、member scope を明示して query expectation を固定する |
| admin authz | F08-F11 | public/member/admin boundary | unauthorized は 401、forbidden は 403 の契約差を維持する |
| member auth | F12 | `/me` session boundary | session missing path は 401 とし、apps/web から D1 へ直接アクセスしない |
| auth route timeout | F13 | hook lifecycle / async cleanup | unresolved timer / promise / server lifecycle を特定し、timeout 延長で隠さない |

## 実行タスク

1. F01-F13 を上表の group に分類する。完了条件: Phase 3 が group 単位でレビューできる。
2. mock / fixture 方針を決める。完了条件: D1 in-memory、request context、session mock、external fetch mock の使い分けがある。
3. 実装候補を「test fixture 修正」「production code 最小修正」「契約仕様の誤り」の 3 分類で記録する。完了条件: Phase 5 runbook が順序化できる。
4. coverage AC に対する evidence path を仮置きする。完了条件: Phase 7 の AC matrix へ接続できる。

## Mock / Fixture 戦略

| 対象 | 採用方針 | 禁止事項 |
| --- | --- | --- |
| D1 repository / routes | 既存 test helper と isolated seed を優先 | apps/web から D1 へ直接触る前提を書かない |
| auth/session | 既存 auth helper、cookie/session mock、admin/member role fixture を再利用 | 401/403 をまとめて同一扱いしない |
| external form sync | `vi.fn` / existing fetch mock で payload を固定 | network 実アクセスを前提にしない |
| timeout 調査 | unresolved async resource を検出し、cleanup を runbook 化 | timeout 値の引き上げだけで PASS にしない |

## 参照資料

- Phase 1 failure inventory
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`

## 成果物

- Phase 2: `outputs/phase-02/main.md`

## 統合テスト連携

設計した fake / mock 境界は Phase 11 の apps/api 全 test と coverage 生成で検証する。特に `FakeD1` が後段 hook の DB query を満たすかを focused test から package test へ段階的に確認する。

## 完了条件

- [ ] F01-F13 が group / boundary / design rule に対応している。
- [ ] helper / mock の再利用方針が決まっている。
- [ ] coverage AC は未実測のまま Phase 7 / Phase 11 に渡され、Phase 2 で PASS 宣言されていない。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 3 へ、failure group、mock / fixture 戦略、分類ルール、未実測 AC を渡す。
