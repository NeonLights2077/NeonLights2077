const { Client, GatewayIntentBits } = require("discord.js");
const WebSocket = require("ws");
const http = require("http");

// Discord Client Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//filter for Kings League
const KL_KEYWORDS = [
  "España",
  "Split 1",
  "Split 3",
  "Split 5",
  "2023-24",
  "2024-25",
  "SP5",
  "Kings Cup",
  "Queens Cup",
  "KWC Nations",
  //"Kings League Spain",
  //"Kings League Italy",
  "Kings League"
];

const KL_HERO = [
  " Hero ",
  "2025 Art Series Team Kit"
];

const KL_MYTH = [
  "Mythic"
];

const KL_PACKS = new Set([
    "Platino 2023-24",
    "Plata 2024-25",
    "Oro 2024-25",
    "Platino 2024-25",
    "Split 1 Rewards",
    "Platino+ 2024-25",
    "Oro+ 2024-25",
    "Plata+ 2024-25",
    "Split 1 Rewards+ 2024-25+",
    "Split 1 Campeones 2024-25",
    "Split 5 Platino",
    "Split 5: Oro 2024-25",
    "Split 5 Plata",
    "Split 5 Rewards",
    "Split 5 Oro",
    "S5 Wild Plata J1 2024-25",
    "S5 Wild Cards J1 2024-25",
    "S5 Rewards 2024-25",
    "S5 Wild Plata J3 2024-25",
    "S5 Wild Cards J3 2024-25",
    "S5 Wild Plata J4 2024-25",
    "S5 Wild Cards J4 2024-25",
    "S5 Wild Plata J5 2024-25",
    "S5 Wild Cards J5 2024-25",
    "S5 Wild Cards J6 2024-25",
    "S5 Wild Plata J6 2024-25",
    "S5 Wild Cards J7",
    "S5 Wild Plata J7",
    "S5 Wild Plata J8",
    "S5 Wild Cards J8",
    "S5 Wild Plata J9",
    "S5 Wild Cards J9",
    "S5 Wild Cards J10",
    "S5 Wild Plata J10",
    "S5 Wild Plata J11",
    "S5 Wild Cards J11",
    "Campeón: Split 3",
    "Pack de Bienvenida+ 2024-25",
    "Pack de Bienvenida 2024-25",
    "Pack de Bienvenida 2023-24",
    "Plata 2023-24",
    "Oro 2023-24",
    "S5 Wild Plata Play-In",
    "S5 Wild Cards Play-In",
    "S5 Wild Cards Cuartos",
    "S5 Wild Plata Cuartos",
    "S5: Campeones",
    "Split 5 Bienvenida",
    "Kings Cup Spain Reward",
    "Kings Cup Germany Reward",
    "Kings Cup Italy Reward",
    "Kings Cup Mexico Reward",
    "Kings Cup MENA Reward",
    "Kings Cup Brazil Rewards",
    "Queens Cup Spain Reward",
    "Queens Cup Mexico Reward",
    "Kings Cup Spain Prestige",
    "Kings Cup Germany Prestige",
    "Kings Cup Italy Prestige",
    "Kings Cup Mexico Prestige",
    "Kings Cup MENA Prestige",
    "Kings Cup Brazil Prestige",
    "Queens Cup Spain Prestige",
    "Queens Cup Mexico Prestige",
    "Kings Cup Spain",
    "Kings Cup Germany",
    "Kings Cup Italy",
    "Kings Cup Mexico",
    "Kings Cup MENA",
    "Kings Cup Brazil",
    "Queens Cup Spain",
    "Queens Cup Mexico",
    "Queens Cup Mexico Reward",
    "Queens Cup Spain Reward",
    "Kings Cup MENA Reward",
    "Kings Cup Mexico Reward",
    "Kings Cup Brazil Rewards",
    "Kings Cup Germany Reward",
    "Kings Cup Italy Reward",
    "Kings Cup Spain Reward",
    "Kings Cup Spain Coentrão Prestige",
    "Kings Cup Spain Coentrão",
    "Kings Cup Germany Prestige",
    "Kings Cup Germany",
    "Kings Cup America Champions",
    "Kings Cup Europe Champions",
    "Queens Cup Champions",
    "Kings World Cup Nations: Prestige",
    "Kings World Cup Nations",
    "Kings World Cup Nations: Reward",
	"Kings League Italy",
	"Kings League Italy: Prestige",
	"Kings League Spain: Prestige",
	"Kings League Spain"
]);

// ======================= CHANNEL CONFIGURATION =======================
const DEBUG_CHANNEL_ID = "1400226748611825725";
const CATCH_ALL_CHANNEL_ID = "1400207538498179162";

// Template function to format values with Discord formatting
const formatValue = (value, format = "") => {
  if (value === undefined || value === null) return "";
  
  let formatted = String(value);
  if (format.includes("bold")) formatted = `**${formatted}**`;
  if (format.includes("italic")) formatted = `*${formatted}*`;
  if (format.includes("code")) formatted = `\`${formatted}\``;
  
  return formatted;
};

// Template configuration for each channel
const CHANNEL_CONFIG = [
  // Debug channel (gets all non-filtered messages)
  {
    name: "debug",
    id: DEBUG_CHANNEL_ID,
    event: "all",
    template: (data) => {
      return `**${data.event.toUpperCase()}** | User: ${data.user?.username || "Unknown"} | Type: ${data.entity?.type || "N/A"} | Item: ${data.entity?.itemName || "N/A"} | Price: ${data.market?.price ? `${formatPrice(data.market.price)}` : "N/A"}`;
    },
    condition: (data) =>
      !["pack-opened", "market-list", "market-sold", "pack-purchased", "spinner-feed", "trade-accepted", "trade-sent", "trade-declined"].includes(
        data.event,
      ),
  },
  
  // Catch-all channel (gets all non-filtered messages in detailed format)
  {
    name: "all",
    id: CATCH_ALL_CHANNEL_ID,
    event: "all",
    template: (data) => {
      return `**${data.event.toUpperCase()}** | User: **${data.user?.username || "Unknown"}** | Data: \`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1900)}\`\`\``;
    },
    condition: (data) =>
      !["pack-opened", "market-list", "market-sold", "pack-purchased", "spinner-feed", "trade-accepted", "trade-sent", "trade-declined"].includes(
        data.event,
      ),
  },

// ======================= CS CHANNELS =======================
  // Pack opened events (mintNumber <= 30)
  {
    name: "feed-30",
    id: "1400226179038056508",
    event: "pack-opened",
    template: (data) => {
      const matchingCards = data.cards?.filter(card => card.mintNumber <= 30) || [];
      if (matchingCards.length === 0) return null;
      return matchingCards.map(card => 
        `**${card.mintBatch || "N/A"}${card.mintNumber || "N/A"}** ${card.title || "Unknown"} opened by: *${data.user?.username || "Unknown"}* - Pack ID ${data?.id} - ${data?.packName}`
      ).join("\n");
    },
    condition: (data) => data.cards?.some(card => card.mintNumber <= 30) &&
      !KL_PACKS.has(data?.packName),
  },

  // Market listings (cards/stickers < #20)
  {
    name: "listed-20",
    id: "1400226959103099041",
    event: "market-list",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return ["card", "sticker"].includes(data.entity?.type) &&
        data.entity?.mintNumber < 20 &&
        !KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // Market listings (cards/stickers < #100)
  {
    name: "listed-100",
    id: "1400227005659615373",
    event: "market-list",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return ["card", "sticker"].includes(data.entity?.type) &&
        data.entity?.mintNumber < 101 &&
        data.entity?.mintNumber > 20 &&
        !KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // Pack listings
  {
    name: "listed-packs",
    id: "1400227045677731851",
    event: "market-list",
    template: (data) => {
      return `${data.entity?.itemName || "Unknown"} listed for **${formatPrice(data.market?.price)}** by *${data.user?.username || "Unknown"}* - ${data.entity?.id} - Market \`${data.market?.id}\``;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) > 0.15 &&
      !KL_PACKS.has(data.entity?.itemName),
  },
  
  // Pack listings for less than 15 cent
  {
    name: "listed-packs-15c",
    id: "1423667054317277235",
    event: "market-list",
    template: (data) => {
      return `${data.entity?.itemName || "Unknown"} listed for **${formatPrice(data.market?.price)}** by *${data.user?.username || "Unknown"}* - ${data.entity?.id} - Market \`${data.market?.id}\``;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) <= 0.15 &&
      !KL_PACKS.has(data.entity?.itemName),
  },

  // All listings
  {
    name: "listed-all-cards",
    id: "1400227076539158560",
    event: "market-list",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        !KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // Sales ≥ $1
  {
    name: "sold-1-usd",
    id: "1400227223658827947",
    event: "market-sold",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} bought by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return ["card", "sticker"].includes(data.entity?.type) &&
        parseFloat(data.market?.price) >= 1 &&
        !KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // Pack sales
  {
    name: "sold-packs",
    id: "1400227260857974834",
    event: "market-sold",
    template: (data) => {
      return `*${data.user?.username || "Unknown"}* bought ${data.entity?.itemName || "Unknown"} for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) > 0.11 &&
      !KL_PACKS.has(data.entity?.itemName),
  },
  
  // Pack sales for 10 cents
  {
    name: "sold-packs-10c",
    id: "1423666913577402398",
    event: "market-sold",
    template: (data) => {
      return `*${data.user?.username || "Unknown"}* bought ${data.entity?.itemName || "Unknown"} for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) <= 0.11 &&
      !KL_PACKS.has(data.entity?.itemName),
  },

  // All sales (non-pack/bundle)
  {
    name: "sold-all",
    id: "1400227291140722778",
    event: "market-sold",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} bought by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        !KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },
 
  // ======================= Kings League Channels =======================
  // KL Pack opened events (mintNumber <= 50)
  {
    name: "kl-feed-50",
    id: "1428002013798727791",
    event: "pack-opened",
    template: (data) => {
      const matchingCards = data.cards?.filter(card => card.mintNumber <= 50) || [];
      if (matchingCards.length === 0) return null;
      return matchingCards.map(card => 
        `**${card.mintBatch || "N/A"}${card.mintNumber || "N/A"}** ${card.title || "Unknown"} opened by: *${data.user?.username || "Unknown"}* - Pack ID ${data?.id} - ${data?.packName}`
      ).join("\n");
    },
    condition: (data) => data.cards?.some(card => card.mintNumber <= 50) &&
      KL_PACKS.has(data?.packName),
  },

  // KL Market listings (cards/stickers < #200)
  {
    name: "kl-listed-200",
    id: "1428000363742629992",
    event: "market-list",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return ["card", "sticker"].includes(data.entity?.type) &&
        data.entity?.mintNumber < 201 &&
        KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // KL Pack listings
  {
    name: "kl-listed-packs",
    id: "1428001329741041735",
    event: "market-list",
    template: (data) => {
      return `${data.entity?.itemName || "Unknown"} listed for **${formatPrice(data.market?.price)}** by *${data.user?.username || "Unknown"}* - ${data.entity?.id} - Market \`${data.market?.id}\``;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) > 0.15 &&
      KL_PACKS.has(data.entity?.itemName),
  },
  
  // KL Pack listings for less than 15 cent
  {
    name: "kl-listed-packs-15c",
    id: "1428001258446520350",
    event: "market-list",
    template: (data) => {
      return `${data.entity?.itemName || "Unknown"} listed for **${formatPrice(data.market?.price)}** by *${data.user?.username || "Unknown"}* - ${data.entity?.id} - Market \`${data.market?.id}\``;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) <= 0.15 &&
      KL_PACKS.has(data.entity?.itemName),
  },

  // KL All listings
  {
    name: "kl-listed-all-cards",
    id: "1428001382396334110",
    event: "market-list",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },
  
  // KL All HERO listings
  {
    name: "kl-listed-all-hero-cards",
    id: "1433056194368634940",
    event: "market-list",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        KL_HERO.some(kw => name.includes(kw));
    }
  },

  // KL Sales ≥ $5
  {
    name: "kl-sold-5-usd",
    id: "1428001770810118164",
    event: "market-sold",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} bought by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return ["card", "sticker"].includes(data.entity?.type) &&
        parseFloat(data.market?.price) >= 5 &&
        KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // KL Pack sales
  {
    name: "kl-sold-packs",
    id: "1428001821779300532",
    event: "market-sold",
    template: (data) => {
      return `*${data.user?.username || "Unknown"}* bought ${data.entity?.itemName || "Unknown"} for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) > 0.11 &&
      KL_PACKS.has(data.entity?.itemName),
  },
  
  // KL Pack sales for 10 cents
  {
    name: "kl-sold-packs-10c",
    id: "1428001877504823376",
    event: "market-sold",
    template: (data) => {
      return `*${data.user?.username || "Unknown"}* bought ${data.entity?.itemName || "Unknown"} for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => data.entity?.type === "pack" &&
      parseFloat(data.market?.price) <= 0.11 &&
      KL_PACKS.has(data.entity?.itemName),
  },

  // KL sales all
  {
    name: "KL-sold-all",
    id: "1428001908781748344",
    event: "market-sold",
    template: (data) => {
      return `**${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} bought by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id}`;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },

  // Bundle listings
  {
    name: "list-bundle",
    id: "1400227416885952644",
    event: "market-list",
    template: (data) => {
      return `📦 *${data.user?.username || "Unknown"}* listed a bundle *${data.entity?.itemName || "Unknown"}* for **${formatPrice(data.market?.price)}** - #${data.entity?.id} - [Market](<https://kolex.gg/bundles/view/${data.entity?.id}>) - ID \`${data?.id}\` - ID \`${data.market?.id}\``;
    },
    condition: (data) => data.entity?.type === "bundle",
  },

  // Bundle sales
  {
    name: "sold-bundle",
    id: "1400227451585433640",
    event: "market-sold",
    template: (data) => {
      return `💰 *${data.user?.username || "Unknown"}* bought a bundle *${data.entity?.itemName || "Unknown"}* for **${formatPrice(data.market?.price)}** - #${data.entity?.id} - [Market](<https://kolex.gg/bundles/view/${data.entity?.id}>) - ID \`${data?.id}\``;
    },
    condition: (data) => data.entity?.type === "bundle",
  },

  // Listings < #20 and ≤ $0.50
  {
    name: "list20-less-50",
    id: "1400237694172532807",
    event: "market-list",
    template: (data) => {
      return `💸 **${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) =>
      ["card", "sticker"].includes(data.entity?.type) &&
      data.entity?.mintNumber < 20 &&
      parseFloat(data.market?.price) <= 0.51,
  },

  // Listings < #10 and ≤ $4
  {
    name: "list10-less-4",
    id: "1433181458738053273",
    event: "market-list",
    template: (data) => {
      return `💸 **${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) =>
      ["card", "sticker"].includes(data.entity?.type) &&
      data.entity?.mintNumber < 10 &&
      parseFloat(data.market?.price) <= 4.01,
  },
   
  // Listings < #100 and ≤ $0.15
  {
    name: "list100-less-15",
    id: "1400238804182372382",
    event: "market-list",
    template: (data) => {
      return `💸 **${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) =>
      ["card", "sticker"].includes(data.entity?.type) &&
      data.entity?.mintNumber < 100 &&
      parseFloat(data.market?.price) <= 0.15,
  },
  
  // KL Listings < #150 and ≤ $0.40
  {
    name: "kl-list150-less-40",
    id: "1433055346578161756",
    event: "market-list",
    template: (data) => {
      return `💸 **${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        data.entity?.mintNumber < 150 &&
        parseFloat(data.market?.price) <= 0.41 &&
        KL_KEYWORDS.some(kw => name.includes(kw));
    }
  },
  
  // KL Listings HERO and ≤ $20
  {
    name: "kl-list-hero-less-20usd",
    id: "1433055528900235324",
    event: "market-list",
    template: (data) => {
      return `💸 **${data.entity?.mintBatch || "N/A"}${data.entity?.mintNumber || "N/A"}** ${data.entity?.type} ${data.entity?.itemName || "Unknown"} listed by *${data.user?.username || "Unknown"}* for **${formatPrice(data.market?.price)}** - ${data.entity?.id} - [Market](<https://kolex.gg/market/${data.entity?.type}/${data.entity?.templateId}?sort=mint>) \`${data.market?.id}\``;
    },
    condition: (data) => {
      const name = data.entity?.itemName || "";
      return !["pack", "bundle"].includes(data.entity?.type) &&
        parseFloat(data.market?.price) <= 20 &&
        KL_HERO.some(kw => name.includes(kw));
    }
  },

  // Store purchases
  {
    name: "store-purchase",
    id: "1400240719423082506",
    event: "pack-purchased",
    template: (data) => {
      return `🛒 *${data.user?.username || "Unknown"}* bought ${data.amount} pack(s) \`${data.packTemplateId}\``;
    },
    condition: null,
  },
  
  // Spinner
  {
    name: "spinner",
    id: "1423670126741426176",
    event: "spinner-feed",
    template: (data) => {
      return `Spinner: *${data.user?.username || "Unknown"}* - ${data?.name}`;
    },
    condition: null,
  }

// TRADES

  // accept
  {
    name: "TRADE-ACCEPTED",
    id: "1483382452331479040",
    event: "trade-accepted",
    template: (data) => {
      return `✅ Accepted | by *${data.receiver.username || "Unknown"}* \`${data.receiver.id}\` from *${data.sender.username || "Unknown"}* \`${data.sender.id}\``;
    },
    condition: null,
  },

  // sent
  {
    name: "TRADE-SENT",
    id: "1483382452331479040",
    //id: "1483382662579359915",
    event: "trade-sent",
    template: (data) => {
      return `📤 Sent | to *${data.receiver.username || "Unknown"}* \`${data.receiver.id}\` from *${data.sender.username || "Unknown"}* \`${data.sender.id}\``;
    },
    condition: null,
  },
 
  // decline
  {
    name: "TRADE-DECLINED",
    id: "1483382452331479040",
    //id: "1483382717784657952",
    event: "trade-declined",
    template: (data) => {
      return `❌ Declined | by *${data.receiver.username || "Unknown"}* \`${data.receiver.id}\`, was sent from *${data.sender.username || "Unknown"}* \`${data.sender.id}\``;
    },
    condition: null,
  },  
  
];

// WebSocket Management
let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 20; // Increased max attempts
let pingInterval;
let heartbeatInterval;
let reconnectTimeout;
let lastMessageTime = Date.now();
let connectionMonitorInterval;

// ======================= UTILITY FUNCTIONS =======================
function formatPrice(price) {
  const num = parseFloat(price);
  return num.toFixed(2).replace(/^0+(\d)/, "$1");
}

function shouldProcessEvent(eventName) {
  // Skip these events completely
  const SKIP_EVENTS = ["join-public-feed"];
  return !SKIP_EVENTS.includes(eventName);
}

function generateWebSocketKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return Buffer.from(key).toString("base64");
}
// ====================================================================

function connectWebSocket() {
  // Clear any existing timeouts and intervals
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  const wsUrl = "wss://sockets.kolex.gg/socket.io/?EIO=3&transport=websocket";
  
  console.log(`🔄 Attempting connection to: ${wsUrl} (Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
  
  const wsKey = generateWebSocketKey();
  
  const options = {
    headers: {
      "accept-language": "en,ru;q=0.9,uk;q=0.8,ro;q=0.7,en-GB;q=0.6,fr;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-websocket-extensions": "permessage-deflate; client_max_window_bits",
      "sec-websocket-key": wsKey,
      "sec-websocket-version": "13",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "origin": "https://kolex.gg",
      "host": "sockets.kolex.gg"
    },
    handshakeTimeout: 15000,
    timeout: 30000,
    rejectUnauthorized: true,
    followRedirects: true
  };

  socket = new WebSocket(wsUrl, options);

  socket.on("open", () => {
    console.log(`🟢 WebSocket Connected to ${wsUrl}`);
    sendToDebugChannel(`🟢 WebSocket Connected to Kolex.gg`);
    
    reconnectAttempts = 0;
    lastMessageTime = Date.now();
    
    // Set up ping interval (every 15 seconds instead of 20)
    pingInterval = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send("2");
        console.log("📤 Sent ping (2)");
      }
    }, 15000);
    
    // Set up heartbeat message to keep connection alive
    heartbeatInterval = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        // Send a heartbeat message - some servers expect this
        socket.send('42["heartbeat"]');
        console.log("💓 Sent heartbeat");
      }
    }, 30000); // Every 30 seconds
    
    // Send join message after a short delay
    setTimeout(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send('42["join-public-feed"]');
        console.log("📤 Sent join-public-feed message");
      }
    }, 1000);
  });

  socket.on("close", (code, reason) => {
    console.log(`🔴 WebSocket Disconnected - Code: ${code}, Reason: ${reason || 'No reason'}`);
    sendToDebugChannel(`🔴 WebSocket Disconnected (Code: ${code})`);
    
    // Clear intervals
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    // Attempt to reconnect with exponential backoff
    scheduleReconnect();
  });

  socket.on("error", (err) => {
    console.error(`WebSocket Error:`, err.message);
    sendToDebugChannel(`❗ WebSocket Error: ${err.message}`);
  });

  socket.on("message", (rawData) => {
    try {
      const data = rawData.toString();
      lastMessageTime = Date.now(); // Update last message time
      
      // Handle Socket.io ping/pong
      if (data === "2") {
        socket.send("3");
        console.log("📤 Sent pong (3)");
        return;
      }

      if (data === "3") {
        // Received pong, ignore
        return;
      }

      // Handle Socket.io handshake
      if (data.startsWith("0")) {
        console.log("🤝 Socket.io handshake received");
        return;
      }

      if (data.startsWith("40")) {
        console.log("🔌 Socket.io connected");
        return;
      }

      // Handle Socket.io messages
      if (data.startsWith("42")) {
        try {
          const payload = data.substring(2);
          const parsed = JSON.parse(payload);
          
          if (Array.isArray(parsed) && parsed.length >= 2) {
            const [eventName, eventData] = parsed;
            
            if (eventName && eventData) {
              eventData.event = eventName;
              
              if (shouldProcessEvent(eventName)) {
                processEventChannels(eventData);
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing Socket.io message:", parseError.message);
        }
        return;
      }
      
      // Log other message types for debugging
      if (data.length < 100) {
        console.log("📨 Unknown message:", data);
      }
      
    } catch (error) {
      console.error("Error processing message:", error);
      sendToDebugChannel(`❌ Processing Error: ${error.message}`);
    }
  });
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log("❌ Max reconnection attempts reached");
    sendToDebugChannel("❌ Max reconnection attempts reached - bot needs restart");
    return;
  }
  
  // Exponential backoff: 5s, 10s, 20s, 40s, 80s, 160s, etc. Max 5 minutes
  const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 300000);
  console.log(`🔄 Scheduling reconnection attempt ${reconnectAttempts + 1} in ${Math.round(delay/1000)}s`);
  
  reconnectTimeout = setTimeout(() => {
    reconnectAttempts++;
    connectWebSocket();
  }, delay);
}

function processEventChannels(eventData) {
  CHANNEL_CONFIG.forEach((config) => {
    try {
      if (
        (config.event === "all" || config.event === eventData.event) &&
        (config.condition === null || config.condition(eventData))
      ) {
        const message = config.template(eventData);
        if (message) { // Only send if template returns a message
          sendToChannel(config.id, message);
        }
      }
    } catch (error) {
      console.error(`Error processing channel ${config.name}:`, error);
    }
  });
}

function sendToChannel(channelId, message) {
  if (!message) return;
  
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    // Split long messages if needed
    if (message.length > 2000) {
      const chunks = message.match(/.{1,1900}/g) || [];
      chunks.forEach(chunk => {
        channel.send(chunk).catch((err) => {
          console.error(`Error sending to channel ${channelId}:`, err);
        });
      });
    } else {
      channel.send(message).catch((err) => {
        console.error(`Error sending to channel ${channelId}:`, err);
      });
    }
  }
}

function sendToDebugChannel(message) {
  sendToChannel(DEBUG_CHANNEL_ID, message);
}

// Bot Startup
client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  sendToDebugChannel("🤖 Bot started successfully");
  
  // Small delay before connecting WebSocket
  setTimeout(() => {
    connectWebSocket();
  }, 2000);
  
  // Start connection monitor
  connectionMonitorInterval = setInterval(() => {
    const timeSinceLastMessage = Date.now() - lastMessageTime;
    
    // If no messages for 2 minutes, force reconnect
    if (timeSinceLastMessage > 120000 && socket?.readyState === WebSocket.OPEN) {
      console.log(`⚠️ No messages for ${Math.round(timeSinceLastMessage/1000)}s, forcing reconnect`);
      sendToDebugChannel(`⚠️ No messages for ${Math.round(timeSinceLastMessage/1000)}s, reconnecting...`);
      socket.close();
    }
  }, 30000); // Check every 30 seconds
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
  sendToDebugChannel(`❗ Discord Client Error: ${error.message}`);
});

// Health check server
const server = http.createServer((req, res) => {
  const timeSinceLastMessage = Date.now() - lastMessageTime;
  const wsStatus = socket?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected';
  const wsState = socket?.readyState;
  
  res.writeHead(200, { 
    'Content-Type': 'text/plain',
    'Connection': 'keep-alive'
  });
  res.end(`Bot Status:
- WebSocket: ${wsStatus} (State: ${wsState})
- Last Message: ${Math.round(timeSinceLastMessage/1000)}s ago
- Reconnect Attempts: ${reconnectAttempts}
- Uptime: ${Math.round(process.uptime() / 60)} minutes
- Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
`);
});
server.keepAliveTimeout = 60000; // 60 seconds
server.listen(8080, '0.0.0.0', () => {
  console.log('Health check server listening on port 8080');
});

// Validate token
if (!process.env.TOKEN) {
  console.error("❌ No Discord token found in environment variables!");
  process.exit(1);
}

// Login with error handling
client.login(process.env.TOKEN).catch((err) => {
  console.error("Login error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (pingInterval) clearInterval(pingInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (connectionMonitorInterval) clearInterval(connectionMonitorInterval);
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  if (socket) socket.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (pingInterval) clearInterval(pingInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (connectionMonitorInterval) clearInterval(connectionMonitorInterval);
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  if (socket) socket.close();
  client.destroy();
  process.exit(0);
});