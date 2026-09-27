// Report questions that are the same problem with different constants.
//
// A bank once shipped families like "lim(x→1) (x²-1)/(x-1)" and
// "lim(x→3) (x²-9)/(x-3)" — one limit problem padded out twice. Collapsing
// digits reveals those families so they can be rewritten or dropped.
import { advancedLanguagePools } from "../advanced-language.js";
import { advancedStemPools } from "../advanced-stem.js";

const KEPT = 80; // frozen originals, excluded from the report

const pools = {};
for (const [tier, pool] of Object.entries(advancedLanguagePools))
  pools[`${tier}/language`] = pool;
for (const [tier, group] of Object.entries(advancedStemPools))
  for (const [subject, pool] of Object.entries(group))
    pools[`${tier}/${subject}`] = pool;

const skeleton = (text) =>
  text
    .replace(/\d+(?:[.,]\d+)?/g, "#")
    .replace(/[A-Z][a-z]+/g, "N")
    .replace(/\s+/g, " ")
    .trim();

const wanted = process.argv[2];
let total = 0;

for (const [name, pool] of Object.entries(pools)) {
  if (wanted && name !== wanted) continue;
  const families = new Map();
  for (const question of pool.slice(KEPT)) {
    const key = skeleton(question.prompt);
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(question);
  }
  const duplicated = [...families.values()].filter((v) => v.length > 1);
  if (!duplicated.length) continue;

  const items = duplicated.reduce((a, v) => a + v.length, 0);
  total += items;
  console.log(`\n${name}: ${duplicated.length} families, ${items} items`);
  for (const family of duplicated) {
    // Keep the first, list the rest as the ones to rewrite or drop.
    const [keep, ...drop] = family;
    console.log(`  keep ${keep.id}: ${keep.prompt.slice(0, 70)}`);
    for (const question of drop)
      console.log(`  drop ${question.id}: ${question.prompt.slice(0, 70)}`);
  }
}

console.log(`\n${total} duplicated items across the reported pools`);
