import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface AnalysisResult {
  summary: string[];
  why: string;
  tradeoffs: string;
  uncertainty: string;
}

export default function App() {
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ ingredients: string; timestamp: Date; result: AnalysisResult }>>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("labelsense_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch (e) {
        console.warn("Failed to load history:", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (ing: string, res: AnalysisResult) => {
    const newEntry = { ingredients: ing, timestamp: new Date(), result: res };
    const updated = [newEntry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("labelsense_history", JSON.stringify(updated));
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Copied to clipboard!");
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      saveToHistory(ingredients, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze ingredients";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: typeof history[0]) => {
    setIngredients(entry.ingredients);
    setResult(entry.result);
    setError(null);
  };


  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {notification}
        </div>
      )}

      <div className="max-w-2xl w-full mb-8">
        <h1 className="text-3xl font-semibold mb-2">LabelSense-AI</h1>
        <p className="text-neutral-400">
          AI-native understanding of food ingredients
        </p>
      </div>

      {/* Input */}
      <div className="max-w-2xl w-full mb-6">
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Paste ingredient list here..."
          className="w-full h-32 p-4 rounded-lg bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-neutral-600 resize-none"
          aria-label="Ingredient list input"
        />
      </div>

      {/* Action */}
      <div className="max-w-2xl w-full mb-8">
        <button
          onClick={handleAnalyze}
          disabled={!ingredients || loading}
          className="w-full py-3 rounded-lg bg-neutral-100 text-neutral-900 font-medium disabled:opacity-40 hover:bg-neutral-200 transition"
          aria-label={loading ? "Analyzing ingredients" : "Analyze ingredients"}
        >
          {loading ? "🔄 Understanding what matters…" : "Analyze Ingredients"}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-2xl w-full bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-300">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-neutral-800 rounded animate-pulse w-1/2"></div>
            <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-800 rounded animate-pulse w-2/3"></div>
            <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Insight Card */}
      {result && (
        <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Quick Summary</h2>
              <button
                onClick={() => copyToClipboard(result.summary.join("\n"))}
                className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                📋 Copy
              </button>
            </div>
            <ul className="list-disc list-inside text-neutral-300 space-y-1">
              {result.summary.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Why It Matters</h2>
              <button
                onClick={() => copyToClipboard(result.why)}
                className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-neutral-300">{result.why}</p>
          </section>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Trade-offs</h2>
              <button
                onClick={() => copyToClipboard(result.tradeoffs)}
                className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-neutral-300">{result.tradeoffs}</p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">Uncertainty</h2>
            <p className="text-neutral-400">{result.uncertainty}</p>
          </section>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="max-w-2xl w-full mt-8">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Recent Analyses</h3>
          <div className="space-y-2">
            {history.map((entry, idx) => (
              <button
                key={idx}
                onClick={() => loadFromHistory(entry)}
                className="w-full text-left p-3 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition text-sm"
              >
                <p className="text-neutral-300 truncate">{entry.ingredients.substring(0, 50)}...</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
