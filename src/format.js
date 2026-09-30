const AMBER = 0xE8A33D;

export function formatSummaryAsEmbeds(markdown) {
  const sections = markdown.split(/\n## /);
  const intro = sections[0].trim();
  const matchups = sections.slice(1);

  const embeds = [{ description: intro, color: AMBER }];

  for (const section of matchups) {
    const newlineIndex = section.indexOf("\n");
    const title = section.slice(0, newlineIndex).trim();
    const body = section.slice(newlineIndex + 1).trim();
    embeds.push({ title, description: body, color: AMBER });
  }

  return embeds;
}

export function buildHelpEmbed() {
  return {
    title: "League Recap Bot — Commands",
    color: 0xE8A33D,
    fields: [
      { name: "/recap `league_id`", value: "Generate (or fetch) this week's recap for a league." },
      { name: "/recap-week `league_id` `week`", value: "Look up a specific past week's recap." },
      { name: "/subscribe `league_id`", value: "Auto-post this league's recap in this channel every week, once it's ready." },
      { name: "/unsubscribe `league_id`", value: "Stop auto-posting this league's recap in this server." },
      { name: "/subscriptions", value: "List which leagues are subscribed to post in this server." },
    ],
  };
}