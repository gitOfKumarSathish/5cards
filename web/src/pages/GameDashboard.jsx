
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
    const [undosLoading, setUndosLoading] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState(true);

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

    const submitRound = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            const userPoints = [];
            // Validate all inputs before creating payload
            for (const user of game.users) {
                const isEliminated = user.points >= game.total_points;
                if (isEliminated) continue;

                const userId = user.user_id._id || user.user_id;
                const points = roundInputs[userId];

                if (points === undefined || points === '') {
                    throw new Error(`Please enter points for ${getUserName(user)}`);
                }
                
                const parsedPoints = parseInt(points);
                if (isNaN(parsedPoints) || parsedPoints < 0 || parsedPoints > 999) {
                    throw new Error(`Points for ${getUserName(user)} must be between 0 and 999`);
                }

                userPoints.push({
                    userId,
                    pointsEarned: parsedPoints
                });
            }

            // Basic validation
            if (userPoints.length === 0) throw new Error("Enter points for at least one active player");

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

    const undoLastRound = async () => {
        if (!window.confirm("Undo the last round? Points will be reverted.")) return;
        setUndosLoading(true);
        try {
            await client.delete(`/round/${gameId}/last`);
            await fetchGame();
        } catch (error) {
            alert("Failed to undo round: " + (error.response?.data?.message || error.message));
        } finally {
            setUndosLoading(false);
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

            {/* Rules Modal */}
            {showRules && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(5px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button 
                            onClick={() => setShowRules(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>How to Play 5cards</h2>
                        <ul style={{ textAlign: 'left', lineHeight: '1.6', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <li>🎯 <b>Objective:</b> Stay BELOW the target points. The first player to reach or exceed them is eliminated.</li>
                            <li>🏆 <b>Winner:</b> The last survivor wins! If everyone is out, the person with the lowest score wins.</li>
                            <li>✨ <b>Win (0):</b> Getting exactly 0 points in a round is a "Win".</li>
                            <li>⚠️ <b>Wrong (50):</b> Making a "Wrong Show" costs exactly 50 points.</li>
                            <li>🔄 <b>Pending:</b> Your points left before crossing the target.</li>
                        </ul>
                        <button className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setShowRules(false)}>Got it!</button>
                    </div>
                </div>
            )}

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
                    textAlign: 'center',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <div className="animate-float" style={{ marginBottom: '1rem' }}>
                        <Trophy size={140} color="#fbbf24" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 50px rgba(251, 191, 36, 0.6))' }} />
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 10vw, 5rem)',
                        margin: '1rem 0',
                        background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #fbbf24)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        fontWeight: '900',
                        letterSpacing: '5px',
                        textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                    }}>
                        {game.winner.name} Wins!
                    </h1>
                    <div style={{ fontSize: '1.5rem', color: '#94a3b8', maxWidth: '600px', marginBottom: '3rem' }}>
                        The ultimate survivor! Game over.
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                            onClick={() => {
                                if (window.confirm("Start new game? Current game will be lost.")) {
                                    window.location.href = '/';
                                }
                            }}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Game Board</h2>
                    <button 
                        onClick={() => setShowRules(true)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '2rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', cursor: 'pointer' }}
                    >
                        How to Play?
                    </button>
                    <button 
                        onClick={() => { if(window.confirm("Exit game to home? All progress will be lost!")) window.location.href='/'; }}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                    >
                        Home
                    </button>
                </div>
                <div className="glass-card" style={{ padding: '0.5rem 1rem' }}>
                    Round {roundNumber}
                </div>
            </div>

            <div className="game-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                                        <span style={{ fontWeight: 'bold', width: '24px', flexShrink: 0 }}>#{index + 1}</span>
                                        <span 
                                            title={getUserName(user)}
                                            style={{ 
                                                textDecoration: user.points >= game.total_points ? 'line-through' : 'none',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {getUserName(user)}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{user.points} pts</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.pending_points} pending</div>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '4px', fontSize: '0.75rem' }}>
                                            <span title="Rounds with exactly 0 points" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', cursor: 'help' }}>Win: {getUserStats(user).winCount}</span>
                                            <span title="Rounds with exactly 50 points" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', cursor: 'help' }}>Wrong: {getUserStats(user).wrongShowCount}</span>
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

                        <form onSubmit={submitRound}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {game.users.map(user => {
                                    const isEliminated = user.points >= game.total_points;
                                    return (
                                        <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isEliminated ? 0.5 : 1 }}>
                                            <label 
                                                title={getUserName(user)}
                                                style={{ 
                                                    flex: 1, 
                                                    textDecoration: isEliminated ? 'line-through' : 'none',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {getUserName(user)} {isEliminated && '(Out)'}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="999"
                                                required={!isEliminated}
                                                placeholder={isEliminated ? "-" : "Points"}
                                                style={{ width: '100px', flexShrink: 0 }}
                                                value={roundInputs[user.user_id._id || user.user_id] !== undefined ? roundInputs[user.user_id._id || user.user_id] : ''}
                                                onChange={(e) => handlePointChange(user.user_id._id || user.user_id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === '.' || e.key === 'e') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                disabled={isEliminated}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                disabled={submitting}
                            >
                                <Send size={18} />
                                {submitting ? 'Submitting...' : 'Submit Round'}
                            </button>
                        </form>
                    </div>

                    {/* History Section */}
                    {game.rounds && game.rounds.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 
                                    style={{ margin: 0, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => setHistoryExpanded(!historyExpanded)}
                                >
                                    Round History {historyExpanded ? '▼' : '►'}
                                </h3>
                                <button 
                                    onClick={undoLastRound}
                                    disabled={undosLoading}
                                    style={{ 
                                        padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderRadius: '4px', 
                                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                                        border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' 
                                    }}
                                >
                                    {undosLoading ? 'Wait...' : 'Undo Last Round'}
                                </button>
                            </div>

                            {historyExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
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
                                                            <span 
                                                                title={uName}
                                                                style={{ 
                                                                    fontSize: '0.75rem', 
                                                                    color: '#cbd5e1',
                                                                    maxWidth: '80px',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                            >
                                                                {uName}
                                                            </span>
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
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
