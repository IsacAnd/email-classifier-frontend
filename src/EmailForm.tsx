import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./index.css";

type CategoriaLower = "produtivo" | "improdutivo";

export type Resultado = {
  categoria: CategoriaLower;
  resposta_sugerida: string;
};

const API_URL =
  "https://email-classifier-backend-4ccb.onrender.com/classificar-email";

export default function EmailForm() {
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Limpa mensagem de erro automaticamente após 5s (sem side-effect no render)
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (
      selectedFile &&
      (selectedFile.type === "application/pdf" ||
        selectedFile.type === "text/plain")
    ) {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError("Formato inválido. Selecione um PDF ou TXT.");
    }
  };

  const isFormValid = useMemo(() => {
    if (inputType === "file") return !!file;
    return !!text.trim();
  }, [inputType, file, text]);

  const normalizeCategoria = (raw: unknown): CategoriaLower => {
    const lower = String(raw || "").toLowerCase();
    return lower === "produtivo" ? "produtivo" : "improdutivo";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");
    setResultado(null);

    try {
      const formData = new FormData();
      if (inputType === "text") {
        formData.append("content", text);
      } else if (inputType === "file" && file) {
        formData.append("file", file);
      } else {
        throw new Error("Dados inválidos");
      }

      const response = await fetch(API_URL, { method: "POST", body: formData });

      if (!response.ok) {
        const msg = `Erro do servidor: ${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      if (response.status === 429) {
        throw new Error(
          "O servidor está processando muitas requisições. Tente novamente mais tarde."
        );
      }

      // Pode vir com campos extras do backend; normalizamos só o que usamos
      const data = await response.json();

      const normalized: Resultado = {
        categoria: normalizeCategoria(data?.categoria),
        resposta_sugerida: String(data?.resposta_sugerida || ""),
      };

      setResultado(normalized);
    } catch (err: unknown) {
      setResultado(null);
      if (err instanceof Error) setError(err.message);
      else setError("Erro ao se comunicar com o backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form" noValidate>
        <label htmlFor="tipo">Formato do conteúdo:</label>
        <select
          id="tipo"
          value={inputType}
          onChange={(e) => {
            const value = e.target.value as "text" | "file";
            setInputType(value);
            setFile(null);
            setText("");
            // mantém o último resultado visível até novo envio? você decide:
            setResultado(null);
            setError("");
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
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole ou digite o conteúdo do e-mail aqui…"
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

        <button
          type="submit"
          disabled={!isFormValid || loading}
          aria-busy={loading}
        >
          {loading && (
            <span className="spinner-circle" aria-hidden="true"></span>
          )}
          {loading ? "Enviando..." : "Verificar"}
        </button>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="resultado" aria-live="polite">
        {loading ? (
          <p className="loading-text">⏳ Analisando email, aguarde...</p>
        ) : resultado ? (
          <>
            <h3>Resultado da análise</h3>
            <p>
              <strong>Classificação:</strong>{" "}
              <span
                className={`badge ${
                  resultado.categoria === "produtivo"
                    ? "badge-green"
                    : "badge-red"
                }`}
              >
                {resultado.categoria}
              </span>
            </p>
            <p>
              <strong>Sugestão de resposta:</strong>
            </p>
            <div className="resposta">{resultado.resposta_sugerida}</div>
          </>
        ) : (
          <p>Nenhum email foi enviado ainda.</p>
        )}
      </div>
    </div>
  );
}
