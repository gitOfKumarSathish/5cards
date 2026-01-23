
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AddUsers from './pages/AddUsers';
import GameDashboard from './pages/GameDashboard';

function App() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup/:gameId" element={<AddUsers />} />
        <Route path="/play/:gameId" element={<GameDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
