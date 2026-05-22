# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-A: Next ML Model Training And Selection

## 苦戦箇所

Issue #587 intentionally separates artifact rotation from training. Mixing training with rotation would make a failed candidate ambiguous: the problem could be the model, the artifact packaging, or the promotion path.

## リスクと対策

| リスク | 対策 |
| --- | --- |
| synthetic fixture winner is treated as production winner | require production-equivalent redacted dataset evidence before promotion |
| raw feature dataset leaks into artifacts | run leakage grep and dataset grep before any report is attached |
| model comparison criteria drift | reuse Issue #548 selection criteria and record threshold baseline in the same evidence file |

## 検証方法

- Run offline replay on the approved redacted dataset.
- Compare candidate metrics against threshold baseline with the same schema.
- Store only redacted summary metrics and artifact references.

## スコープ

Includes model retraining/selection evidence. Excludes production artifact promotion, which remains Issue #587 implementation/runtime scope.

