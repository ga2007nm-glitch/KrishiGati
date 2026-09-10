const { MongoClient } = require("mongodb");

const databaseUrl = new URL(process.env.DATABASE_URL || "mongodb://127.0.0.1:27018/krishigati");
const directUrl = `mongodb://${databaseUrl.host}/?directConnection=true`;
const client = new MongoClient(directUrl);

async function main() {
  try {
    await client.connect();
    const admin = client.db("admin");
    const result = await admin.command({
      replSetInitiate: {
        _id: "rs0",
        members: [{ _id: 0, host: databaseUrl.host }],
      },
    });
    console.log("MongoDB replica set initialized:", result);
  } catch (error) {
    if (error.message.includes("already initialized") || error.codeName === "AlreadyInitialized") {
      console.log("MongoDB replica set is already initialized.");
      return;
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => client.close());
