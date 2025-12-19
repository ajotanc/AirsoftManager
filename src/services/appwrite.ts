import { Client, Account, TablesDB, Storage } from "appwrite";

export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export const TABLE_OPERATORS = "operators";
export const TABLE_ARSENALS = "arsenals";
export const TABLE_LOADOUTS = "loadouts";
export const TABLE_SKILL_RATINGS = "skill_ratings";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

export const account = new Account(client);
export const tables = new TablesDB(client);
export const storage = new Storage(client);

export default client;
