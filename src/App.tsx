import CanvasBoard from './components/CanvasBoard';

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Vibe Drawing</h1>
        <p>Create colorful sketches, shapes, and exports.</p>
      </header>
      <CanvasBoard />
      <footer className="app-footer">
        <small>Built with React + Canvas.</small>
      </footer>
    </main>
  );
}

export default App;
