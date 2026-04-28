// in-memory D1 モック
// SQLを実際には実行せず、あらかじめセットされたデータを返す
// 各テストでデータをセットしてから使用する

import type { D1Db, D1Stmt } from "../_shared/db";

// テーブルの Row 型（型は緩く定義）
export type AnyRow = Record<string, unknown>;

/**
 * MockStore: テーブルごとのデータを保持するストア
 */
export class MockStore {
  memberIdentities: AnyRow[] = [];
  memberStatus: AnyRow[] = [];
  memberResponses: AnyRow[] = [];
  responseSections: AnyRow[] = [];
  responseFields: AnyRow[] = [];
  memberFieldVisibility: AnyRow[] = [];
  memberTags: AnyRow[] = [];
  tagDefinitions: AnyRow[] = [];
  deletedMembers: AnyRow[] = [];

  reset(): void {
    this.memberIdentities = [];
    this.memberStatus = [];
    this.memberResponses = [];
    this.responseSections = [];
    this.responseFields = [];
    this.memberFieldVisibility = [];
    this.memberTags = [];
    this.tagDefinitions = [];
    this.deletedMembers = [];
  }

  /**
   * SQL の FROM 句からテーブル名を解析する
   */
  private detectTable(sql: string): AnyRow[] | null {
    const normalized = sql.toLowerCase();

    if (normalized.includes("from member_identities") || normalized.includes("into member_identities")) {
      return this.memberIdentities;
    }
    if (normalized.includes("from member_status") || normalized.includes("into member_status")) {
      return this.memberStatus;
    }
    if (normalized.includes("from member_responses") || normalized.includes("into member_responses")) {
      return this.memberResponses;
    }
    if (normalized.includes("from response_sections") || normalized.includes("into response_sections")) {
      return this.responseSections;
    }
    if (normalized.includes("from response_fields") || normalized.includes("into response_fields")) {
      return this.responseFields;
    }
    if (normalized.includes("from member_field_visibility") || normalized.includes("into member_field_visibility")) {
      return this.memberFieldVisibility;
    }
    if (normalized.includes("from deleted_members") || normalized.includes("into deleted_members")) {
      return this.deletedMembers;
    }
    // member_tags JOIN tag_definitions
    if (normalized.includes("from member_tags")) {
      return this.memberTags;
    }
    if (normalized.includes("from tag_definitions")) {
      return this.tagDefinitions;
    }
    return null;
  }

  /**
   * WHERE 句から条件を解析して行をフィルタリングする
   */
  private applyWhere(rows: AnyRow[], sql: string, bindings: unknown[]): AnyRow[] {
    const normalized = sql.toLowerCase();

    // member_id = ?1
    if (normalized.includes("member_id = ?1") || normalized.includes("where member_id = ?1")) {
      const value = bindings[0];
      return rows.filter((r) => r["member_id"] === value);
    }

    // response_email = ?1
    if (normalized.includes("response_email = ?1")) {
      const value = bindings[0];
      return rows.filter((r) => r["response_email"] === value);
    }

    // response_id = ?1
    if (normalized.includes("response_id = ?1")) {
      const value = bindings[0];
      return rows.filter((r) => r["response_id"] === value);
    }

    // response_id IN (...) - バッチ取得
    if (normalized.includes("response_id in (")) {
      return rows.filter((r) => bindings.includes(r["response_id"]));
    }

    // member_id IN (...)  - バッチ取得
    if (normalized.includes("member_id in (")) {
      return rows.filter((r) => bindings.includes(r["member_id"]));
    }

    return rows;
  }

  /**
   * JOIN クエリ（member_tags + tag_definitions）を処理する
   */
  private joinMemberTagsWithDefinitions(bindings: unknown[], sql: string): AnyRow[] {
    const normalized = sql.toLowerCase();

    let filteredTags: AnyRow[];
    if (normalized.includes("member_id = ?1")) {
      filteredTags = this.memberTags.filter((t) => t["member_id"] === bindings[0]);
    } else if (normalized.includes("member_id in (")) {
      filteredTags = this.memberTags.filter((t) => bindings.includes(t["member_id"]));
    } else {
      filteredTags = this.memberTags;
    }

    return filteredTags
      .map((tag) => {
        const def = this.tagDefinitions.find((d) => d["tag_id"] === tag["tag_id"]);
        if (!def || def["active"] === 0) return null;
        return { ...tag, ...def };
      })
      .filter((row): row is AnyRow => row !== null);
  }

  /**
   * JOIN クエリ（member_responses + member_identities）を処理する
   */
  private joinResponsesWithIdentities(bindings: unknown[], sql: string): AnyRow | null {
    const normalized = sql.toLowerCase();
    let identityRow: AnyRow | undefined;

    if (normalized.includes("mi.member_id = ?1") || normalized.includes("where mi.member_id = ?1")) {
      identityRow = this.memberIdentities.find((i) => i["member_id"] === bindings[0]);
    }

    if (!identityRow) return null;
    const response = this.memberResponses.find(
      (r) => r["response_id"] === identityRow!["current_response_id"],
    );
    return response ?? null;
  }

  async executeFirst<T>(sql: string, bindings: unknown[]): Promise<T | null> {
    const normalized = sql.toLowerCase();

    // JOIN クエリの場合
    if (normalized.includes("join member_identities") && normalized.includes("member_responses")) {
      const row = this.joinResponsesWithIdentities(bindings, sql);
      return row as T | null;
    }

    const table = this.detectTable(sql);
    if (!table) return null;

    const filtered = this.applyWhere(table, sql, bindings);
    return (filtered[0] as T) ?? null;
  }

  async executeAll<T>(sql: string, bindings: unknown[]): Promise<T[]> {
    const normalized = sql.toLowerCase();

    // member_tags JOIN tag_definitions
    if (normalized.includes("from member_tags") && normalized.includes("join tag_definitions")) {
      const joined = this.joinMemberTagsWithDefinitions(bindings, sql);
      return joined as T[];
    }

    const table = this.detectTable(sql);
    if (!table) return [];

    const filtered = this.applyWhere(table, sql, bindings);

    // ORDER BY position ASC
    if (normalized.includes("order by position asc")) {
      return [...filtered].sort((a, b) => {
        const posA = (a["position"] as number) ?? 0;
        const posB = (b["position"] as number) ?? 0;
        return posA - posB;
      }) as T[];
    }

    // ORDER BY submitted_at DESC
    if (normalized.includes("order by submitted_at desc")) {
      return [...filtered].sort((a, b) => {
        const dateA = (a["submitted_at"] as string) ?? "";
        const dateB = (b["submitted_at"] as string) ?? "";
        return dateB.localeCompare(dateA);
      }) as T[];
    }

    return filtered as T[];
  }

  async executeRun(sql: string, bindings: unknown[]): Promise<void> {
    const normalized = sql.toLowerCase();

    // member_identities の INSERT/UPSERT
    if (normalized.includes("into member_identities")) {
      const existing = this.memberIdentities.findIndex(
        (r) => r["member_id"] === bindings[0],
      );
      if (existing >= 0) {
        // ON CONFLICT DO UPDATE
        const row = this.memberIdentities[existing];
        if (normalized.includes("current_response_id = excluded.current_response_id")) {
          // upsertMember
          this.memberIdentities[existing] = {
            ...row,
            response_email: bindings[1],
            current_response_id: bindings[2],
            last_submitted_at: bindings[4],
            updated_at: new Date().toISOString(),
          };
        } else if (normalized.includes("current_response_id = ?2")) {
          // updateCurrentResponse
          this.memberIdentities[existing] = {
            ...row,
            current_response_id: bindings[1],
            last_submitted_at: bindings[2],
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        // INSERT
        this.memberIdentities.push({
          member_id: bindings[0],
          response_email: bindings[1],
          current_response_id: bindings[2],
          first_response_id: bindings[3],
          last_submitted_at: bindings[4],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return;
    }

    // member_identities の UPDATE
    if (normalized.includes("update member_identities")) {
      const idx = this.memberIdentities.findIndex(
        (r) => r["member_id"] === bindings[0],
      );
      if (idx >= 0) {
        const row = this.memberIdentities[idx];
        this.memberIdentities[idx] = {
          ...row,
          current_response_id: bindings[1],
          last_submitted_at: bindings[2],
          updated_at: new Date().toISOString(),
        };
      }
      return;
    }

    // member_status の INSERT/UPSERT
    if (normalized.includes("into member_status")) {
      const existing = this.memberStatus.findIndex(
        (r) => r["member_id"] === bindings[0],
      );
      if (existing >= 0) {
        const row = this.memberStatus[existing];
        if (normalized.includes("public_consent = excluded.public_consent")) {
          // setConsentSnapshot
          this.memberStatus[existing] = {
            ...row,
            public_consent: bindings[1],
            rules_consent: bindings[2],
            updated_at: new Date().toISOString(),
          };
        } else if (normalized.includes("publish_state = excluded.publish_state")) {
          // setPublishState
          this.memberStatus[existing] = {
            ...row,
            publish_state: bindings[1],
            updated_by: bindings[2],
            updated_at: new Date().toISOString(),
          };
        } else if (normalized.includes("is_deleted = 1")) {
          // setDeleted
          this.memberStatus[existing] = {
            ...row,
            is_deleted: 1,
            updated_by: bindings[1],
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        const newRow: AnyRow = {
          member_id: bindings[0],
          public_consent: "unknown",
          rules_consent: "unknown",
          publish_state: "member_only",
          is_deleted: 0,
          hidden_reason: null,
          last_notified_at: null,
          updated_by: null,
          updated_at: new Date().toISOString(),
        };
        if (normalized.includes("public_consent")) {
          newRow["public_consent"] = bindings[1];
          newRow["rules_consent"] = bindings[2];
        } else if (normalized.includes("publish_state")) {
          newRow["publish_state"] = bindings[1];
          newRow["updated_by"] = bindings[2];
        } else if (normalized.includes("is_deleted")) {
          newRow["is_deleted"] = 1;
          newRow["updated_by"] = bindings[1];
        }
        this.memberStatus.push(newRow);
      }
      return;
    }

    // deleted_members の INSERT/UPSERT
    if (normalized.includes("into deleted_members")) {
      const existing = this.deletedMembers.findIndex(
        (r) => r["member_id"] === bindings[0],
      );
      const newRow = {
        member_id: bindings[0],
        deleted_by: bindings[1],
        deleted_at: new Date().toISOString(),
        reason: bindings[2],
      };
      if (existing >= 0) {
        this.deletedMembers[existing] = newRow;
      } else {
        this.deletedMembers.push(newRow);
      }
      return;
    }

    // member_responses の INSERT/UPSERT
    if (normalized.includes("into member_responses")) {
      const existing = this.memberResponses.findIndex(
        (r) => r["response_id"] === bindings[0],
      );
      const newRow = {
        response_id: bindings[0],
        form_id: bindings[1],
        revision_id: bindings[2],
        schema_hash: bindings[3],
        response_email: bindings[4],
        submitted_at: bindings[5],
        edit_response_url: bindings[6],
        answers_json: bindings[7],
        raw_answers_json: bindings[8],
        extra_fields_json: bindings[9],
        unmapped_question_ids_json: bindings[10],
        search_text: bindings[11],
      };
      if (existing >= 0) {
        this.memberResponses[existing] = newRow;
      } else {
        this.memberResponses.push(newRow);
      }
      return;
    }

    // member_field_visibility の INSERT/UPSERT
    if (normalized.includes("into member_field_visibility")) {
      const existing = this.memberFieldVisibility.findIndex(
        (r) => r["member_id"] === bindings[0] && r["stable_key"] === bindings[1],
      );
      const newRow = {
        member_id: bindings[0],
        stable_key: bindings[1],
        visibility: bindings[2],
        updated_at: new Date().toISOString(),
      };
      if (existing >= 0) {
        this.memberFieldVisibility[existing] = newRow;
      } else {
        this.memberFieldVisibility.push(newRow);
      }
      return;
    }
  }
}

/**
 * MockD1Statement: SQLクエリのモック実装
 */
export class MockD1Statement implements D1Stmt {
  private bindings: unknown[] = [];

  constructor(
    private sql: string,
    private store: MockStore,
  ) {}

  bind(...values: unknown[]): this {
    this.bindings = values;
    return this;
  }

  async first<T = unknown>(): Promise<T | null> {
    return this.store.executeFirst<T>(this.sql, this.bindings);
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    const results = await this.store.executeAll<T>(this.sql, this.bindings);
    return { results };
  }

  async run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }> {
    await this.store.executeRun(this.sql, this.bindings);
    return { success: true, meta: { changes: 1, last_row_id: 0 } };
  }
}

/**
 * MockD1: D1Db インターフェースのモック実装
 */
export class MockD1 implements D1Db {
  constructor(public store: MockStore) {}

  prepare(sql: string): MockD1Statement {
    return new MockD1Statement(sql, this.store);
  }

  async exec(_sql: string): Promise<{ count: number; duration: number }> {
    return { count: 0, duration: 0 };
  }
}

/**
 * テスト用の DbCtx を作成するヘルパー
 */
export function createMockDbCtx(store: MockStore): { db: MockD1 } {
  return { db: new MockD1(store) };
}
