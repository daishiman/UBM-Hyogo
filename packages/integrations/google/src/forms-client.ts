export interface FormsClient {
  getForm(formId: string): Promise<unknown>;
  listResponses(formId: string): Promise<unknown[]>;
}

export class NotImplementedFormsClient implements FormsClient {
  getForm(_formId: string): Promise<unknown> {
    throw new Error("not implemented — will be replaced in Wave 01b");
  }
  listResponses(_formId: string): Promise<unknown[]> {
    throw new Error("not implemented — will be replaced in Wave 01b");
  }
}
