# Phase 10: review feedback ループ方針

## 目的

PR レビューで想定される指摘パターンに対する事前応答方針を整理し、フィードバックループを最小サイクルで完結させる。

## 入力

- Phase 9 成果物 `outputs/phase-09/review-readiness.md`
- Phase 3 ADR 草案

## 作業手順

1. 想定される指摘パターンを 5 件以上列挙する:
   - (P1) 「列を追加した方が将来の query 性能が良いのでは」 → 再評価トリガ条件を明示済み。現時点では audit join で十分。性能問題が顕在化した段階で superseding ADR を起票する手順を案内。
   - (P2) 「audit_log retention 期限後に queue 追跡が失われるリスクは？」 → 再評価トリガ (b) に明記済み。retention 短縮決定時に再評価する。
   - (P3) 「ADR 連番 0002 が既存 ADR と衝突する」 → Phase 8 で `docs/decisions/` 連番を確認し、衝突時は次番に繰り上げる。
   - (P4) 「07a 親 unassigned-task-detection.md を改変するのは completed-tasks 配下なので NG では？」 → 行末への補足追記 / 脚注のみ。破壊的編集はしない。代替案として、本 ADR から 07a 親への単方向リンクのみとし、07a 側は触れない方針も検討可。
   - (P5) 「spec と skill の同時更新で drift しないか」 → Phase 8 で同一 PR 内で更新。Phase 12 changelog fragment で相互参照確認。
2. 各指摘パターンに対する応答テンプレートを `outputs/phase-10/review-loop.md` に整理する。
3. レビューサイクル上限を 2 cycle と設定し、それ以上紛糾する場合は別 ADR / 別 PR への切り出しを user に提案する手順を明記する。

## 出力成果物

- `outputs/phase-10/review-loop.md`
  - 想定指摘 5 件と応答テンプレート
  - レビューサイクル上限ポリシー（max 2 cycles）

## 検証コマンド

```bash
# 想定指摘 5 件が記載されているか
rg -n "P[1-5]\)" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-10/review-loop.md

# max 2 cycles ポリシー
rg -n "max 2 cycles|2 cycle" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-10/review-loop.md
```

## DoD

- [ ] 想定指摘 5 件を列挙し応答テンプレートを作成した
- [ ] レビューサイクル上限ポリシーを明記した
- [ ] `outputs/phase-10/review-loop.md` を作成した
