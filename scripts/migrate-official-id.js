const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb://127.0.0.1:27018/?replicaSet=rs0");

client.connect()
  .then(async () => {
    const result = await client.db("krishigati").collection("User").updateMany(
      { officialId: null },
      { $unset: { officialId: "" } }
    );
    console.log(`Removed legacy null officialId fields: ${result.modifiedCount}`);
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => client.close());
