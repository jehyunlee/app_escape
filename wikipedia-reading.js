const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function sourceLink(value, host) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== host)
    throw new TypeError("Invalid reading source URL");
  return escape(url.href);
}
export function wikipediaReadingMarkup(question) {
  if (!question.passage) return "";
  const source = question.source;
  if (!source || typeof question.passage !== "string")
    throw new TypeError("Reading passage requires attribution");
  const article = sourceLink(source.url, "en.wikipedia.org");
  const revision = sourceLink(source.revisionUrl, "en.wikipedia.org");
  const license = sourceLink(source.licenseUrl, "creativecommons.org");
  const date = new Date(source.revisionTimestamp);
  if (!Number.isFinite(date.getTime()))
    throw new TypeError("Invalid Wikipedia revision timestamp");
  const revisedAt = date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const paragraphs = question.passage
    .split(/\n+/)
    .filter(Boolean)
    .map((text) => `<p>${escape(text)}</p>`)
    .join("");
  return `<section class="wikipedia-reading" aria-labelledby="reading-source-title"><p class="reading-kicker">WIKIPEDIA · ENGLISH READING</p><h4 id="reading-source-title" lang="en">${escape(source.title)}</h4><div class="reading-passage" lang="en">${paragraphs}</div><footer class="reading-attribution"><span>${escape(source.attribution)} · <a href="${revision}" target="_blank" rel="noopener noreferrer">발췌한 문서 버전</a> · <a href="${article}" target="_blank" rel="noopener noreferrer">현재 문서</a></span><span>문서판 ${escape(revisedAt)} (한국시간) · <a href="${license}" target="_blank" rel="noopener noreferrer">${escape(source.license)}</a></span><span>Wikipedia 원문 일부를 발췌했습니다. 문항과 한국어 해설은 별도로 작성했으며, 이 지문은 자동 갱신되지 않습니다.</span></footer></section>`;
}
