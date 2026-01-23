import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
    game_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true
    },
    round_number: {
        type: Number,
        required: true,
    },
    pending_points: {
        type: Number,
        required: true,
        default: 0
    },
    userPoints: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        pointsEarned: {
            type: Number,
            required: true,
            default: 0,
        },
        currentPoints: {
            type: Number,
            required: true,
            default: 0
        },
        pendingPoints: {
            type: Number,
            required: true,
            default: 0
        }
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
            delete ret.__v;
            return ret;
        }
    }
});

const Round = mongoose.model("Round", roundSchema);

export default Round;