import express from "express";
import dotenv from "dotenv";

import { createTGCSConnection } from "./queries";

dotenv.config();

const connection = createTGCSConnection(process.env.HOST, Number(process.env.DB_PORT) || 3306, process.env.PASSWORD);

const app = express();
const serverPort = process.env.SERVER_PORT || 3000;

app.get("/", async (req, res) => {
    const promise = new Promise(() => connection.ping((err) => {
        if (err) {
            res.send(err);
        } else {
            res.send("Success!");
        }
    }));
    await promise;

    res.send("Hello, World!");
});

app.listen(serverPort, () => {
    console.log(`server started at http://localhost:${serverPort}`);
});
