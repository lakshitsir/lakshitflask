import { HttpsProxyAgent } from "https-proxy-agent";

// 🔁 Proxy sources
const PROXY_SOURCES = [
  "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
  "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt"
];

// 🧠 Headers rotation
const HEADERS_LIST = [
  "Instagram 155.0.0.37.107 Android",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
];

// 🎯 Delay
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// 🌐 Fetch proxies
async function getProxies() {
  const results = await Promise.allSettled(
    PROXY_SOURCES.map(url => fetch(url).then(r => r.text()))
  );

  return results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value.split("\n"))
    .map(p => p.trim())
    .filter(Boolean)
    .slice(0, 15);
}

// ⚡ Quick proxy check
async function testProxy(proxy) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000);

    const res = await fetch("https://httpbin.org/ip", {
      signal: controller.signal,
      agent: new HttpsProxyAgent(`http://${proxy}`)
    });

    return res.ok;
  } catch {
    return false;
  }
}

// 📡 Instagram fetch
async function fetchInstagram(username, agent = null) {
  const headers = {
    "User-Agent":
      HEADERS_LIST[Math.floor(Math.random() * HEADERS_LIST.length)],
    "X-IG-App-ID": "936619743392459"
  };

  const res = await fetch(
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
    { headers, agent }
  );

  if (!res.ok) throw new Error("blocked");

  return res.json();
}

// 🎨 Format response
function format(user) {
  return {
    username: user.username,
    full_name: user.full_name,
    followers: user.edge_followed_by.count,
    following: user.edge_follow.count,
    posts_count: user.edge_owner_to_timeline_media.count,
    posts: user.edge_owner_to_timeline_media.edges
      .slice(0, 15)
      .map(p => ({
        id: p.node.id,
        caption:
          p.node.edge_media_to_caption.edges[0]?.node.text || "",
        media_url: p.node.display_url,
        video_url: p.node.is_video ? p.node.video_url : null,
        is_video: p.node.is_video
      })),
    developer: "@lakshitpatidar"
  };
}

// 🚀 MAIN
export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({
      error: "username required",
      developer: "@lakshitpatidar"
    });
  }

  try {
    // 🟢 Attempt 1: direct
    const data = await fetchInstagram(username);
    return res.status(200).json(format(data.data.user));

  } catch {
    try {
      // 🟡 Attempt 2: retry direct
      await delay(1000);
      const data = await fetchInstagram(username);
      return res.status(200).json(format(data.data.user));

    } catch {
      try {
        // 🔵 Attempt 3: proxy rotation
        const proxies = await getProxies();

        for (const proxy of proxies) {
          const alive = await testProxy(proxy);
          if (!alive) continue;

          try {
            const agent = new HttpsProxyAgent(`http://${proxy}`);
            const data = await fetchInstagram(username, agent);

            return res.status(200).json({
              ...format(data.data.user),
              proxy_used: proxy
            });

          } catch {
            continue;
          }
        }

        throw new Error("all proxies failed");

      } catch {
        return res.status(500).json({
          error: "All methods failed",
          developer: "@lakshitpatidar"
        });
      }
    }
  }
  }
