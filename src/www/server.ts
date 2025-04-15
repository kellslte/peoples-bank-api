import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { createServer } from "http";
import appRouter from "@/routes/index.router";
import errorHandler from "@/middleware/error.middleware";

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(cors());

app.use("/api/v1/", appRouter);
app.use(errorHandler);

export { server, app };
