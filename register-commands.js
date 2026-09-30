import "dotenv/config";
import {
  RECAP_COMMAND, RECAP_WEEK_COMMAND,
  SUBSCRIBE_COMMAND, UNSUBSCRIBE_COMMAND, SUBSCRIPTIONS_COMMAND,
  HELP_COMMAND,
} from "./src/commands.js";

const { DISCORD_APP_ID, DISCORD_BOT_TOKEN } = process.env;

const res = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`, {
  method: "PUT",
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify([RECAP_COMMAND, 
        RECAP_WEEK_COMMAND, 
        SUBSCRIBE_COMMAND,
        UNSUBSCRIBE_COMMAND,
        SUBSCRIPTIONS_COMMAND,
        HELP_COMMAND,
    ]),
});

console.log(await res.json());