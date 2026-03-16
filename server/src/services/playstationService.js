const axios = require('axios');

const PS_GRAPHQL_URL = 'https://web.np.playstation.com/api/graphql/v1/';

// Known persisted query hashes for PS Plus game catalog
// These are reverse-engineered from the PlayStation website
const QUERIES = {
  psplus_catalog: 'ba9ff9b7e14a69065e2ee787f1b9f34b4f6cd9e6936a3ec73903fa1e26e1b24d',
};

async function fetchPSPlusCatalog(category, offset = 0, size = 100) {
  const variables = {
    pageArgs: { size, offset },
    filterContext: {
      rootCategoryId: category,
      sortBy: 'TITLE',
    },
  };

  const params = new URLSearchParams({
    operationName: 'getPSPlusGameCatalog',
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: QUERIES.psplus_catalog,
      },
    }),
  });

  const response = await axios.get(`${PS_GRAPHQL_URL}?${params}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'x-psn-app-ver': '1.0.0',
    },
    timeout: 10000,
  });

  return response.data;
}

async function fetchAllGames() {
  const categories = ['GAME_CATALOG', 'CLASSICS_CATALOG'];
  const games = [];

  for (const category of categories) {
    let offset = 0;
    const size = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const data = await fetchPSPlusCatalog(category, offset, size);
        const products = data?.data?.psplus?.catalog?.products || [];

        products.forEach((product) => {
          games.push({
            id: product.id || product.productId,
            title: product.name || product.localizedName?.defaultVal,
            category,
            platforms: product.platforms || [],
            thumbnailUrl: product.media?.find((m) => m.type === 'IMAGE')?.url,
            releaseDate: product.releaseDate,
            genres: product.genres || [],
          });
        });

        const totalCount = data?.data?.psplus?.catalog?.totalResultCount || 0;
        offset += size;
        hasMore = offset < totalCount;
      } catch (err) {
        console.warn(`Failed to fetch ${category} at offset ${offset}:`, err.message);
        hasMore = false;
      }
    }
  }

  return games;
}

module.exports = { fetchAllGames };
