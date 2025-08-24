import EmailForm from "./EmailForm";
import "./App.css";

function App() {
  return (
    <>
      <header>
        <h1>Classificador de emails</h1>
      </header>

      <main className="main">
        <div className="container">
          <EmailForm />
        </div>
      </main>
    </>
  );
}

export default App;
