
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './src/models/game.js';
import User from './src/models/user.js'; // Ensure User model is loaded so reference works if needed
import Round from './src/models/rounds.js'; // Ensure Round model is loaded
import http from 'http';

dotenv.config();

const makeRequest = (path, method, body) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let buffer = '';
            res.on('data', chunk => buffer += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(buffer);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject({ statusCode: res.statusCode, error: json });
                    }
                } catch (e) {
                    reject({ statusCode: res.statusCode, raw: buffer });
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

(async () => {
    try {
        console.log("1. Creating Game...");
        const gameRes = await makeRequest('/game/create', 'POST', { total_players: 2, total_points: 100 });
        console.log("Create Response:", JSON.stringify(gameRes, null, 2));
        const gameId = gameRes.game.game_id || gameRes.game._id;
        console.log("Game Created:", gameId);

        console.log("2. Adding Users...");
        const userRes = await makeRequest(`/game/add-users/${gameId}`, 'POST', {
            usernames: ["Alice", "Bob"],
            gameId,
            total_points: 100
        });
        console.log("Users Added:", userRes.users.length);
        const [alice, bob] = userRes.users;

        console.log("3. Submitting Round...");
        const roundRes = await makeRequest(`/game/submit-rounds/${gameId}`, 'POST', {
            gameId,
            roundNumber: 1,
            userPoints: [
                { userId: alice.userId || alice.user_id, pointsEarned: 10 },
                { userId: bob.userId || bob.user_id, pointsEarned: 20 }
            ]
        });
        console.log("Round Submitted:", roundRes.message);

        console.log("4. Verifying DB State...");
        await mongoose.connect(process.env.MONGO_URI);
        const game = await Game.findById(gameId);

        const aliceData = game.users.find(u => u.user_id.toString() === (alice.userId || alice.user_id));
        const bobData = game.users.find(u => u.user_id.toString() === (bob.userId || bob.user_id));

        if (aliceData.points === 10 && bobData.points === 20) {
            console.log("SUCCESS: Points updated correctly!");
        } else {
            console.error("FAILED: Points mismatch.");
        }

        console.log("5. Checking Round History...");
        const roundDoc = await mongoose.model('Round').findOne({ game_id: gameId });
        console.log("Round Doc:", JSON.stringify(roundDoc, null, 2));

        const aliceRound = roundDoc.userPoints.find(u => u.user_id.toString() === (alice.userId || alice.user_id));

        // Alice: Started 0pts/100pending. Earned 10. Snapshot should be 10pts/90pending.
        if (aliceRound.currentPoints === 10 && aliceRound.pendingPoints === 90) {
            console.log("SUCCESS: Round history snapshot correct!");
        } else {
            console.error(`FAILED: Round history snapshot incorrect. Expected 10/90. Got ${aliceRound.currentPoints}/${aliceRound.pendingPoints}`);
        }

        mongoose.connection.close();

    } catch (err) {
        console.error("TEST FAILED:", err);
        if (mongoose.connection.readyState !== 0) mongoose.connection.close();
    }
})();
