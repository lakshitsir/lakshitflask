export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({
      error: "username required",
      developer: "@lakshitpatidar"
    });
  }

  const HEADERS_LIST = [
    "Instagram 155.0.0.37.107 Android",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  ];

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  async function fetchInstagram() {
    const headers = {
      "User-Agent":
        HEADERS_LIST[Math.floor(Math.random() * HEADERS_LIST.length)],
      "X-IG-App-ID": "936619743392459"
    };

    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      { headers }
    );

    if (!res.ok) throw new Error("blocked");

    return res.json();
  }

  try {
    // 🔁 RETRY SYSTEM (NO CRASH)
    for (let i = 0; i < 3; i++) {
      try {
        const data = await fetchInstagram();
        const user = data.data.user;

        return res.status(200).json({
          username: user.username,
          full_name: user.full_name,
          followers: user.edge_followed_by.count,
          posts: user.edge_owner_to_timeline_media.edges
            .slice(0, 15)
            .map(p => ({
              media_url: p.node.display_url,
              video_url: p.node.is_video
                ? p.node.video_url
                : null
            })),
          developer: "@lakshitpatidar"
        });

      } catch {
        await delay(1000 + Math.random() * 1000);
      }
    }

    throw new Error("All retries failed");

  } catch {
    return res.status(500).json({
      error: "Instagram blocked request",
      developer: "@lakshitpatidar"
    });
  }
}
