# Phase 6: テスト追加

## 1. 本タスクのテスト追加方針

本タスクは README とコメントブロックのみで、adapter ロジックは変更しないため **新規 spec ケースは追加しない**。代わりに以下の「軽量 presence check」を実装手順に組み込む。

## 2. README presence check（手動 / オプション）

実装後に次のシェルコマンドで存在を確認する（CI gate には組み込まない・実装者の自己検証用）:

```bash
test -f apps/web/src/lib/adapters/README.md \
  && grep -q "5 ステップ checklist" apps/web/src/lib/adapters/README.md \
  && grep -q "責務 mapping 表" apps/web/src/lib/adapters/README.md \
  && grep -q "sanitize literal 復元" apps/web/src/lib/adapters/README.md \
  && grep -q "fixture self-validation" apps/web/src/lib/adapters/README.md \
  && echo "README presence OK"
```

## 3. EXTENSION TEMPLATE presence check（手動）

```bash
test "$(grep -c "EXTENSION TEMPLATE" apps/web/src/lib/adapters/__tests__/member-detail.spec.ts)" = "2" \
  && echo "EXTENSION TEMPLATE OK"
```

開始マーカー `// === EXTENSION TEMPLATE ===` と終了マーカー `// === END EXTENSION TEMPLATE ===` の 2 ヒットが期待値。

## 4. 既存 spec 回帰テスト

template コメント追加が既存テストランナーの parse / execution を壊さないことを確認する:

```bash
pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts
```

期待: 既存 8 ケース全 PASS。

## 5. 将来の拡張時に走るテスト（参考）

実 schema 拡張タスク（本タスクの**スコープ外**）では、README 5 ステップに従い:

1. zod 拡張後、spec ケース 1（fixture self-validation）が PASS することを確認
2. EXTENSION TEMPLATE をコピペした新 spec ケースが red であることを確認
3. adapter 拡張後に green になることを確認

の TDD サイクルが回ることを期待する。本タスクではこのサイクルが「機械的に再現可能」になることだけを担保する。
