import { z } from "zod";

const createGameSchema = z.object({
    total_players: z.number().min(2).max(10),
    total_points: z.number().min(1).max(500),
});

const userSchema = z.object({
    username: z.string().min(3).max(20),
});




export {
    createGameSchema,
    userSchema
};