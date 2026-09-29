/**
 * Turn free text ("why did we drop redis for sessions?") into a forgiving
 * FTS5 MATCH expression. We OR the terms together with prefix matching and
 * let bm25 sort out relevance — agents rarely phrase a recall query the same
 * way the memory was written, so recall beats precision here.
 */

const STOPWORDS = new Set(
  (
    'a an and are as at be but by did do does for from had has have how i if in into is it its ' +
    'me my of on or our so that the their them then there these this to was we were what when ' +
    'where which who why will with you your about again all any can could should would us use ' +
    // a few russian ones — the author's team writes memories in both languages
    'и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее ' +
    'мне было вот от меня еще нет о из ему теперь когда даже ну ли если уже или ни быть был до ' +
    'вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для ' +
    'мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот почему'
  ).split(/\s+/),
);

export function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .normalize('NFC')
      // keep letters/digits from any script, plus _ and - inside identifiers
      .match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) ?? []
  )
    .map((t) => t.replace(/[-_]+$/, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function toFtsQuery(text: string): string | null {
  const terms = [...new Set(tokenize(text))].slice(0, 24);
  if (terms.length === 0) return null;
  // Quote every term so FTS5 syntax characters in user input are inert,
  // then allow prefix matches so "auth" finds "authentication". Very short
  // terms stay exact — "add"* would also match "address", "adds", "addon"…
  return terms.map((t) => `"${t.replace(/"/g, '""')}"${t.length >= 4 ? '*' : ''}`).join(' OR ');
}
