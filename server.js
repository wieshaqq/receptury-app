const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");

dotenv.config();

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("."));

/* =========================
   ENDPOINT: SKAN ZDJĘCIA
========================= */
app.post("/api/skan", async (req, res) => {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64 || !mediaType) {
        return res.status(400).json({ error: "Brak zdjęcia" });
    }

    try {
        const apiKey = process.env.ANTHROPIC_API_KEY.trim();

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type":      "application/json",
                "x-api-key":         apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model:      "claude-haiku-4-5-20251001",
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type:   "image",
                                source: {
                                    type:       "base64",
                                    media_type: mediaType,
                                    data:       imageBase64
                                }
                            },
                            {
                                type: "text",
                                text: `Przeanalizuj to zdjęcie receptury kosmetycznej.
Wyciągnij nazwę receptury i wszystkie składniki z ich ilościami (w procentach lub gramach).
Odpowiedz TYLKO w formacie JSON, bez żadnego tekstu przed ani po:
{
  "nazwa": "nazwa receptury",
  "skladniki": [
    { "nazwa": "nazwa składnika", "ilosc": liczba },
    ...
  ]
}
Jeśli ilości są w gramach a nie procentach — przelicz je tak żeby sumowały się do 100.
Jeśli nie możesz odczytać receptury — zwróć { "blad": "opis problemu" }.`
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || "Błąd API" });
        }

        const text  = data.content[0].text;
        const clean = text.replace(/```json|```/g, "").trim();

        try {
            const parsed = JSON.parse(clean);
            res.json(parsed);
        } catch {
            res.status(500).json({ error: "Nie udało się sparsować odpowiedzi AI", raw: text });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera: " + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Serwer działa na http://localhost:${PORT}`);
    console.log(`📋 Przeroboofka: http://localhost:${PORT}/index.html`);
});