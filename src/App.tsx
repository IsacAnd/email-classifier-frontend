import EmailForm from "./EmailForm"
import "./App.css"

function App() {
  return (
    <>
      <header>
        <h2>Classificador de emails</h2>
      </header>

      <main className="main">
        <div className="container">
          <EmailForm />
        </div>
      </main>
    </>
  )
}

export default App
