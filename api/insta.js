export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({
      error: "username required",
      developer: "@lakshitpatidar"
    });
  }

  try {
    // PRIMARY REQUEST
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "*/*",
          "X-Requested-With": "XMLHttpRequest"
        }
      }
    );

    if (!response.ok) throw new Error("Primary fetch failed");

    const json = await response.json();
    const user = json.data.user;

    // PROFILE
    const profile = {
      username: user.username,
      full_name: user.full_name,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
      posts_count: user.edge_owner_to_timeline_media.count,
      bio: user.biography,
      profile_pic: user.profile_pic_url_hd
    };

    // POSTS (LIMIT 15)
    const posts =
      user.edge_owner_to_timeline_media.edges
        .slice(0, 15)
        .map((p) => {
          const node = p.node;

          return {
            id: node.id,
            caption:
              node.edge_media_to_caption.edges[0]?.node.text || "",
            likes: node.edge_liked_by.count,
            comments: node.edge_media_to_comment.count,
            media_url: node.display_url,
            video_url: node.is_video ? node.video_url : null,
            is_video: node.is_video,
            timestamp: node.taken_at_timestamp
          };
        });

    return res.status(200).json({
      ...profile,
      posts,
      developer: "@lakshitpatidar"
    });

  } catch (err) {
    // 🔁 FALLBACK METHOD (HTML SCRAPE)
    try {
      const htmlRes = await fetch(
        `https://www.instagram.com/${username}/`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        }
      );

      const html = await htmlRes.text();

      const jsonMatch = html.match(
        /window\._sharedData = (.*);<\/script>/
      );

      if (!jsonMatch) throw new Error("Fallback failed");

      const data = JSON.parse(jsonMatch[1]);
      const user =
        data.entry_data.ProfilePage[0].graphql.user;

      const posts =
        user.edge_owner_to_timeline_media.edges
          .slice(0, 15)
          .map((p) => ({
            id: p.node.id,
            caption:
              p.node.edge_media_to_caption.edges[0]?.node.text ||
              "",
            media_url: p.node.display_url,
            video_url: p.node.is_video
              ? p.node.video_url
              : null,
            is_video: p.node.is_video
          }));

      return res.status(200).json({
        username: user.username,
        followers: user.edge_followed_by.count,
        posts,
        developer: "@lakshitpatidar"
      });

    } catch (fallbackErr) {
      return res.status(500).json({
        error: "Failed to fetch Instagram data",
        developer: "@lakshitpatidar"
      });
    }
  }
      }
