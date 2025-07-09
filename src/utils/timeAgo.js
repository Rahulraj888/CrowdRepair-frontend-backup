export function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
  }
  