# Production Deploy Flow (13 ステップ)

```mermaid
graph TB
  subgraph "Preflight (Phase 5 / G2 user approval)"
    S1["S1: git rev-parse origin/main\n(main 昇格 evidence)"]
    S2["S2: bash scripts/cf.sh whoami\n(account identity)"]
    S3["S3: D1 binding confirmation\n(no backup yet)"]
    S4["S4: D1 migrations list (dry-run)"]
    S5["S5: secrets list (api/web)"]
  end

  subgraph "Apply (Phase 6-8)"
    S6["S6: D1 backup + migrations apply\n--remote --env production"]
    S7["S7: api deploy\npnpm --filter @ubm/api deploy:production"]
    S8["S8: web deploy\npnpm --filter @ubm/web deploy:production"]
    S9["S9: release tag\nvYYYYMMDD-HHMM (JST)"]
  end

  subgraph "Verify (Phase 9-10 / G3 user approval)"
    S10["S10: 10 page smoke + 認可境界"]
    S11["S11: GO/NO-GO judgment"]
  end

  subgraph "Post-release (Phase 11)"
    S12["S12: incident runbook share\n(09b 成果物)"]
    S13["S13: 24h Cloudflare Analytics\n(Workers req / D1 reads / writes)"]
  end

  S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8 --> S9 --> S10 --> S11 --> S12 --> S13
  S11 -. NO-GO .-> RB["rollback: bash scripts/cf.sh rollback <VERSION_ID>"]
  S6 -. fail .-> RB
  S7 -. fail .-> RB
  S8 -. fail .-> RB
```

## ステップ詳細

各ステップの主コマンド・evidence ファイル・担当 Phase・失敗時分岐は `outputs/phase-02/main.md` の "13 ステップ × evidence 設計表" を参照。

## 不変条件 production 再確認の流れ

- #4 / #11: S10 (Phase 9) で `/profile` / `/admin/members` の編集 form 不在を手動確認
- #5: S7/S8 deploy 後 + S13 で apps/web bundle に `D1Database` import が無いことを `rg` で再確認
- #10: S13 (Phase 11) で 24h Cloudflare Analytics 値を取得
- #15: S10 (Phase 9) で attendance 重複 0 件 / 削除済み除外 SQL を production D1 に対して SELECT
