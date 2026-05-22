# Lessons Learned: 真因は AUTH_SECRET binding（defensive normalize は対症療法）

[実装区分: 実装仕様書]

## 発見日: 2026-05-22

## 要旨

本 workflow（`task-runtime-smoke-admin-members-500-recovery-001`）および PR #854 は、
runtime smoke staging job の `admin-list http=500` 復旧を目的に、`apps/api/src/routes/admin/members.ts` ハンドラに
defensive try/catch + body normalize を導入した。しかし**真因はハンドラ層ではなく middleware 層**にあった。

## 真因（後続調査で確定）

artifact `runtime-smoke-staging-26228634903 / runtime-smoke.log` の実 body:

```
status=500
body={"error":"auth misconfigured"}
```

これは `apps/api/src/middleware/require-admin.ts:104-107` の以下分岐で発火している:

```ts
const secret = c.env.AUTH_SECRET;
if (!secret) {
  return c.json({ error: "auth misconfigured" }, 500);
}
```

つまり staging worker `ubm-hyogo-api-staging` のランタイムで `c.env.AUTH_SECRET` が **falsy**（undefined または空文字）。
`secret list` は name を返したが、値が空 / 別環境登録 / binding 不一致だった可能性が高い。

## 本 workflow の defensive 改修の評価

- **維持価値あり**: 将来の D1 schema drift / zod parse 失敗時の 500 露出を防ぐ guard としては有効
- **しかし根本対応ではなかった**: middleware で 500 が返るためハンドラに到達せず、本 workflow 着手の動機となった smoke fail は解消できなかった

## 真因対応 workflow

→ `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/`

4 spec で構造化対応:
- spec-01: 即時 recovery（staging + production の AUTH_SECRET 再投入）
- spec-02: middleware 構造化ログ + `apps/api/src/env.ts` の AUTH_SECRET zod 必須検証
- spec-03: CI gate（deploy 直後 auth-gate smoke）+ smoke script 検知分岐
- spec-04: `cf.sh secret put` empty-value guard + 3 段チェック runbook

## skill / spec への feedback

| 教訓 | 反映先 |
|------|--------|
| **smoke fail 時は body を必ず保存・検査**: 「500」だけ見て対象 endpoint のハンドラを疑うのは早計。auth middleware / runtime binding を先に切り分ける | task-specification-creator の `phase-template-core.md` Phase 1 「真因確定」セクションに「runtime evidence の body 内容を最初に grep」を追加候補 |
| **`secret list` は name しか保証しない**: 値の存在確認には別途 length verify / curl 経由の挙動 verify が必要 | spec-04 runbook で明文化 |
| **defensive guard と root cause fix を混同しない**: PR title が `fix(admin-members)` でも実態が対症療法なら commit message に明記する | future PR template への反映候補 |

## ステータス変更

- 本 workflow: `runtime_pending` のまま維持（defensive 改修は staging deploy 済み・PR #854 merged）
- 真因対応は別 workflow に分離
- Phase 12 close-out 時は本 lessons-learned を root evidence として `phase12-task-spec-compliance-check.md` から参照する
