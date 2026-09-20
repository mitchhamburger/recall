export function percent(wins, total) {
  return total ? `${Math.round((wins / total) * 100)}%` : "0%";
}

export function matchesForDashboard(dashboard, matches) {
  return matches.filter((match) => match.dashboardIds?.includes(dashboard.id));
}

export function dashboardSummary(dashboard, matches) {
  const dashboardMatches = matchesForDashboard(dashboard, matches);
  const matchWins = dashboardMatches.filter((match) => match.winner === "me").length;
  const games = dashboardMatches.flatMap((match) => match.games);
  const gameWins = games.filter((game) => game.winner === "me").length;

  return {
    dashboard,
    matches: dashboardMatches,
    matchesPlayed: dashboardMatches.length,
    matchWins,
    totalGames: games.length,
    gameWins,
    winRate: dashboardMatches.length ? matchWins / dashboardMatches.length : 0,
    gameWinRate: games.length ? gameWins / games.length : 0,
    winRatePercent: dashboardMatches.length
      ? Math.round((matchWins / dashboardMatches.length) * 100)
      : 0,
    winRateLabel: percent(matchWins, dashboardMatches.length),
    gameWinRateLabel: percent(gameWins, games.length),
  };
}
