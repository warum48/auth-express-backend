import { DataSource } from "typeorm";
import { User } from "../entities/User";
import path from "path";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "../../database.sqlite"),
    entities: [User],
    synchronize: true,
    logging: false
});
