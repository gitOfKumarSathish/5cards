# 5cards - Premium Score Tracker

A full-stack web application to track scores for the "5 Cards" game (and others). Features a premium glassmorphism UI, real-time leaderboards, and automated winner detection.

## 🚀 Features

*   **Configurable Game**: Set your own "Game Over" point limit (e.g., 100, 500) and player count.
*   **Premium UI**: Dark mode, glassmorphism design, and smooth animations.
*   **Live Dashboard**:
    *   **Leaderboard**: Automatically ranks players. Strips out eliminated players (Greyed out & Strikethrough).
    *   **Round History**: Visual timeline of every round. 
    *   **Winner Highlighting**: Players who score `0` get a **Crown** 👑 for that round.
*   **Automated Rules**:
    *   **Elimination**: Prevents adding points to players who crossed the limit.
    *   **Winner Declaration**: Automatically detects the "Last Man Standing" or "Lowest Score" in sudden death.
    *   **Super Banner**: Celebrates the winner with a massive full-screen overlay.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Axios, React Router, Vanilla CSS (Variables).
*   **Backend**: Node.js, Express, MongoDB (Mongoose).
*   **Tools**: Nodemon, Dotenv.

## 📦 Prerequisites

*   [Node.js](https://nodejs.org/) (v16+)
*   [MongoDB](https://www.mongodb.com/) (Running locally or Compass)

## 🏁 How to Run

You need to run the **Backend** and **Frontend** in separate terminals.

### 1. Setup Backend (API)
The backend handles the database and game logic.

```bash
cd api
# Install dependencies
npm install

# Setup Environment
# Ensure you have a .env file with:
# PORT=4000
# MONGODB_URI=mongodb://127.0.0.1:27017/5cards

# Run Server
npm run dev
# Server will start on http://localhost:4000
```

### 2. Setup Frontend (Web)
The frontend provides the user interface.

```bash
cd web
# Install dependencies
npm install

# Run Web App
npm run dev
# App will start on http://localhost:5173
```

## 🎮 Example Workflow

1.  **Start Game**: Open `http://localhost:5173`. Click **Start New Game**.
2.  **Configure**: Enter `Total Points` (e.g., 50) and number of players.
3.  **Add Players**: Add names (e.g., "Alice", "Bob", "Charlie").
4.  **Play Rounds**:
    *   Enter scores for Round 1 (e.g., Alice: 10, Bob: 0, Charlie: 20).
    *   Bob gets a 👑 for scoring 0.
5.  **Elimination**:
    *   If Alice reaches 50 points, she is crossed out and locked.
6.  **Win**:
    *   Once only **Bob** remains under 50 points, the **Winner Banner** appears!

## 📂 Project Structure & Editing Guide

Here is where to find code when you want to make changes:

### 🖥️ Frontend (`/web`)
*The User Interface (React + Vite)*

*   **`src/pages/Home.jsx`**
    *   📝 **Edit here to**: Change the "New Game" screen, default inputs, or the landing page text.
*   **`src/pages/AddUsers.jsx`**
    *   📝 **Edit here to**: Modify how players are added or change the limit enforcement messages.
*   **`src/pages/GameDashboard.jsx`** ⚡ *(Most Important)*
    *   📝 **Edit here to**: precise the Scoreboard, Round History cards, Winner Banner, or input forms.
    *   *Logic*: Contains the visual logic for "Elimination" (greying out) and "Winner" (Crown icon).
*   **`src/api/client.js`**
    *   ⚙️ **Config**: Change the Backend URL here (currently `http://localhost:4000`).
*   **`src/index.css`**
    *   🎨 **Styles**: Global CSS variables for colors (glassmorphism), fonts, and animations.

### ⚙️ Backend (`/api`)
*The Logic & Database (Express + MongoDB)*

*   **`src/services/game.service.js`** 🧠 *(The Brain)*
    *   📝 **Edit here to**: Change the Game Rules.
        *   Winner Detection Logic (Last Man Standing vs Sudden Death).
        *   Point Calculation math.
        *   Limit Validation.
*   **`src/models/game.js`**
    *   💾 **Database**: Defines what data is stored (e.g., `winner`, `total_points`).
*   **`src/routes/game.routes.js`**
    *   🔗 **API Endpoints**: Defines the URLs (e.g., `POST /create`, `GET /:gameId`).

---

## 🏛️ Architecture & Archive

### Data Persistence
*   **Database**: MongoDB.
*   **Archive**: All games are **permanently archived** in the database.
    *   Every round is stored in the `rounds` collection.
    *   Every game result is stored in the `games` collection.
    *   *Future Idea*: You can build a "History" page to view past matches by querying the `Game` collection.

### Application Flow
1.  **User Action** (Frontend) -> **API Request** (Axios)
2.  **API Route** -> **Controller** -> **Service** (Business Logic)
3.  **Service** -> **MongoDB** (Save Data)
4.  **Response** -> **Frontend Updates** (React State)

