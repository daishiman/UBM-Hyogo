# Phase 11: NON_VISUAL evidence

## visualEvidence 判定

**NON_VISUAL**。

## 判定理由

本タスクは UI race condition の排除であり、submit 成功時の以下挙動は変更後も**ユーザー視点では同一**:

- dialog が閉じる
- banner / list が更新される

差分は内部の呼び出し順序のみで、画面表示の差分は実質的に存在しない。screenshot を 1 枚追加しても evidence にならない。

## 代替 evidence: 順序 assertion

screenshot の代わりに、component spec の `callOrder` assertion を evidence とする。

### Evidence 1: VisibilityRequestDialog

```
expect(callOrder).toEqual(["refresh", "onSubmitted", "onClose"]);
```

PASS した test 実行ログを `outputs/phase-11/evidence/test-output.md` に記録。

### Evidence 1-B: VisibilityRequestDialog duplicate pending

```
expect(callOrder).toEqual(["refresh", "onSubmitted"]);
```

### Evidence 2: DeleteRequestDialog

```
expect(callOrder).toEqual(["refresh", "onSubmitted", "onClose"]);
```

同じく PASS ログを記録。

### Evidence 2-B: DeleteRequestDialog duplicate pending

```
expect(callOrder).toEqual(["refresh", "onSubmitted"]);
```

### Evidence 3: RequestActionPanel

```
expect(refresh).not.toHaveBeenCalled();
```

parent 側から refresh が発火しないことを保証する PASS ログを記録。

## 取得手順

```bash
pnpm exec vitest run --config=vitest.config.ts apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx
```

ログから上記 3 件の expect が PASS していることを抽出する。

## DoD

- [x] `outputs/phase-11/visual-verification-skip.md` に判定理由と evidence の test 抜粋を記載
- [x] test 実行サマリを `outputs/phase-11/evidence/test-output.md` として保存
- [x] screenshot を追加しないこと（NON_VISUAL ポリシー）
