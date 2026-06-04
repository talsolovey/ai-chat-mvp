import express from "express";
import cors from "cors";
import { loggingMiddleware } from "./middleware/loggingMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { apiRouter } from "./routes/api.routes";

const app = express();
const PORT = 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(loggingMiddleware);

app.use("/api", apiRouter);

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
