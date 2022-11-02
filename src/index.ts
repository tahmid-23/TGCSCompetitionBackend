import express from "express";
import dotenv from "dotenv";

import { connection } from "./queries";

dotenv.config();
const app = express();

const port = process.env.PORT || 3000;

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
})

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
})