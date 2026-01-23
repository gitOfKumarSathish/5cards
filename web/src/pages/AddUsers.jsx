
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Users, Plus, X } from 'lucide-react';

export default function AddUsers() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [names, setNames] = useState([]);
    const [currentName, setCurrentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [game, setGame] = useState(null);

    // Fetch game to get total_players limit
    useEffect(() => {
        client.get(`/${gameId}`)
            .then(res => setGame(res.data))
            .catch(err => alert("Failed to load game details: " + err.message));
    }, [gameId]);

    const addName = (e) => {
        e.preventDefault();
        if (!game) return;
        if (names.length >= game.total_players) {
            return alert(`Max ${game.total_players} players allowed!`);
        }
        if (currentName.trim()) {
            setNames([...names, currentName.trim()]);
            setCurrentName('');
        }
    };

    const removeName = (index) => {
        setNames(names.filter((_, i) => i !== index));
    };

    const startGame = async () => {
        if (!game) return;
        if (names.length !== game.total_players) return alert(`Please add exactly ${game.total_players} players.`);

        setLoading(true);
        try {
            await client.post(`/add-users/${gameId}`, {
                usernames: names
            });
            navigate(`/play/${gameId}`);
        } catch (error) {
            alert("Failed to add users: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!game) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Game Config...</div>;

    const isFull = names.length >= game.total_players;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <Users color="var(--primary)" size={32} style={{ marginRight: '1rem' }} />
                    <h2 style={{ margin: 0 }}>Add Players</h2>
                </div>

                <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>
                    Adding {names.length} of {game.total_players} players
                </p>

                <form onSubmit={addName} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                        placeholder={isFull ? "Player limit reached" : "Enter player name..."}
                        autoFocus
                        disabled={isFull}
                    />
                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center' }} disabled={isFull}>
                        <Plus size={20} />
                    </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                    {names.map((name, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>{name}</span>
                            <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeName(i)} />
                        </div>
                    ))}
                    {names.length === 0 && <span style={{ color: '#64748b' }}>No players added yet.</span>}
                </div>

                <button
                    className="btn-primary"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    onClick={startGame}
                    disabled={loading || names.length !== game.total_players}
                >
                    {loading ? 'Setting up...' : `Start Game (${names.length}/${game.total_players})`}
                </button>
            </div>
        </div>
    );
}
