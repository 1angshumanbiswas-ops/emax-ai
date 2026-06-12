// E-Max AI — Netlify Serverless Function
// Anthropic API proxy — your key stays here, never in the browser
// Deploy: this file lives at netlify/functions/analyse.js

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const data = JSON.parse(event.body);
    const {
      testerID, carMake, carModel, carYear, engineType,
      kml, dropPercent, costPerKm, litresFilled,
      fullTank, season, city, fillCount, baselineStatus,
      baselineKml
    } = data;

    // Only call AI if baseline is locked (fill 4+) or if it's a partial fill warning
    const isCalibrating = baselineStatus === "CALIBRATING";

    let prompt = "";

    if (isCalibrating) {
      prompt = `You are E-Max AI, an expert on India's E20 ethanol-blended petrol and its effect on vehicle mileage.
A beta tester (${testerID}) is still in baseline calibration (fill ${fillCount} of 3).
Car: ${carYear} ${carMake} ${carModel} (${engineType}).
This fill: ${kml.toFixed(1)} km/l, ${litresFilled}L filled, ${fullTank ? "full tank" : "partial fill"}, ${city}, ${season}.

Respond ONLY with a JSON object, no markdown, no preamble:
{
  "alertLevel": "INFO",
  "verdict": "one sentence — acknowledge calibration, mention what you see so far",
  "anomalyFlag": "NONE",
  "coachingTip": "one practical E20 tip relevant to their city and season"
}`;
    } else {
      prompt = `You are E-Max AI, an expert on India's E20 ethanol-blended petrol and its effect on vehicle mileage.
Analyse this fill-up and give a precise, data-driven verdict.

Tester: ${testerID} | Car: ${carYear} ${carMake} ${carModel} (${engineType})
City: ${city} | Season: ${season} | Fill #${fillCount}
Recent personal baseline (current fuel conditions, Tank-to-Tank Method): ${baselineKml.toFixed(1)} km/l
This fill: ${kml.toFixed(1)} km/l | Drop vs baseline: ${dropPercent.toFixed(1)}%
Cost per KM: ₹${costPerKm.toFixed(2)} | Litres: ${litresFilled}L | Full tank: ${fullTank ? "Yes" : "No (partial)"}

Rules:
- Drop 0–10%: within normal fuel efficiency variation
- Drop 10–18%: possible anomaly worth a further check (driving pattern, tyre pressure, maintenance)
- Drop >18%: possible fuel-quality-related anomaly requiring further check (especially monsoon) — frame as "worth checking", never as a confirmed diagnosis
- Negative drop (mileage ABOVE baseline): flag as data anomaly worth reviewing

IMPORTANT: Never state a definitive diagnosis (e.g. do not say "you have water in your tank"). Always phrase findings as "possible anomaly" or "worth checking" and direct the user to a mechanic/authorised service centre for confirmation.

Respond ONLY with a JSON object, no markdown, no preamble:
{
  "alertLevel": "NORMAL|WATCH|WARNING|CRITICAL",
  "verdict": "2 sentences max — plain English, framed as observation + suggestion to check, specific to their numbers and city",
  "anomalyFlag": "NONE|POSSIBLE_FUEL_QUALITY_ANOMALY|BEHAVIOUR|POSSIBLE_MECHANICAL_CHECK|DATA_ANOMALY|PARTIAL_FILL",
  "coachingTip": "1 specific actionable tip for their car, city, season"
}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const aiData = await response.json();
    const rawText = aiData.content[0].text.trim();

    // Safe JSON parse — strip any accidental markdown fences
    const clean = rawText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, ai: result }) };

  } catch (err) {
    console.error("E-Max AI function error:", err);
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        ai: {
          alertLevel: "INFO",
          verdict: "AI analysis temporarily unavailable. Your fill-up data has been saved.",
          anomalyFlag: "NONE",
          coachingTip: "Maintain steady throttle on highways to maximise E20 efficiency."
        }
      })
    };
  }
};
