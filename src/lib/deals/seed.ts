import { addDays, formatISO, subDays } from "date-fns";

import type { Deal, DealStatus } from "@/types/deal";
import { computeDaysRemaining, computePromotionEndDate } from "@/lib/deals/helpers";

function iso(dt: Date) {
  return formatISO(dt);
}

function buildDeal(partial: Omit<Deal, "createdAt" | "updatedAt"> & Partial<Pick<Deal, "createdAt" | "updatedAt">>): Deal {
  const now = new Date();
  return {
    createdAt: partial.createdAt ?? iso(subDays(now, 10)),
    updatedAt: partial.updatedAt ?? iso(now),
    ...partial,
  };
}

export function createSeedDeals(): Deal[] {
  const now = new Date();

  const make = (
    i: number,
    data: Omit<Deal, "id" | "createdAt" | "updatedAt" | "promotionEndDate" | "daysRemaining">
  ) => {
    const baseIso = data.postDate ? data.postDate : iso(subDays(now, 1));
    const promotionEndDate = computePromotionEndDate(baseIso, data.promotionDays);
    const daysRemaining = data.status === "ENDED" ? 0 : computeDaysRemaining(promotionEndDate);

    return buildDeal({
      id: `DEAL-${String(i).padStart(4, "0")}`,
      ...data,
      promotionEndDate,
      daysRemaining,
    });
  };

  const future1 = addDays(now, 2);
  future1.setHours(14, 0, 0, 0);
  const future2 = addDays(now, 5);
  future2.setHours(9, 0, 0, 0);
  const past1 = subDays(now, 3);
  past1.setHours(11, 0, 0, 0);
  const past2 = subDays(now, 12);
  past2.setHours(18, 30, 0, 0);

  const deals: Deal[] = [
    make(1, {
      title: "Weekend in Paris Luxe",
      url: "https://weekendjeweg.example/deals/paris-luxe",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBzC58WBlpR8Zt-QpE3wRu7_a5VpJNr5sRtmltL80sqyy6dorG8-cWmf4jGauD-sEA8BmrnqdpG4mopT46eabu7nJG_4LAc-jquXuVqKlcpa422dyw_7slliIYCi9RDKfeF4kYP4w0xVt82lQg_Q8OvcVz_Bi-WXVUYhwNU3hjPXzeT993i_2AySU19xnHF-uEymNiX_7LKy95TEPjWeQtHhCfJheAVnBMDJSVw3r9A8XO9j3HzDmixBGlSDC3n9M_sixdQuj_CY4I",
      category: ["Stedentrip", "Wellness"],
      postText:
        "🇫🇷 Weekendje Parijs? Boutique hotel vlakbij de Seine incl. ontbijt + boottocht. Boek snel!",
      generate: "Yes",
      publish: false,
      postDate: iso(future1),
      promotionDays: 7,
      status: "SCHEDULED",
    }),
    make(2, {
      title: "Veluwe Wellness Retreat",
      url: "https://weekendjeweg.example/deals/veluwe-wellness",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAZleTAlIw4e6CoBTpqx8rUii782QjHSfn8TWIPc35b7DakNpZHN66ZrdqvptQ40hBS0cjmmmOtN73PwsgOILK6UMomQNkD_i6Uo27CDc2hPa4gD1nZVn9jGUjhNCP20vVVuSk8OkCsBOtYNpvXat_BrHuW_jHCyI3g5nNcyMpqsHV54Y1885tY2QjYkjaLfco7aJR_9T7w5tAzpgWp7sinwFeYcQ4dQCYsf2aTe0rth5P4LUqDM0BeqnkrsRyoFoAEmb5j2_JULqA",
      category: ["Wellness"],
      postText:
        "💆 Ontspan in de Veluwe: sauna toegang + 3-gangen diner. Perfect voor een mini-break.",
      generate: "No",
      publish: false,
      promotionDays: 14,
      status: "DRAFT",
    }),
    make(3, {
      title: "Last Minute: Mallorca Sun",
      url: "https://weekendjeweg.example/deals/mallorca-lastminute",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCwXcXPX3cp5M5fqmlI69jaCUn11jwmtLFmKj7SgpRT-32Gup8KrRNtG7zpzaYMoakYR7bu5-cUnbH_O3ZkeeXz3R5YG0KqhZvZSZsLov55y4liGaSHqArVH603aeKT4dsMDj99ytsz-VwQW_xfJAeeDxxY5ltB0iXEBWmYOnj58QYPRC6ketSLnxyGIk9ZsYBjje9J0JcoTUUekQajYDQa4KrNor0BPXMzr0_l-UN5SkqkJThEq0ky1vswbeAdrpOP780XEIgVaYs",
      category: ["Last Minute", "Vakantie"],
      postText:
        "🏖️ Last minute Mallorca: 8 dagen all-inclusive 4* resort incl. vlucht vanaf AMS!",
      generate: "Yes",
      publish: true,
      postDate: iso(past1),
      promotionDays: 7,
      status: "PUBLISHED",
    }),
    make(4, {
      title: "Amsterdam Canal Suites",
      url: "https://weekendjeweg.example/deals/amsterdam-canal-suites",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCMmOn4dmUvcIoLC3mJV1eZLC30PVuyvcpjSE2CG9qUh74a38OJcu7fdcGbQe1pqzLgA7V0UQBsW3yELfcFwDEVVI__qhshlvMypkFEorYSEGhKSSYHyRtrwGrtWiti4IOKaA6cSB26f952V4czRX6V4_W9q7cQKYuN9TVciLxd5bZMwDJ06yawhOifevaHGGRknq0GkQbS_5aY6WgzCGuD_HhD8dHR_kcSnntjfds8AWpYVfvUu-1PDhvDLC3pVJVAD9hoRAcX6Uc",
      category: ["Stedentrip"],
      postText: "🚫 Deze actie is helaas verlopen.",
      generate: "No",
      publish: false,
      postDate: iso(past2),
      promotionDays: 5,
      status: "ENDED",
    }),
    make(5, {
      title: "Forest Family Cabin",
      url: "https://weekendjeweg.example/deals/forest-cabin",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCzEcaT7NkMlsSW-gxT74J5m2fUVkbY8pkBSurCUVbh_aHhLLASpZwIcX-uq2mYCSE5_RIyFvS9Ufs_OhRA91ux0EKTZGsuXFWtpLQmuUz8a3z5rJsv0Gv6jHoftu7039UhZ6TbrLGkd6QRID87HfL7UeObihPTcggy4ceoU4smM8yXWeBsBSn_moLAp6bLDzQ7L5TDjDT4hZWtedM5713vmNkUyf_Ec2YQ3OIOi-TACdjacUS6MZemRYj_NJWITjkXcqTSBKwzpVA",
      category: ["Vakantiepark", "Gezin"],
      postText:
        "🌲 Luxe gezins-cabin (6p) met vuurplaats + toegang tot subtropisch zwembad.",
      generate: "Yes",
      publish: false,
      postDate: iso(future2),
      promotionDays: 21,
      status: "SCHEDULED",
    }),
  ];

  const templates: Array<
    Pick<
      Deal,
      "title" | "url" | "imageUrl" | "category" | "promotionDays"
    > & { status: DealStatus; postDate?: Date; publish: boolean }
  > = [
    {
      title: "Utrecht Castle Stay",
      url: "https://weekendjeweg.example/deals/utrecht-castle",
      imageUrl:
        "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1400&q=80",
      category: ["Stedentrip"],
      promotionDays: 7,
      status: "SCHEDULED",
      postDate: addDays(now, 1),
      publish: false,
    },
    {
      title: "Spa Retreat Limburg",
      url: "https://weekendjeweg.example/deals/limburg-spa",
      imageUrl:
        "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&w=1400&q=80",
      category: ["Wellness"],
      promotionDays: 14,
      status: "SCHEDULED",
      postDate: addDays(now, 1),
      publish: false,
    },
    {
      title: "Efteling Weekend Deal",
      url: "https://weekendjeweg.example/deals/efteling",
      imageUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
      category: ["Theme Parks", "Gezin"],
      promotionDays: 5,
      status: "DRAFT",
      publish: false,
    },
    {
      title: "Coastal Hotel 50% Off",
      url: "https://weekendjeweg.example/deals/coastal-hotel",
      imageUrl:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80",
      category: ["Coastal", "Last Minute"],
      promotionDays: 7,
      status: "ENDED",
      postDate: subDays(now, 20),
      publish: false,
    },
    {
      title: "Brussels Food Tour",
      url: "https://weekendjeweg.example/deals/brussels-food",
      imageUrl:
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=80",
      category: ["Stedentrip"],
      promotionDays: 7,
      status: "SCHEDULED",
      postDate: addDays(now, 8),
      publish: false,
    },
    {
      title: "Winter Special: Alpen Chalet",
      url: "https://weekendjeweg.example/deals/alpen-chalet",
      imageUrl:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80",
      category: ["Vakantiepark", "Winter"],
      promotionDays: 30,
      status: "PUBLISHED",
      postDate: subDays(now, 1),
      publish: true,
    },
    {
      title: "Groningen City Trip",
      url: "https://weekendjeweg.example/deals/groningen-city",
      imageUrl:
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80",
      category: ["Stedentrip"],
      promotionDays: 7,
      status: "SCHEDULED",
      postDate: addDays(now, 10),
      publish: false,
    },
    {
      title: "Family Fun Weekend",
      url: "https://weekendjeweg.example/deals/family-fun",
      imageUrl:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80",
      category: ["Gezin", "Vakantiepark"],
      promotionDays: 14,
      status: "DRAFT",
      publish: false,
    },
    {
      title: "Luxury Hotel Suite",
      url: "https://weekendjeweg.example/deals/luxury-suite",
      imageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
      category: ["Wellness", "Stedentrip"],
      promotionDays: 7,
      status: "SCHEDULED",
      postDate: addDays(now, 12),
      publish: false,
    },
    {
      title: "Zandvoort Beach Break",
      url: "https://weekendjeweg.example/deals/zandvoort",
      imageUrl:
        "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
      category: ["Coastal"],
      promotionDays: 7,
      status: "PUBLISHED",
      postDate: subDays(now, 6),
      publish: true,
    },
    {
      title: "Last Minute: Ardennen Cabin",
      url: "https://weekendjeweg.example/deals/ardennen-cabin",
      imageUrl:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
      category: ["Last Minute", "Vakantiepark"],
      promotionDays: 5,
      status: "SCHEDULED",
      postDate: addDays(now, 3),
      publish: false,
    },
    {
      title: "Wellness Day + Hotel Overnachting",
      url: "https://weekendjeweg.example/deals/wellness-day",
      imageUrl:
        "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&w=1400&q=80",
      category: ["Wellness"],
      promotionDays: 21,
      status: "DRAFT",
      publish: false,
    },
    {
      title: "Theme Park: Toverland",
      url: "https://weekendjeweg.example/deals/toverland",
      imageUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
      category: ["Theme Parks"],
      promotionDays: 7,
      status: "SCHEDULED",
      postDate: addDays(now, 15),
      publish: false,
    },
    {
      title: "City Break: Antwerpen",
      url: "https://weekendjeweg.example/deals/antwerpen",
      imageUrl:
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80",
      category: ["Stedentrip"],
      promotionDays: 7,
      status: "PUBLISHED",
      postDate: subDays(now, 2),
      publish: true,
    },
    {
      title: "Vakantiepark aan het Water",
      url: "https://weekendjeweg.example/deals/water-park",
      imageUrl:
        "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
      category: ["Vakantiepark", "Coastal"],
      promotionDays: 30,
      status: "SCHEDULED",
      postDate: addDays(now, 20),
      publish: false,
    },
  ];

  const startIndex = deals.length + 1;
  templates.forEach((t, idx) => {
    const d = t.postDate
      ? (() => {
          const dt = new Date(t.postDate);
          dt.setHours(14, 30, 0, 0);
          return iso(dt);
        })()
      : undefined;

    deals.push(
      make(startIndex + idx, {
        title: t.title,
        url: t.url,
        imageUrl: t.imageUrl,
        category: t.category,
        postText: `✨ ${t.title} — bekijk de deal en plan je volgende uitje.`,
        generate: idx % 3 === 0 ? "No" : "Yes",
        publish: t.publish,
        postDate: d,
        promotionDays: t.promotionDays,
        status: t.status,
      })
    );
  });

  // Zorg dat er minimaal 20 deals zijn
  while (deals.length < 20) {
    const i = deals.length + 1;
    deals.push(
      make(i, {
        title: `Extra Deal ${i}`,
        url: `https://weekendjeweg.example/deals/extra-${i}`,
        imageUrl:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
        category: ["Stedentrip"],
        postText: "Nieuw: ontdek deze extra deal.",
        generate: "Yes",
        publish: false,
        promotionDays: 7,
        status: "DRAFT",
      })
    );
  }

  return deals;
}

