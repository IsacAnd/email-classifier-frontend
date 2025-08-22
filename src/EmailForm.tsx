import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

export type Resultado = {
  categoria: "produtivo" | "improdutivo";
  resposta_sugerida: string;
};

export default function EmailForm() {
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (
      selectedFile &&
      (selectedFile.type === "application/pdf" ||
        selectedFile.type === "text/plain")
    ) {
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const isFormValid = (): boolean => {
    if (inputType === "file" && !file) return false;
    if (inputType === "text" && !text.trim()) return false;
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setError("");
    setResultado(null);

    const API_URL = "https://email-classifier-backend-4ccb.onrender.com";

    try {
      let response: Response;

      if (inputType === "text") {
        const formData = new FormData();
        formData.append("content", text);

        response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });
      } else if (inputType === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });
      } else {
        throw new Error("Dados inválidos");
      }

      if (!response.ok)
        throw new Error(`Erro do servidor: ${response.statusText}`);

      const data: Resultado = await response.json();
      setResultado(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao se comunicar com o backend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="tipo">Formato do conteúdo:</label>
        <select
          id="tipo"
          value={inputType}
          onChange={(e) => {
            const value = e.target.value as "text" | "file";
            setInputType(value);
            setFile(null);
            setText("");
            setResultado(null);
          }}
        >
          <option value="text">Texto digitado</option>
          <option value="file">Arquivo (PDF ou TXT)</option>
        </select>

        {inputType === "text" && (
          <>
            <label htmlFor="texto">Digite o texto:</label>
            <textarea
              id="texto"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </>
        )}

        {inputType === "file" && (
          <>
            <label htmlFor="arquivo">Selecione um arquivo:</label>
            <input
              type="file"
              id="arquivo"
              accept=".pdf,.txt"
              onChange={handleFileChange}
            />
          </>
        )}

        <button type="submit" disabled={!isFormValid() || loading}>
          {loading ? "Enviando..." : "Verificar"}
        </button>

        {error && setTimeout(() => setError(""), 5000) && (
          <p style={{ color: "red" }}>{error}</p>
        )}
      </form>

      <div className="resultado">
        {resultado ? (
          <>
            <h3>Resultado da análise</h3>
            <p>
              <strong>Classificação:</strong> {resultado.categoria}
            </p>
            <p>
              <strong>Sugestão de resposta:</strong>{" "}
              {resultado.resposta_sugerida}
            </p>
          </>
        ) : (
          <p>Nenhum email foi enviado ainda.</p>
        )}
      </div>
    </>
  );
}
