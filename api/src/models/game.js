import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    total_points: {
        type: Number,
        required: true,
        default: 2,
    },
    total_players: {
        type: Number,
        required: true,
        default: 2,
    },
    users: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        points: { type: Number, default: 0 },
        pending_points: { type: Number, default: 0 }
    }],
    winner: {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        wonAt: Date
    },
    rounds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Round'
    }],
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    toJSON: {
        transform: (doc, ret) => {
            ret.game_id = ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

const Game = mongoose.model("Game", gameSchema);

export default Game;