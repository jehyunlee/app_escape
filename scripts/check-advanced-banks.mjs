// Verify the advanced question banks for size, correctness and genuine variety.
// The variety checks exist because these pools previously shipped near-duplicate
// items that differed only by numbers, plus several questions per shared passage.
import { advancedLanguagePools } from "../advanced-language.js";
import { advancedStemPools } from "../advanced-stem.js";

const EXPECTED = 400;
const KEPT = 80; // original ids that saved games still reference

const pools = {};
for (const [tier, pool] of Object.entries(advancedLanguagePools))
  pools[`${tier}/language`] = pool;
for (const [tier, group] of Object.entries(advancedStemPools))
  for (const [subject, pool] of Object.entries(group))
    pools[`${tier}/${subject}`] = pool;

// Collapse digits and capitalised nouns so "2kg ... 1m/s²" and "3kg ... 2m/s²"
// reduce to the same skeleton and get reported as one template family.
const skeleton = (text) =>
  text
    .replace(/\d+(?:[.,]\d+)?/g, "#")
    .replace(/[A-Z][a-z]+/g, "N")
    .replace(/\s+/g, " ")
    .trim();

// A stimulus is the passage or setup a question is built on. Standard question
// types legitimately repeat a fixed instruction line ("find the sentence that
// does not fit"), so compare the content that follows it, not the instruction.
const INSTRUCTION =
  /^(read|choose|select|find|according to|what|which|why|how|다음|위|아래|윗)\b[^.?!]*[.?!]\s*/i;
const stimulus = (text) => {
  const body = text.replace(INSTRUCTION, "").trim();
  const first = body.split(/(?<=[.?!。])\s/)[0].trim();
  return first.length > 25 ? first : null;
};

const failures = [];
const report = [];

for (const [name, pool] of Object.entries(pools)) {
  const problems = [];
  if (pool.length !== EXPECTED)
    problems.push(`size ${pool.length} != ${EXPECTED}`);

  const ids = new Set(pool.map((q) => q.id));
  if (ids.size !== pool.length) problems.push("duplicate ids");
  const prompts = new Set(pool.map((q) => q.prompt));
  if (prompts.size !== pool.length) problems.push("duplicate prompts");

  for (const q of pool) {
    if (!q.id || !q.prompt || !q.explanation)
      problems.push(`${q.id}: missing field`);
    if (q.options?.length !== 4 || new Set(q.options).size !== 4)
      problems.push(`${q.id}: options must be 4 distinct`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3)
      problems.push(`${q.id}: answer out of range`);
    if (![1, 2, 3].includes(q.difficulty))
      problems.push(`${q.id}: difficulty out of range`);
    if (!/[가-힣]/.test(q.explanation))
      problems.push(`${q.id}: explanation must be Korean`);
  }

  // The first KEPT items are the original bank. They carry the very defects
  // this expansion exists to fix, but they are frozen so saved games keep
  // resolving, so they are reported for visibility and never gate the run.
  const added = pool.slice(KEPT);

  const group = (items, keyOf) => {
    const groups = new Map();
    for (const q of items) {
      const key = keyOf(q.prompt);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(q.id);
    }
    return [...groups.values()].filter((v) => v.length > 1);
  };

  const templated = group(added, skeleton);
  const shared = group(added, stimulus);
  const baseline =
    group(pool.slice(0, KEPT), skeleton).reduce((a, v) => a + v.length, 0) +
    group(pool.slice(0, KEPT), stimulus).reduce((a, v) => a + v.length, 0);

  const counts = [0, 0, 0, 0];
  for (const q of added) counts[q.answer]++;
  const lo = Math.min(...counts);
  const hi = Math.max(...counts);
  if (pool.length > KEPT && (lo < 60 || hi > 100))
    problems.push(`answer spread ${counts.join("/")}`);

  const templatedItems = templated.reduce((a, v) => a + v.length, 0);
  const sharedItems = shared.reduce((a, v) => a + v.length, 0);
  if (templatedItems) problems.push(`templated ${templatedItems}`);
  if (sharedItems) problems.push(`shared stimulus ${sharedItems}`);

  report.push({
    pool: name,
    size: pool.length,
    answers: counts.join("/"),
    templated: templatedItems,
    sharedStimulus: sharedItems,
    legacyDefects: baseline,
    worst: templated.sort((a, b) => b.length - a.length)[0]?.slice(0, 4) ?? [],
  });
  if (problems.length) failures.push(`${name}: ${problems.join("; ")}`);
}

// Ids must stay globally unique so one character's save never resolves to another's item.
const seen = new Map();
for (const [name, pool] of Object.entries(pools))
  for (const q of pool) {
    if (seen.has(q.id))
      failures.push(`${q.id}: duplicated in ${seen.get(q.id)} and ${name}`);
    seen.set(q.id, name);
  }

console.table(report);
console.log(
  `total questions: ${Object.values(pools).reduce((a, p) => a + p.length, 0)}`,
);
if (failures.length) {
  console.error(`\nFAILURES (${failures.length}):`);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}
console.log("all advanced banks pass size, validity and variety checks");
