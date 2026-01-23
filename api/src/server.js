import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 4000;
(async () => {
    console.log({ PORT });
    try {
        await connectDB();
        app.listen(PORT, (res, req, next) => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
})();

export default app;