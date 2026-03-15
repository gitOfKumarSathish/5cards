
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Gamepad2, Settings } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        totalPlayers: 2,
        totalPoints: 100
    });

    const createGame = async (e) => {
        // Prevent default form submission if wrapped in form later
        if (e) e.preventDefault();
        
        const players = parseInt(config.totalPlayers);
        const points = parseInt(config.totalPoints);

        if (isNaN(points) || points < 1 || points > 1000) {
            return alert("Total Points must be between 1 and 1000.");
        }
        if (isNaN(players) || players < 2 || players > 10) {
            return alert("Number of players must be between 2 and 10.");
        }

        setLoading(true);
        try {
            const res = await client.post('/create', {
                total_players: players,
                total_points: points
            });
            const gameId = res.data.game.game_id || res.data.game._id;
            navigate(`/setup/${gameId}`);
        } catch (error) {
            alert("Failed to create game: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh'
        }}>
            <div className="glass-card animate-float" style={{ padding: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                <Gamepad2 size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    5cards
                </h1>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    The premium scoring companion.
                </p>

                <form onSubmit={createGame} style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Total Points to Win/Lose</label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            required
                            value={config.totalPoints}
                            onChange={(e) => setConfig({ ...config, totalPoints: e.target.value })}
                        />
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            *The player who stays BELOW this target wins. The first to reach or exceed it loses.
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Number of Players</label>
                        <input
                            type="number"
                            min="2"
                            max="10"
                            required
                            value={config.totalPlayers}
                            onChange={(e) => setConfig({ ...config, totalPlayers: e.target.value })}
                        />
                    </div>
                </form>

                <button className="btn-primary" onClick={createGame} disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Creating...' : 'Start New Game'}
                </button>
            </div>
        </div>
    );
}
