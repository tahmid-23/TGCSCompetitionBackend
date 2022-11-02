import mysql from "mysql2";

export const connection = mysql.createConnection({
    host: process.env.HOST,
    user: 'tgcs',
    password: process.env.PASSWORD,
    database: 'tgcs_competition'
})
