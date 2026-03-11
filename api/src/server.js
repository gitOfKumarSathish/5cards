// import dotenv from 'dotenv';

// dotenv.config();

// import app from './app.js';
// import connectDB from './config/db.js';

// const PORT = process.env.PORT || 4000;
// (async () => {
//     console.log({ PORT });
//     try {
//         await connectDB();
//         app.listen(PORT, (res, req, next) => {
//             console.log(`🚀 Server running on http://localhost:${PORT}`);
//         });

//     } catch (error) {
//         console.error("❌ Failed to start server:", error.message);
//         process.exit(1);
//     }
// })();

// export default app;

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

// Connect to DB immediately
connectDB();

// IF YOU ARE RUNNING LOCALLY, start the listen server.
// If Vercel is importing this file, we just want to export `app`.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// THIS IS REQUIRED FOR VERCEL
export default app;
