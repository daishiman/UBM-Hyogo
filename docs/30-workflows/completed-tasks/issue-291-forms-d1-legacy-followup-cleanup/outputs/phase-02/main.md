# Phase 2: 設計 — Summary

stale hit を **current drift** / **historical** / **superseded backlog** の 3 区分で分類し、編集方針を確定する。

- current drift → 該当行を「current = Forms API split endpoint + `sync_jobs` ledger」に書き換え、legacy 表現を historical note または別表へ移送
- historical → 削除せず、文脈の前後に `historical（UT-09 / u-04 legacy）` 注記を加える
- superseded backlog → `~~strikethrough~~` + `**status: superseded（2026-04-30 / issue-291）**` で legacy umbrella 集約済みを明示

逆リンク戦略は `classification-policy.md` を参照。
