
import Game from '../models/game.js';
import User from '../models/user.js';
import { createGameSchema, } from './../validators/game.validator.js';
import { StatusCodes } from 'http-status-codes';
import Round from './../models/rounds.js';

const createGameService = async (req, res, next) => {
    try {
        const { total_players, total_points } = createGameSchema.parse(req.body);
        console.log("Game value", { total_players, total_points });
        const game = await Game.create({ total_players, total_points });
        return res.status(StatusCodes.CREATED).json({
            message: "Game created successfully",
            game
        });
    } catch (error) {
        next(error);
    }
};

const initializeUsersInGame = async (req, res, next) => {
    try {
        const { usernames } = req.body;
        const { gameId } = req.params;
        console.log("Users List", usernames);

        // Fetch game to get total_points
        const game = await Game.findById(gameId);
        if (!game) throw new Error("Game not found");

        if (usernames.length !== game.total_players) {
            throw new Error(`Expected ${game.total_players} players, but received ${usernames.length}`);
        }

        const users = await Promise.all(
            usernames.map(async (name) => {
                const user = new User({ name });
                await user.save();
                return {
                    user_id: user._id,
                    points: 0,
                    pending_points: game.total_points // Use total_points from DB
                };
            })
        );

        // Add users to the game
        await Game.findByIdAndUpdate(gameId, {
            $push: { users: { $each: users } }
        });

        return res.status(StatusCodes.OK).json({
            message: "User Created successfully",
            users
        });
    } catch (error) {
        next(error);
    }
};

const addPointsToGameService = async (req, res, next) => {
    console.log({ body: req.body });
    try {
        const { userPoints, roundNumber } = req.body;
        const { gameId } = req.params;
        console.log({ userPoints });

        // 0. Fetch current game state to calculate snapshots
        const game = await Game.findById(gameId);
        if (!game) throw new Error("Game not found");

        // 1. Calculate and Prepare Round Data
        const roundData = userPoints.map(p => {
            const currentUserState = game.users.find(u => u.user_id.toString() === p.userId);
            if (!currentUserState) throw new Error(`User ${p.userId} not found in game`);

            // Calculate new state for snapshot
            const newCurrentPoints = (currentUserState.points || 0) + p.pointsEarned;
            const newPendingPoints = (currentUserState.pending_points || game.total_points) - p.pointsEarned;

            return {
                user_id: p.userId,
                pointsEarned: p.pointsEarned,
                currentPoints: newCurrentPoints,
                pendingPoints: newPendingPoints
            };
        });

        // 2. Save Round history
        const round = new Round({
            game_id: gameId,
            round_number: roundNumber,
            userPoints: roundData,
            pending_points: game.total_points // Snapshot total points or logic as defined
        });
        await round.save();

        // 3. Update Game points for each user
        await Promise.all(userPoints.map(async ({ userId, pointsEarned }) => {
            await Game.updateOne(
                { _id: gameId, "users.user_id": userId },
                {
                    $inc: {
                        "users.$.points": pointsEarned,
                        "users.$.pending_points": -pointsEarned // Decrement pending points
                    }
                }
            );
        }));

        // 4. Check for Winner (Last Man Standing)
        // Re-fetch game to get updated points
        const updatedGame = await Game.findById(gameId).populate('users.user_id');
        const activePlayers = updatedGame.users.filter(u => u.points < updatedGame.total_points);

        if (activePlayers.length === 1 && updatedGame.users.length > 1) {
            // We have a winner!
            const winner = activePlayers[0];
            updatedGame.winner = {
                user_id: winner.user_id._id,
                name: winner.user_id.name,
                wonAt: new Date()
            };
            await updatedGame.save();
        }

        res.status(201).json({ message: "Round submitted successfully", round });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getGameService = async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const game = await Game.findById(gameId).populate('users.user_id');
        if (!game) return res.status(404).json({ message: "Game not found" });

        // Fetch round history
        const rounds = await Round.find({ game_id: gameId }).sort({ round_number: -1 });

        // Self-healing: Check for winner if not set
        if (!game.winner) {
            const activePlayers = game.users.filter(u => u.points < game.total_points);
            console.log("Winner Check - Total:", game.total_points, "Active:", activePlayers.length, "Users:", game.users.length);

            let winner = null;
            if (activePlayers.length === 1 && game.users.length > 1) {
                winner = activePlayers[0];
            } else if (activePlayers.length === 0 && game.users.length > 1) {
                // All eliminated - winner is lowest score
                winner = game.users.reduce((prev, curr) => prev.points < curr.points ? prev : curr);
            }

            if (winner) {
                console.log("Winner DETECTED:", winner.user_id);
                game.winner = {
                    user_id: winner.user_id._id,
                    name: winner.user_id.name,
                    wonAt: new Date()
                };
                await game.save();
            }
        }

        // Return game + rounds
        // Convert mongoose doc to object to append rounds if needed, or just send a composite object
        const gameObj = game.toObject();
        gameObj.rounds = rounds;

        return res.status(StatusCodes.OK).json(gameObj);
    } catch (error) {
        next(error);
    }
};

export {
    createGameService,
    initializeUsersInGame,
    addPointsToGameService,
    getGameService
};