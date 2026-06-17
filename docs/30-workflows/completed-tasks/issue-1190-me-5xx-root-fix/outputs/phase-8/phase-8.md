# Phase 8: リファクタリング

## メタ情報
正本: `outputs/phase-8/phase-8.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-2/phase-2.md`（§2.2-4 helper 共通化を見送り Phase 8 で再評価する確定判断）/ `../phase-3/phase-3.md`（4 条件評価・ロールバック容易性 ◎・R1 代替実装）/ SSOT §3（T01-T02）・§5（不変条件）

> workflow_state は `implemented_local_evidence_captured`。本 Phase は本サイクルで GREEN 達成後に適用する**リファクタリング判断基準と rollback 手順の正本**であり、本サイクルでコード変更は行わない（AC-10 / user-gated）。

## 目的
T02 の分類 throw（`UBM-5001` + `context.scope` の rethrow catch ブロック）が `apps/api/src/middleware/session-guard.ts`（P1/P2）と `apps/api/src/routes/me/index.ts`（P3）の 2 ファイル 3 箇所で同型に重複する設計について、純関数 helper（`toDbApiError(err, scope)`）への抽出要否の判断基準を確定する。あわせて、変更全体が `git revert` 1 コミットで戻る局所性を rollback 手順として固定する。

---

## 1. 重複の現状（Phase 2 確定設計の再掲）

T02 の catch ブロックは次の同型パターンが 3 箇所に現れる（Phase 2 §5.1/§5.2）:

```ts
.catch((err: unknown): never => {
  throw new ApiError({
    code: "UBM-5001",
    log: {
      cause: err,
      context: { scope: "<3値のいずれか>" },   // me-session-guard / me-profile-builder
      ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}),
    },
  });
});
```

差分は `scope` literal 1 語のみ。T01（P4 fail-soft の `logError` + `return {}`）は **throw せず 200 を維持する別契約**のため、本 helper 化の対象に含めない（混ぜると fail-hard/fail-soft の境界が helper 内へ漏れる）。

## 2. helper 抽出案（採用する場合の設計）

| 項目 | 内容 |
|------|------|
| シグネチャ | `const toDbApiError = (err: unknown, scope: "me-session-guard" \| "me-profile-builder"): never => { throw new ApiError({ code: "UBM-5001", log: { cause: err, context: { scope }, ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}) } }); }` — scope を union literal 型で 2 値に閉じ、不変条件 #11（memberId/email 非混入）を**型で**保証する |
| 配置候補 A | `apps/api/src/middleware/`（例: `db-api-error.ts`）— session-guard と同階層・error-handler と並ぶ。ただし routes/me → middleware への import は「route が middleware 内部品に依存する」方向となり、既存の依存方向（routes は middleware を app 構成経由でのみ利用）から外れる |
| 配置候補 B | `apps/api/src/repository/_shared/` — middleware / routes 双方から中立に import 可能。ただし Phase 2 §2.2-2 で「repository 層に scope を持ち込まない」（scope は呼び出し側の責務）と確定しており、helper を repository 配下へ置くと責務境界の表明と矛盾して見える |
| 抽出時の結論 | 抽出する場合は**候補 A（middleware 同階層）**を採る。scope は「/me のどこで落ちたか」という呼び出し側関心であり、session-guard（2/3 箇所）の最近傍に置くのが責務的に最も歪みが小さい。routes/me からの import 1 本は許容（error-handler 型 import の前例 `isApiError` と同方向） |

## 3. 抽出要否の判断基準（本 WF の正本）

**既定: inline 維持（抽出しない）。** Phase 2 §2.2-4 の確定判断を本 Phase で再評価し、以下の基準で追認する。

| # | 基準 | 本 WF 時点の評価 |
|---|------|------------------|
| C1 | 重複箇所数: **3 箇所以下なら inline 維持**。4 箇所目（例: `/me` 以外への横展開・P2 の admin lookup 分離 scope 化）が現れたら抽出 | 3 箇所（P1/P2/P3）→ inline 維持 |
| C2 | 重複の drift 実績: catch 本体に scope 以外の差分（code 変更・log キー追加）が混入した実績が出たら、その時点で抽出して一本化 | 新規導入時点で drift なし → inline 維持 |
| C3 | 行数の膨張: R1 代替（try/catch + let 宣言・Phase 3 §3）採用で各 catch が 15 行超になる場合は抽出で可読性を回収 | 既定の `.catch((err): never => ...)` 方式なら各約 10 行 → inline 維持 |
| C4 | 新規 export のコスト: existing-hardening 方針（SSOT §0 implementation_mode）では production 新規ファイル・新規 export を増やさないことが既定価値。抽出の便益（C1-C3）がこれを上回るときのみ反転 | 便益が閾値未満 → inline 維持 |

> inline 維持でも不変条件 #11 は Phase 2 §6 の 3 層（literal context 固定・TC アサーション・grep gate）で保証され、helper の型保証（§2）は必須ではない。**判断に迷ったら inline 維持が正**（仕様の既定値）。

## 4. リファクタの安全性チェック（抽出を実施する場合）

| 項目 | 確認方法 |
|------|----------|
| 振る舞い不変 | 抽出ステップ後に focused vitest（TC-1〜TC-4 + 既存回帰）を再実行し全 green（期待値は Phase 4 の I/O 契約のまま不変） |
| #11 維持 | Phase 9 grep gate（`context: {` の全ヒットが literal scope のみ）が green のまま。helper 化後は `context: { scope }` の scope が union literal 型であることを typecheck で担保 |
| 公開 surface 不変 | `/me` の path・shape・status 体系に変化なし（problem+json の `code`/`status` も不変）。`git diff` レビューで helper ファイル追加 + catch 3 箇所の置換のみであること |
| 非接触領域 | apps/web / migrations / repository 関数本体に diff がない（Phase 9 Q4/Q5） |

## 5. rollback 手順

本 WF の変更は **production 2 ファイル（catch 4 箇所 + import 数行）+ 既存 contract spec 1 ファイル + docs / skill ledgers** に局所化され、D1 migration・env 変更・設定変更・新規 endpoint を一切伴わない（Phase 3 §1 ロールバック容易性 ◎）。したがって `git revert` のみで完全に旧挙動へ戻る。

| ケース | rollback 手順 | 戻した後の状態 |
|--------|----------------|----------------|
| 変更全体を戻す | 実装コミットが 1 コミットなら `git revert <sha>` 1 回で完全復旧 | P4 は fail-hard（500）・P1-P3 は `UBM-5000` という**現行 HEAD と同一の既知挙動**へ戻る。データ非破壊・web 側 degrade（session-5xx 表示）は既設のため利用者影響は現状維持 |
| T01 のみ戻す | T01/T02 をコミット分割していた場合、T01 コミットのみ revert（T01 と T02 は互いに依存しない・Phase 3 §1） | pendingRequests が fail-hard に戻るが、T02 の分類は生きるため 500 時のログ scope 特定能力は残る |
| T02 のみ戻す | 同様に T02 コミットのみ revert。T03 の TC-1/TC-2 は RED になるため、当該 TC を同時に revert（spec とセットで戻す） | 分類が `UBM-5000` に戻る。T01 fail-soft（TC-3）は独立に green を維持 |
| 抽出 helper（§2）の不具合 | helper 導入コミットのみ revert（inline 版へ戻す）。振る舞い不変リファクタのため revert 後もテストは green | 機能・契約は不変のまま重複 3 箇所を許容する形に戻る |

> 推奨コミット粒度: 本サイクルでは T01+T02+T03 を 1 コミット（仕様上 1 サイクル完結・CONST_007）としてよいが、上表の部分 rollback を可能にしたい場合は T01 / T02+T03 の 2 コミット分割を許容する。いずれでも「migration なし・revert のみで復旧」という性質は変わらない。

## 統合テスト連携
リファクタ（実施する場合）の合格基準は Phase 4 の I/O 契約と Phase 6 のテストケース（TC-1〜TC-4）であり、抽出前後で期待値を一切変えない。rollback 後の健全性も同じ focused vitest（既存回帰分）で判定できる。staging 実機確認は Phase 11 の user-gated 手順（`scripts/cf.sh` 経由）に委譲する。

## 参照資料
- `../../_shared-context.md`（SSOT §3 T01-T02 / §5 不変条件 / §7 DoD）
- `../phase-2/phase-2.md`（§2.2 設計判断 / §5 Before/After / §6 #11 の 3 層保証）
- `../phase-3/phase-3.md`（§1 ロールバック容易性 / §3 R1 代替実装）
- `packages/shared/src/errors.ts`（`ApiError` 実契約）

## 成果物
- `outputs/phase-8/phase-8.md`

## 完了条件
- [x] T02 分類 throw の重複（2 ファイル 3 箇所）に対する helper 抽出案（`toDbApiError`・配置候補比較）を定義した。
- [x] 抽出要否の判断基準 C1〜C4 を固定し、既定 = inline 維持（Phase 2 §2.2-4 追認）と明記した。
- [x] 抽出実施時の安全性チェック（振る舞い不変・#11・surface 不変）を定義した。
- [x] `git revert` 1 コミットで完全復旧する rollback 手順（全体 / 部分 / helper 単位）を記述した。

## 次 Phase への引き継ぎ
- 既定は inline 維持。helper 抽出は C1〜C4 の trigger 充足時のみ・配置は `apps/api/src/middleware/` 同階層と確定済み。
- rollback は `git revert` のみで完結（migration / env / schema 変更なし）。部分 rollback したい場合のコミット分割指針も §5 に固定済み。
- Phase 9 は本 Phase の安全性チェック（focused vitest 再緑・#11 grep gate・非接触 diff）を品質ゲート Q1〜Q7 として一括コマンド化する。
- 実行はすべて本サイクル（implemented_local_evidence_captured の本サイクルではコード変更なし）。
