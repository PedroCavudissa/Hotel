import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import amenityRoutes from "./routes/amenity.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Swagger
const swaggerDocument = YAML.load(
  path.join(process.cwd(), "src/docs/swagger.yaml")
);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/rooms", roomRoutes);
app.use("/amenities", amenityRoutes);
app.use("/uploads", express.static("src/uploads"));
app.use("/reservations", reservationRoutes);
export default app;