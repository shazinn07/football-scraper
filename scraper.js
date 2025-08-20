import fs from 'fs';
import puppeteer from 'puppeteer';

const DATA_FILE = './data/matches.json';

// Read cached matches
function readCache() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Save cache
function saveCache(matches) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(matches, null, 2));
}

// Merge old and new matches (avoid duplicates & update scores/status)
function mergeMatches(oldMatches, newMatches) {
  const map = new Map();
  oldMatches.forEach(m => map.set(m.id, m));

  newMatches.forEach(m => {
    if (map.has(m.id)) {
      // Update scores/status for existing match
      map.get(m.id).homeScore = m.homeScore;
      map.get(m.id).awayScore = m.awayScore;
      map.get(m.id).status = m.status;
    } else {
      map.set(m.id, m);
    }
  });

  return Array.from(map.values());
}

// Fetch matches for a given date using Puppeteer
async function fetchMatchesForDate(date) {
  const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const data = await page.evaluate(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch API');
      return res.json();
    }, url);

    await browser.close();
    return data.events || [];
  } catch (err) {
    if (browser) await browser.close();
    console.log(`Error fetching ${date}:`, err.message);
    return [];
  }
}

// Main function
async function main() {
  const oldMatches = readCache();

  const today = new Date();
  const matchesToFetch = [];
  // CHANGE 3 for testing, later use 30 for full cron job
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    matchesToFetch.push(dateStr);
  }

  let allNewMatches = [];
  for (const date of matchesToFetch) {
    console.log(`Fetching matches for ${date}...`);
    const matches = await fetchMatchesForDate(date);
    allNewMatches = allNewMatches.concat(matches);
  }

  const merged = mergeMatches(oldMatches, allNewMatches);
  saveCache(merged);

  console.log(`Cached ${merged.length} matches at ${new Date().toISOString()}`);
}

main();
