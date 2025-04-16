import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import appRouter from "@/routes/index.router";
import errorHandler from "@/middleware/error.middleware";

const app: express.Express = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression({ level: 6 }));
app.use(helmet());
app.use(cookieParser());

app.use("/api/v1/", appRouter);
app.use(errorHandler);

export { server, app };
