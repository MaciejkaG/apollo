import axios from 'axios';
import * as cheerio from 'cheerio';

const searchCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000;

class SearchPlugin {
    constructor() {
        this.search = this.search.bind(this);
        this.execute = this.execute.bind(this);
        this.clearCache = this.clearCache.bind(this);
    }

    async search(query, num = 5) {
        try {
            const cacheKey = `${query}:${num}`;
            
            if (searchCache.has(cacheKey)) {
                const { data, timestamp } = searchCache.get(cacheKey);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data;
                }
                searchCache.delete(cacheKey);
            }

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            };

            const response = await axios.get('https://www.google.com/search', {
                headers,
                params: {
                    q: query,
                    num: num + 2, 
                    hl: 'en'
                }
            });

            const $ = cheerio.load(response.data);
            const results = [];

            $('.g').each((i, element) => {
                if (results.length >= num) return false;

                const titleElement = $(element).find('h3').first();
                const urlElement = $(element).find('a').first();
                const snippetElement = $(element).find('.VwiC3b').first();

                if (!titleElement.length || !urlElement.length) return;

                const url = new URL(urlElement.attr('href'), 'https://www.google.com');
                const actualUrl = url.searchParams.get('q') || url.href;

                if (!actualUrl.startsWith('http')) return;

                const result = {
                    title: titleElement.text().trim(),
                    url: actualUrl,
                    snippet: snippetElement.text().trim() || null
                };


                if (result.title && result.url) {
                    results.push(result);
                }
            });

            if (results.length > 0) {
                searchCache.set(cacheKey, {
                    data: results,
                    timestamp: Date.now()
                });
            }

            return results;
        } catch (error) {
            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            if (error.response?.status === 403) {
                throw new Error('Access denied. Search request was blocked.');
            }
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    async execute({ query, num = 5 }) {
        try {
            if (!query?.trim()) {
                throw new Error('Search query is required');
            }

            console.log(`Searching for: ${query}`);
            console.log(`Number of results: ${num}`);

            num = Math.min(Math.max(parseInt(num) || 5, 1), 10);

            return await this.search(query, num);
        } catch (error) {
            throw new Error(`Plugin execution failed: ${error.message}`);
        }
    }

    clearCache() {
        searchCache.clear();
        return { message: 'Search cache cleared' };
    }
}

export default new SearchPlugin();