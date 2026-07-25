import { Context } from "@netlify/edge-functions";
// @ts-ignore
import { Client, Databases, Query } from "https://esm.sh/appwrite";

export default async (request: Request, _context: Context) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const ENDPOINT = Netlify.env.get("VITE_APPWRITE_ENDPOINT");
  const PROJECT_ID = Netlify.env.get("VITE_APPWRITE_PROJECT_ID");
  const DATABASE_ID = Netlify.env.get("VITE_APPWRITE_DATABASE_ID");

  const staticRoutes = [
    "",
    "login",
    "register",
    "visitor-registration",
  ];

  let eventUrls: string[] = [];
  let tournamentUrls: string[] = [];

  try {
    if (ENDPOINT && PROJECT_ID && DATABASE_ID) {
      const client = new Client();
      client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
      const databases = new Databases(client);

      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // List public events from current month onwards
      try {
        const eventsRes = await databases.listDocuments(DATABASE_ID, "events", [
          Query.greaterThanEqual("date", startOfCurrentMonth),
          Query.limit(100),
          Query.orderDesc("date")
        ]);
        eventUrls = (eventsRes.documents || []).map((doc: any) => `${baseUrl}/events/${doc.$id}`);
      } catch (err) {
        console.error("Sitemap: error fetching events", err);
      }

      // List public tournaments from current month onwards
      try {
        const tournamentsRes = await databases.listDocuments(DATABASE_ID, "tournaments", [
          Query.greaterThanEqual("date", startOfCurrentMonth),
          Query.limit(100),
          Query.orderDesc("date")
        ]);
        tournamentUrls = (tournamentsRes.documents || []).map((doc: any) => `${baseUrl}/tournament/${doc.$id}`);
      } catch (err) {
        console.error("Sitemap: error fetching tournaments", err);
      }
    }
  } catch (err) {
    console.error("Sitemap generation error:", err);
  }

  const currentDate = new Date().toISOString().split("T")[0];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}/${route ? route : ""}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
${eventUrls
  .map(
    (eventUrl) => `  <url>
    <loc>${eventUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
${tournamentUrls
  .map(
    (tUrl) => `  <url>
    <loc>${tUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xmlContent, {
    headers: {
      "content-type": "application/xml; charset=UTF-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
};

export const config = { path: "/sitemap.xml" };
