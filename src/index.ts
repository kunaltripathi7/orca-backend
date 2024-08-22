import express, { Express, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { PORT } from "./secrets";
import rootRouter from "./routes";
import { errorMiddleware } from "./middlewares/errors";

const app: Express = express();
app.use(express.json());
app.use(cors());

app.use("/api", rootRouter);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server Started: ${PORT}`);
});
