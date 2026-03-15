
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { Trophy, History, Send } from 'lucide-react';

export default function GameDashboard() {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [roundInputs, setRoundInputs] = useState({});
    const [roundNumber, setRoundNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Fetch Game State
    const fetchGame = async () => {
        try {
            const res = await client.get(`/${gameId}`);
            setGame(res.data);

            // Auto-detect round number based on history
            if (res.data.rounds && res.data.rounds.length > 0) {
                // Latest round number + 1
                // Assuming rounds are sorted desc (as we did in backend)
                setRoundNumber(res.data.rounds[0].round_number + 1);
            }
        } catch (error) {
            console.error("Failed to load game", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGame();
        const interval = setInterval(fetchGame, 5000);
        return () => clearInterval(interval);
    }, [gameId]);

    const handlePointChange = (userId, value) => {
        setRoundInputs(prev => ({
            ...prev,
            [userId]: parseInt(value) || 0
        }));
    };

    const submitRound = async () => {
        setSubmitting(true);
        try {
            const userPoints = Object.entries(roundInputs).map(([userId, points]) => ({
                userId,
                pointsEarned: points
            }));

            // Basic validation
            if (userPoints.length === 0) return alert("Enter points for at least one player");

            await client.post(`/submit-rounds/${gameId}`, {
                gameId,
                roundNumber,
                userPoints
            });

            setRoundInputs({});
            // roundNumber will auto-update on next fetch or we can optimistic update
            // let's wait for fetch
            await fetchGame();
            alert("Round Submitted!");
        } catch (error) {
            alert("Failed to submit round: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Game...</div>;
    if (!game) return <div style={{ textAlign: 'center' }}>Game not found.</div>;

    // Helper to get name safely
    const getUserName = (user) => {
        // user.user_id is now an object because we populated it!
        return user.user_id?.name || "Unknown";
    };
    // Helper to get stats safely
    const getUserStats = (user) => {
        let winCount = 0;
        let wrongShowCount = 0;
        const userId = user.user_id._id || user.user_id;

        if (game && game.rounds) {
            game.rounds.forEach(round => {
                const userRoundData = round.userPoints.find(up => (up.user_id._id || up.user_id) === userId);
                if (userRoundData) {
                    if (userRoundData.pointsEarned === 0) winCount++;
                    if (userRoundData.pointsEarned === 50) wrongShowCount++;
                }
            });
        }

        return { winCount, wrongShowCount };
    };

    const sortedUsers = [...(game.users || [])].sort((a, b) => a.points - b.points);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>

            {/* Super Winner Banner */}
            {game.winner && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}>
                    <div className="animate-float">
                        <Trophy size={120} color="#fbbf24" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.5))' }} />
                    </div>
                    <h1 style={{
                        fontSize: '5rem',
                        margin: '2rem 0',
                        background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #fbbf24)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        fontWeight: '900',
                        letterSpacing: '5px'
                    }}>
                        {game.winner.name} Wins!
                    </h1>
                    <div style={{ fontSize: '1.5rem', color: '#94a3b8', maxWidth: '600px' }}>
                        Extra Extra Super Information: The last survivor of the 5cards match!
                    </div>
                    <button
                        className="btn-primary"
                        style={{ marginTop: '3rem', fontSize: '1.2rem', padding: '1rem 3rem' }}
                        onClick={() => window.location.href = '/'}
                    >
                        Play Again
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Game Board</h2>
                <div className="glass-card" style={{ padding: '0.5rem 1rem' }}>
                    Round {roundNumber}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Standings */}
                <div>
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <Trophy color="#fbbf24" size={24} style={{ marginRight: '0.5rem' }} />
                            <h3>Standings</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sortedUsers.map((user, index) => (
                                <div key={user._id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: index === 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '0.5rem',
                                    border: index === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : 'none',
                                    opacity: user.points >= game.total_points ? 0.5 : 1
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 'bold', width: '24px' }}>#{index + 1}</span>
                                        <span style={{ textDecoration: user.points >= game.total_points ? 'line-through' : 'none' }}>
                                            {getUserName(user)}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{user.points} pts</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.pending_points} pending</div>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '4px', fontSize: '0.75rem' }}>
                                            <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px' }}>Win: {getUserStats(user).winCount}</span>
                                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>Wrong: {getUserStats(user).wrongShowCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input & History */}
                <div>
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <History color="var(--secondary)" size={24} style={{ marginRight: '0.5rem' }} />
                            <h3>Enter Round {roundNumber} Scores</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {game.users.map(user => {
                                const isEliminated = user.points >= game.total_points;
                                return (
                                    <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isEliminated ? 0.5 : 1 }}>
                                        <label style={{ flex: 1, textDecoration: isEliminated ? 'line-through' : 'none' }}>
                                            {getUserName(user)} {isEliminated && '(Out)'}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder={isEliminated ? "-" : "Points"}
                                            style={{ width: '100px' }}
                                            value={roundInputs[user.user_id._id || user.user_id] !== undefined ? roundInputs[user.user_id._id || user.user_id] : ''}
                                            onChange={(e) => handlePointChange(user.user_id._id || user.user_id, e.target.value)}
                                            disabled={isEliminated}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            onClick={submitRound}
                            disabled={submitting}
                        >
                            <Send size={18} />
                            {submitting ? 'Submitting...' : 'Submit Round'}
                        </button>
                    </div>

                    {/* History Section */}
                    {game.rounds && game.rounds.length > 0 && (
                        <div>
                            <h3 style={{ marginLeft: '0.5rem', marginBottom: '1rem', color: '#94a3b8' }}>Round History</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {game.rounds.map((round) => (
                                    <div key={round._id} className="glass-card" style={{ padding: '1rem', borderLeft: `4px solid var(--secondary)` }}>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                            Round {round.round_number}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                            {round.userPoints.map(up => {
                                                const gUser = game.users.find(gu => (gu.user_id._id || gu.user_id) === up.user_id);
                                                const uName = gUser ? getUserName(gUser) : 'Unknown';

                                                const isWinner = up.pointsEarned === 0;

                                                return (
                                                    <div key={up.user_id} style={{
                                                        background: isWinner ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                                        border: isWinner ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
                                                        padding: '0.5rem 0.8rem',
                                                        borderRadius: '0.5rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        minWidth: '60px',
                                                        position: 'relative'
                                                    }}>
                                                        {isWinner && (
                                                            <div style={{ position: 'absolute', top: '-10px', color: '#fbbf24', background: '#0f172a', borderRadius: '50%', padding: '2px' }}>
                                                                <Trophy size={14} fill="#fbbf24" />
                                                            </div>
                                                        )}
                                                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{uName}</span>
                                                        <span style={{ fontWeight: 'bold', color: up.pointsEarned > 0 ? '#ef4444' : '#22c55e' }}>
                                                            {up.pointsEarned > 0 ? `+${up.pointsEarned}` : up.pointsEarned}
                                                        </span>
                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                                            {up.pendingPoints} left
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
