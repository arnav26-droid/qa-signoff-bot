function formatTimeRemaining(expiresAtMs) {
  const diffMs = expiresAtMs - Date.now();
  if (diffMs <= 0) return "less than a minute";
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatClockTime(ms) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

module.exports = { formatTimeRemaining, formatClockTime };
