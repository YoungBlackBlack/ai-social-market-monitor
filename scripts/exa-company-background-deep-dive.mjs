import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fetchWithRetry } from "./fetch-with-retry.mjs";

const envText = await readFile(new URL("../.env", import.meta.url), "utf8");
const apiKey = envText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.startsWith("EXA_API_KEY="))
  ?.slice("EXA_API_KEY=".length)
  ?.replace(/^"|"$/g, "");

if (!apiKey) {
  throw new Error("Missing EXA_API_KEY in .env");
}

const targets = [
  {
    id: "hellotalk_company",
    productName: "HelloTalk",
    category: "company",
    dimension: "company/product background",
    query: "HelloTalk language exchange app company founders users revenue funding background",
  },
  {
    id: "tandem_company",
    productName: "Tandem",
    category: "company",
    dimension: "company/product background",
    query: "Tandem language exchange app company founders funding users revenue background",
  },
  {
    id: "hilokal_company",
    productName: "Hilokal",
    category: "company",
    dimension: "company/product background",
    query: "Hilokal language exchange app company founders funding users voice rooms background",
  },
  {
    id: "partiful_company",
    productName: "Partiful",
    category: "company",
    dimension: "company/product background",
    query: "Partiful events app company founders funding users revenue background",
  },
  {
    id: "pie_company",
    productName: "Pie",
    category: "company",
    dimension: "company/product background",
    query: "Pie app Andy Dunn IRL social app company funding team growth background",
  },
  {
    id: "breeze_company",
    productName: "Breeze",
    category: "company",
    dimension: "company/product background",
    query: "Breeze dating app company founders funding IRL group dates revenue users background",
  },
  {
    id: "meet5_company",
    productName: "Meet5",
    category: "company",
    dimension: "company/product background",
    query: "Meet5 app company founders funding users over 40 group activities background",
  },
  {
    id: "weroad_company",
    productName: "WeRoad",
    category: "company",
    dimension: "company/product background",
    query: "WeRoad company founders funding revenue group travel social app background",
  },
  {
    id: "thursday_company",
    productName: "Thursday",
    category: "company",
    dimension: "company/product background",
    query: "Thursday dating app company founders funding events singles background",
  },
  {
    id: "paxmeet_company",
    productName: "Paxmeet",
    category: "company",
    dimension: "company/product background",
    query: "Paxmeet app company founders funding KYC local events India background",
  },
  {
    id: "meetmux_company",
    productName: "MeetMux",
    category: "company",
    dimension: "company/product background",
    query: "MeetMux AI activity social platform company founders funding growth India background",
  },
  {
    id: "sewayou_company",
    productName: "SewaYou",
    category: "company",
    dimension: "company/product background second pass",
    query: "SewaYou language exchange app company founder team funding downloads revenue background",
  },
  {
    id: "conversation_exchange_company",
    productName: "Conversation Exchange",
    category: "company",
    dimension: "company/product background second pass",
    query: "Conversation Exchange language exchange app company founder team users background",
  },
  {
    id: "talk4now_company",
    productName: "Talk4Now",
    category: "company",
    dimension: "company/product background second pass",
    query: "Talk4Now language exchange app company founder team downloads revenue background",
  },
  {
    id: "linguado_company",
    productName: "Linguado",
    category: "company",
    dimension: "company/product background second pass",
    query: "Linguado language exchange app company founders funding users background",
  },
  {
    id: "meetalk_company",
    productName: "meeTalk",
    category: "company",
    dimension: "company/product background second pass",
    query: "meeTalk language exchange app company founders team downloads background",
  },
  {
    id: "langpal_company",
    productName: "LangPal",
    category: "company",
    dimension: "company/product background second pass",
    query: "LangPal language exchange app company founders team funding users background",
  },
  {
    id: "matchalingua_company",
    productName: "MatchaLingua",
    category: "company",
    dimension: "company/product background second pass",
    query: "MatchaLingua language exchange app company founders team users background",
  },
  {
    id: "slowly_company",
    productName: "Slowly",
    category: "company",
    dimension: "company/product background second pass",
    query: "Slowly app company founders team funding users pen pal language exchange background",
  },
  {
    id: "fluentpal_company",
    productName: "FluentPal",
    category: "company",
    dimension: "company/product background second pass",
    query: "FluentPal language app company founder team funding downloads background",
  },
  {
    id: "roamchat_company",
    productName: "RoamChat",
    category: "company",
    dimension: "company/product background second pass",
    query: "RoamChat language exchange app company founder team users background",
  },
  {
    id: "lingbe_company",
    productName: "Lingbe",
    category: "company",
    dimension: "company/product background second pass",
    query: "Lingbe language exchange app company founders funding downloads revenue background",
  },
  {
    id: "speakyparrot_company",
    productName: "SpeakyParrot",
    category: "company",
    dimension: "company/product background second pass",
    query: "SpeakyParrot language exchange app company founder team users background",
  },
  {
    id: "fluently_company",
    productName: "Fluently",
    category: "company",
    dimension: "company/product background second pass",
    query: "Fluently language app company founders funding users background",
  },
  {
    id: "status_ai_company",
    productName: "Status AI",
    category: "company",
    dimension: "company/product background second pass",
    query: "Status AI social media simulation app company founders funding users revenue background",
  },
  {
    id: "butterflies_ai_company",
    productName: "Butterflies AI",
    category: "company",
    dimension: "company/product background second pass",
    query: "Butterflies AI social app company founders funding users background",
  },
  {
    id: "daze_company",
    productName: "Daze",
    category: "company",
    dimension: "company/product background second pass",
    query: "Daze social messaging app company founders funding users Gen Z background",
  },
  {
    id: "shapes_company",
    productName: "Shapes",
    category: "company",
    dimension: "company/product background second pass",
    query: "Shapes AI social app company founders funding Discord AI characters background",
  },
  {
    id: "character_replika_chai_company",
    productName: "Character.AI / Replika / Chai",
    category: "company",
    dimension: "company/product background second pass",
    query: "Character.AI Replika Chai AI companion companies founders funding users revenue background",
  },
  {
    id: "born_pengu_company",
    productName: "Born / Pengu",
    category: "company",
    dimension: "company/product background second pass",
    query: "Born Pengu AI companion gaming app companies founders funding users background",
  },
  {
    id: "dippy_ai_company",
    productName: "Dippy AI",
    category: "company",
    dimension: "company/product background second pass",
    query: "Dippy AI companion app company founders funding users revenue background",
  },
  {
    id: "kindroid_nomi_blush_company",
    productName: "Kindroid / Nomi / Blush",
    category: "company",
    dimension: "company/product background second pass",
    query: "Kindroid Nomi Blush AI companion app companies founders funding users revenue background",
  },
  {
    id: "polybuzz_hiwaifu_linky_company",
    productName: "PolyBuzz / HiWaifu / Linky",
    category: "company",
    dimension: "company/product background second pass",
    query: "PolyBuzz HiWaifu Linky AI companion app companies founders funding users revenue background",
  },
  {
    id: "caveduck_charms_pictoria_code27_company",
    productName: "Caveduck / Charms / Pictoria / CODE27",
    category: "company",
    dimension: "company/product background second pass",
    query: "Caveduck Charms Pictoria CODE27 AI companion app companies founders users background",
  },
  {
    id: "plots_saturday_posh_company",
    productName: "Plots / Saturday / Posh",
    category: "company",
    dimension: "company/product background second pass",
    query: "Plots Saturday Posh IRL social app companies founders funding events users background",
  },
  {
    id: "aglow_life_company",
    productName: "Aglow Life",
    category: "company",
    dimension: "company/product background second pass",
    query: "Aglow Life AI matchmaking IRL social app company founders funding users background",
  },
  {
    id: "weekend_company",
    productName: "Weekend",
    category: "company",
    dimension: "company/product background second pass",
    query: "Weekend social app company founders funding IRL events users background",
  },
  {
    id: "wemeet_by_weroad_company",
    productName: "WeMeet by WeRoad",
    category: "company",
    dimension: "company/product background second pass",
    query: "WeMeet by WeRoad social travel app company founders funding users background",
  },
];

async function runSearch(target) {
  const response = await fetchWithRetry("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: target.query,
      type: "auto",
      category: target.category,
      numResults: 8,
      contents: {
        highlights: true,
      },
    }),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    return {
      ...target,
      ok: false,
      status: response.status,
      error: body,
      results: [],
    };
  }

  return {
    ...target,
    ok: true,
    status: response.status,
    requestId: body.requestId,
    results: (body.results ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.url,
      publishedDate: result.publishedDate ?? null,
      author: result.author ?? null,
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 420),
    })),
  };
}

const startedAt = new Date().toISOString();
const searches = [];
for (const target of targets) {
  searches.push(await runSearch(target));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  purpose:
    "Targeted Exa company/people/financial deep-dive for products whose company-background coverage was still mostly market-level.",
  searches,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/exa-company-background-deep-dive.json", import.meta.url),
  `${JSON.stringify(artifact, null, 2)}\n`,
);

console.log(JSON.stringify({
  ok: true,
  searches: searches.map((search) => ({
    id: search.id,
    productName: search.productName,
    category: search.category,
    ok: search.ok,
    status: search.status,
    resultCount: search.results.length,
    requestId: search.requestId,
  })),
}, null, 2));
