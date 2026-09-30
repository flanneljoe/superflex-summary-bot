export const RECAP_COMMAND = {
  name: "recap",
  description: "Get this week's league recap",
  options: [
    { name: "league_id", description: "Your Sleeper league ID", type: 3, required: true },
  ],
};

export const RECAP_WEEK_COMMAND = {
  name: "recap-week",
  description: "Look up a previous week's recap",
  options: [
    { name: "league_id", description: "Your Sleeper league ID", type: 3, required: true },
    { name: "week", description: "Week number", type: 4, required: true },
  ],
};

export const SUBSCRIBE_COMMAND = {
  name: "subscribe",
  description: "Post this league's recap here automatically each week",
  options: [
    { name: "league_id", description: "Your Sleeper league ID", type: 3, required: true },
  ],
};

export const UNSUBSCRIBE_COMMAND = {
  name: "unsubscribe",
  description: "Stop automatic weekly recaps for a league in this server",
  options: [
    { name: "league_id", description: "Your Sleeper league ID", type: 3, required: true },
  ],
};

export const SUBSCRIPTIONS_COMMAND = {
  name: "subscriptions",
  description: "List leagues subscribed for automatic recaps in this server",
};

export const HELP_COMMAND = {
  name: "help",
  description: "Show available commands and how to use them",
};