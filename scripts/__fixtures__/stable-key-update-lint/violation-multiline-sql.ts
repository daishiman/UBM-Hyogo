export const sql = `
  UPDATE schema_questions
     SET stable_key = ?
   WHERE question_id = ?
`;
