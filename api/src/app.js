import express from 'express';
import cors from 'cors';
import { ZodError } from "zod";
import morgan from "morgan";
import gameRoutes from './routes/game.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use("/game", gameRoutes);

app.get("/health", (req, res) => {
    res.json({ ok: true, message: `"5 cards API running and request received at ${new Date()}` });
});

// Global error handler
app.use((err, req, res, next) => {
    if (err instanceof ZodError) {
        const list = err.issues || err.errors || [];
        return res.status(400).json({
            message: "Validation error",
            errors: list.map((e) => ({
                field: (e.path || []).join("."),
                message: e.message,
            })),
        });
    }

    console.error("❌ Error:", err);

    const status = err.statusCode || 500;
    return res.status(status).json({
        message: err.message || "Internal Server Error",
    });
});

export default app;

