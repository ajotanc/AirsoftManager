import { Context } from "@netlify/edge-functions";
import { Client, TablesDB } from "https://esm.sh/appwrite";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  const eventMatch = url.pathname.match(/\/events\/([a-zA-Z0-9]+)/);
  if (!eventMatch) return;

  const rowId = eventMatch[1];

  const ENDPOINT = Netlify.env.get("VITE_APPWRITE_ENDPOINT");
  const PROJECT_ID = Netlify.env.get("VITE_APPWRITE_PROJECT_ID");
  const DATABASE_ID = Netlify.env.get("VITE_APPWRITE_DATABASE_ID");
  const TEAM_NAME = Netlify.env.get("VITE_TEAM_NAME");
  const TABLE_ID = "events";

  try {
    const client = new Client();
    client.setEndpoint(ENDPOINT!).setProject(PROJECT_ID!);

    const tables = new TablesDB(client);

    const event = await tables.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId
    });

    const originalResponse = await context.next();
    const html = await originalResponse.text();

    const description = `${event.location} - ${new Date(event.date).toLocaleDateString('pt-BR')} às ${event.startTime}h`;

    const customHtml = html
      .replace(/<title>.*?<\/title>/, `<title>${TEAM_NAME.toUpperCase()} - ${event.title.toUpperCase()}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${event.description}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${event.title}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/g, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/g, `<meta property="og:image" content="${event.thumbnail}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/g, `<meta property="og:url" content="${request.url}" />`);

    return new Response(customHtml, {
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return;
  }
};

export const config = { path: "/events/*" };