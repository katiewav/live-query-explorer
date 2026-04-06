import type {
  RedditPost,
  RedditComment,
  InstagramPost,
  TikTokPost,
  SoundResult,
  RedditResult,
  InstagramResult,
  TikTokResult,
} from "@/types";

const now = Math.floor(Date.now() / 1000);
const hour = 3600;

function mockRedditComments(postId: string): RedditComment[] {
  return [
    {
      id: `${postId}_c1`,
      body: "This is getting way more attention than I expected. The quality is unreal.",
      score: 342,
      author: "design_observer",
      created_utc: now - 2 * hour,
    },
    {
      id: `${postId}_c2`,
      body: "Been following this trend for months. It's only getting bigger.",
      score: 189,
      author: "trend_watcher_99",
      created_utc: now - 4 * hour,
    },
  ];
}

const mockRedditPosts: RedditPost[] = [
  {
    id: "t3_abc123",
    title: "Why is everyone suddenly talking about this?",
    selftext: "I've seen this everywhere on my feed. The craftsmanship and attention to detail is genuinely impressive compared to competitors.",
    subreddit: "fashion",
    score: 1847,
    num_comments: 234,
    created_utc: now - 3 * hour,
    permalink: "/r/fashion/comments/abc123",
    author: "streetstyle_daily",
    url: "https://reddit.com/r/fashion/comments/abc123",
    top_comments: mockRedditComments("t3_abc123"),
  },
  {
    id: "t3_def456",
    title: "Unpopular opinion: this is overrated and overpriced",
    selftext: "I don't get the hype. You're paying for the name at this point. There are better alternatives at half the price.",
    subreddit: "unpopularopinion",
    score: 923,
    num_comments: 567,
    created_utc: now - 8 * hour,
    permalink: "/r/unpopularopinion/comments/def456",
    author: "honest_consumer",
    url: "https://reddit.com/r/unpopularopinion/comments/def456",
    top_comments: mockRedditComments("t3_def456"),
  },
  {
    id: "t3_ghi789",
    title: "Just got mine — here's my honest review after 2 weeks",
    selftext: "TL;DR: worth the money. The materials feel premium and it's held up great so far. Happy to answer questions.",
    subreddit: "BuyItForLife",
    score: 2103,
    num_comments: 189,
    created_utc: now - 24 * hour,
    permalink: "/r/BuyItForLife/comments/ghi789",
    author: "quality_seeker",
    url: "https://reddit.com/r/BuyItForLife/comments/ghi789",
    top_comments: mockRedditComments("t3_ghi789"),
  },
  {
    id: "t3_jkl012",
    title: "The marketing behind this brand is actually genius",
    selftext: "They've managed to create scarcity and desirability without being obnoxious about it. Case study material.",
    subreddit: "marketing",
    score: 456,
    num_comments: 78,
    created_utc: now - 36 * hour,
    permalink: "/r/marketing/comments/jkl012",
    author: "brand_analyst",
    url: "https://reddit.com/r/marketing/comments/jkl012",
    top_comments: mockRedditComments("t3_jkl012"),
  },
  {
    id: "t3_mno345",
    title: "European luxury brands are having a moment right now",
    selftext: "Between this and a few others, the European houses are dominating social media in a way we haven't seen since 2019.",
    subreddit: "europe",
    score: 312,
    num_comments: 45,
    created_utc: now - 48 * hour,
    permalink: "/r/europe/comments/mno345",
    author: "eu_culture_fan",
    url: "https://reddit.com/r/europe/comments/mno345",
    top_comments: mockRedditComments("t3_mno345"),
  },
];

const mockInstagramPosts: InstagramPost[] = [
  {
    id: "ig_001",
    caption: "Obsessed with this piece. The attention to detail is everything ✨ #luxury #style",
    like_count: 12400,
    comment_count: 342,
    timestamp: new Date(now * 1000 - 2 * hour * 1000).toISOString(),
    permalink: "https://instagram.com/p/ig_001",
    owner_username: "fashionista.daily",
    media_type: "IMAGE",
  },
  {
    id: "ig_002",
    caption: "Street style catch of the day. This bag is everywhere right now 📸",
    like_count: 8900,
    comment_count: 156,
    timestamp: new Date(now * 1000 - 6 * hour * 1000).toISOString(),
    permalink: "https://instagram.com/p/ig_002",
    owner_username: "streetsnap.paris",
    media_type: "IMAGE",
  },
  {
    id: "ig_003",
    caption: "My spring wardrobe addition. Was it worth the splurge? Absolutely. #fashion #investment",
    like_count: 5600,
    comment_count: 89,
    timestamp: new Date(now * 1000 - 18 * hour * 1000).toISOString(),
    permalink: "https://instagram.com/p/ig_003",
    owner_username: "minimal.wardrobe",
    media_type: "CAROUSEL_ALBUM",
  },
  {
    id: "ig_004",
    caption: "Window shopping in Milan. Can't stop thinking about this one 🇮🇹",
    like_count: 3200,
    comment_count: 67,
    timestamp: new Date(now * 1000 - 30 * hour * 1000).toISOString(),
    permalink: "https://instagram.com/p/ig_004",
    owner_username: "travel.luxe",
    media_type: "IMAGE",
  },
];

const mockTikTokPosts: TikTokPost[] = [
  {
    id: "tt_001",
    desc: "POV: you finally understand the hype #fyp #luxury #fashion",
    digg_count: 89000,
    comment_count: 1200,
    play_count: 450000,
    share_count: 3400,
    create_time: now - 4 * hour,
    author_name: "fashiontok.queen",
    music_title: "original sound - luxevibes",
    music_author: "luxevibes",
  },
  {
    id: "tt_002",
    desc: "Dupe vs real — can you tell the difference? 👀 #dupe #fashion",
    digg_count: 234000,
    comment_count: 4500,
    play_count: 1200000,
    share_count: 12000,
    create_time: now - 12 * hour,
    author_name: "dupedetector",
    music_title: "Nasty - Tinashe",
    music_author: "Tinashe",
  },
  {
    id: "tt_003",
    desc: "Why this brand is winning right now — a thread 🧵",
    digg_count: 56000,
    comment_count: 890,
    play_count: 320000,
    share_count: 5600,
    create_time: now - 24 * hour,
    author_name: "brandbreakdown",
    music_title: "original sound - brandbreakdown",
    music_author: "brandbreakdown",
  },
  {
    id: "tt_004",
    desc: "This is the sound of luxury rn 🎵 #luxurytok",
    digg_count: 12000,
    comment_count: 230,
    play_count: 89000,
    share_count: 890,
    create_time: now - 40 * hour,
    author_name: "soundcheck.style",
    music_title: "Espresso - Sabrina Carpenter",
    music_author: "Sabrina Carpenter",
  },
];

const mockSounds: SoundResult[] = [
  { id: "s1", title: "original sound - luxevibes", author: "luxevibes", play_count: 2300000, video_count: 1200 },
  { id: "s2", title: "Nasty - Tinashe", author: "Tinashe", play_count: 89000000, video_count: 45000 },
  { id: "s3", title: "Espresso - Sabrina Carpenter", author: "Sabrina Carpenter", play_count: 150000000, video_count: 78000 },
  { id: "s4", title: "original sound - brandbreakdown", author: "brandbreakdown", play_count: 890000, video_count: 340 },
];

const mockTags = [
  "luxury", "fashion", "style", "ootd", "designer",
  "streetstyle", "investmentpiece", "luxurylifestyle",
];

export function getMockReddit(): RedditResult {
  return { posts: mockRedditPosts, error: false, platform: "reddit" };
}

export function getMockInstagram(): InstagramResult {
  return { posts: mockInstagramPosts, tags: mockTags, error: false, platform: "instagram" };
}

export function getMockTikTok(): TikTokResult {
  return { posts: mockTikTokPosts, sounds: mockSounds, error: false, platform: "tiktok" };
}
