import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import "dotenv/config";
import { PORT } from "./secrets";
import rootRouter from "./routes";
import { errorMiddleware } from "./middlewares/errors";
import { initializeSocket } from "./socket";

const app: Express = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(cors());

app.use("/api", rootRouter);
app.use(errorMiddleware);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server Started: ${PORT}`);
});

