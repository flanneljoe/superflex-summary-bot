import { verifyDiscordRequest } from "./verify.js";
import { formatSummaryAsEmbeds } from "./format.js";
import { buildHelpEmbed } from "./format.js";

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2 };
const InteractionResponseType = { PONG: 1, DEFERRED_CHANNEL_MESSAGE: 5 };

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Expected POST", { status: 405 });
    }

    const { isValid, body } = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return new Response("Invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const { name, options } = interaction.data;
        const getOpt = (key) => options?.find(o => o.name === key)?.value;

        if (name === "recap") {
            ctx.waitUntil(handleRecap(getOpt("league_id"), interaction, env));
        } else if (name === "recap-week") {
            ctx.waitUntil(handleRecapWeek(getOpt("league_id"), getOpt("week"), interaction, env));
        } else if (name === "subscribe") {
            ctx.waitUntil(handleSubscribe(getOpt("league_id"), interaction, env));
        } else if (name === "unsubscribe") {
            ctx.waitUntil(handleUnsubscribe(getOpt("league_id"), interaction, env));
        } else if (name === "subscriptions") {
            ctx.waitUntil(handleSubscriptions(interaction, env));
        } else if (name === "help") {
            ctx.waitUntil(handleHelp(interaction, env));
        } else {
            return new Response("Unknown command", { status: 400 });
        }

        return Response.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE });
    }

    return new Response("Unhandled interaction type", { status: 400 });
  },
};

async function sendFollowup(interaction, env, payload) {
  try {
    const resp = await fetch(
      `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${interaction.token}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    if (!resp.ok) {
      console.error("Discord followup failed:", resp.status, await resp.text());
    }
  } catch (err) {
    console.error("Error sending followup to Discord:", err);
  }
}

async function handleRecap(leagueId, interaction, env) {
  console.log("handleRecap started for", leagueId);
  try {
    const resp = await fetch(`${env.API_BASE}/api/generate/${leagueId}`, { method: "POST" });
    console.log("Railway API responded:", resp.status);
    const data = await resp.json();

    if (resp.status !== 200) {
      await sendFollowup(interaction, env, { content: `Couldn't generate a recap: ${data.detail ?? "unknown error"}` });
      return;
    }
    await sendSummaryEmbeds(interaction, env, formatSummaryAsEmbeds(data.summary));
  } catch (err) {
    console.error("handleRecap threw:", err);
    await sendFollowup(interaction, env, { content: "Something went wrong generating that recap." });
  }
}

async function handleRecapWeek(leagueId, week, interaction, env) {
  const resp = await fetch(`${env.API_BASE}/api/summary/${leagueId}/${week}`);

  if (resp.status === 404) {
    await sendFollowup(interaction, env, { content: "No recap exists for that league/week yet." });
    return;
  }
  const data = await resp.json();
  await sendSummaryEmbeds(interaction, env, formatSummaryAsEmbeds(data.summary));
}

async function sendSummaryEmbeds(interaction, env, embeds) {
  const chunks = chunkEmbeds(embeds);
  for (const chunk of chunks) {
    await sendFollowup(interaction, env, { embeds: chunk });
  }
}

function chunkEmbeds(embeds, maxPerMessage = 10, maxCharsPerMessage = 5500) {
  // 5500 rather than 6000 flat — small safety margin below Discord's hard cap
  const chunks = [];
  let current = [];
  let currentChars = 0;

  for (const embed of embeds) {
    const embedChars = (embed.title?.length ?? 0) + (embed.description?.length ?? 0);

    const wouldExceedCount = current.length >= maxPerMessage;
    const wouldExceedChars = currentChars + embedChars > maxCharsPerMessage;

    if (current.length > 0 && (wouldExceedCount || wouldExceedChars)) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(embed);
    currentChars += embedChars;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function handleSubscribe(leagueId, interaction, env) {
  const resp = await fetch(`${env.API_BASE}/api/discord-subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      league_id: leagueId,
      channel_id: interaction.channel_id,
      guild_id: interaction.guild_id,
    }),
  });

  const message = resp.ok
    ? `This channel is now subscribed for weekly recaps of league \`${leagueId}\`.`
    : "Couldn't save that subscription — check the league ID and try again.";
  await sendFollowup(interaction, env, { content: message });
}

async function handleUnsubscribe(leagueId, interaction, env) {
  const resp = await fetch(
    `${env.API_BASE}/api/discord-subscriptions/${leagueId}?guild_id=${interaction.guild_id}`,
    { method: "DELETE" }
  );

  const message = resp.ok
    ? `Unsubscribed league \`${leagueId}\` from this server.`
    : "Couldn't find that subscription for this server.";
  await sendFollowup(interaction, env, { content: message });
}

async function handleSubscriptions(interaction, env) {
  const resp = await fetch(`${env.API_BASE}/api/discord-subscriptions?guild_id=${interaction.guild_id}`);
  const data = await resp.json();

  if (!data.subscriptions?.length) {
    await sendFollowup(interaction, env, { content: "No leagues are subscribed in this server yet." });
    return;
  }

  const lines = data.subscriptions.map(s => `• League \`${s.league_id}\` → <#${s.channel_id}>`);
  await sendFollowup(interaction, env, { content: lines.join("\n") });
}

async function handleHelp(interaction, env) {
  await sendFollowup(interaction, env, { embeds: [buildHelpEmbed()] });
}