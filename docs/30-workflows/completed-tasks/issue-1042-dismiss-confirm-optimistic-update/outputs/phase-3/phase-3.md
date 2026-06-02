# Phase 3: 設計レビュー（Phase 4 進行可否ゲート）

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

## 3.1 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|---|---|---|
| 価値性 | PASS | 大量 conflict を処理する管理者の dismiss 体感速度を merge と対称化。コスト = 1 component に閉じた state 1 個追加 |
| 実現性 | PASS | merge で実証済みパターンの mirror。初回スコープで実装可能な厚み（1 component + 2 test file）に収まる |
| 整合性 | PASS | 責務境界（component-local optimistic vs server list）・状態所有権（merge/dismiss 分離）・依存関係が矛盾なく閉じる |
| 運用性 | PASS | API/hook 不変のため監査・回帰運用に影響なし。merge 既存テストの回帰確認を AC-4 で固定 |

総合: **4 条件 PASS → Phase 4 進行可**。

## 3.2 設計の俯瞰（後続 Phase がコード実装可能な粒度の確認）

後続実装者が迷わないために、変更を関数レベルで確定:

```
IdentityConflictRow.tsx
├── useState 追加: const [optimisticDismissed, setOptimisticDismissed] = useState(false);
├── onDismiss 差し替え:
│     setOptimisticDismissed(true);
│     void dismissMutation.trigger({ reason: dismissReason.trim() })
│       .catch(() => { setOptimisticDismissed(false); });
└── render guard: if (optimisticMerged || optimisticDismissed) return null;
```

→ 変更は 3 箇所（useState 1 行追加 / onDismiss 本体差し替え / guard 1 行統合）。新規ファイル・新規 import なし。

## 3.3 トレードオフ確認

| トレードオフ | 採用 | 却下理由 |
|---|---|---|
| component-local state vs hook 拡張 | component-local | hook 拡張は merge/他 admin mutation へ影響波及。merge 前例どおり component-local が最小影響 |
| state 統合（`optimisticHidden` 単一） vs 分離（`optimisticDismissed`） | 分離 | 統合は rollback 責務が merge/dismiss で混線（Issue 苦戦箇所）。Issue 受け入れ基準 AC-1 が分離を要求 |
| 即時 `return null` vs fade animation | 即時 | fade は別 Issue（followup-005）へ分離済み。本タスクの達成に不要 |

## 3.4 リスクと対策（Issue 原文 + 設計補強）

| リスク | 影響 | 対策 | 検証 Phase |
|---|---|---|---|
| dismiss と merge の rollback state が混線 | 中 | `optimisticMerged` / `optimisticDismissed` を分離。片方の失敗が他方に影響しないテストで固定 | Phase 4 / 6 |
| dismiss 理由入力が rollback 後に消える | 中 | `.catch` では optimistic state だけ戻し、`dismissReason` は clear しない | Phase 4 AC-3 |
| row 即時削除で screen reader の状態変化が唐突 | 低 | rollback 時の `role="alert"` 復元を RTL / Playwright で確認。fade は別タスクへ委譲 | Phase 11 |
| merge 既存テストの回帰 | 中 | render guard 統合後も merge optimistic success / rollback が PASS することを確認 | Phase 4 AC-4 |

## 3.5 Phase 4 への申し送り

- TDD Red の操作対象は **internal state**（`optimisticDismissed`）。external prop ではない（VSCPKR-03 写像）。テストは「dismiss 実行 → row 消失」「reject → row 復元 + reason 保持」を internal state 経由で検証する。
- 既存 mock（`useAdminMutation` の `mutationByEndpoint` Map、`setMutationState`）を再利用する。新規 mock 機構は不要。
- merge 既存ケース（spec.tsx の 10 it）は不変で PASS を維持すること。

**判定: Phase 4 進行可（設計確定）。**
