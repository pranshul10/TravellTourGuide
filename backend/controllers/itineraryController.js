require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Itinerary generation will not work.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

exports.generateItinerary = async (req, res) => {
  const { destination, duration, interests } = req.body;

  if (!destination || !duration) {
    return res.status(400).json({ message: 'Destination and duration are required' });
  }

  if (!genAI) {
    return res.status(500).json({ message: 'Itinerary service is not configured (API key missing).' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an expert travel planner. Create a travel itinerary for a trip to ${destination} for ${duration}.
Consider these interests: ${interests || 'general sightseeing'}.
Your response MUST be ONLY a valid JSON array. Do not include any explanatory text, markdown formatting like \`\`\`json, or any other characters outside of the JSON array itself.
Each object in the array should represent a day and have the following keys:
- "day": (Number) The day number (e.g., 1, 2, 3).
- "title": (String, optional) A brief title or theme for the day (e.g., "Historical Exploration", "Eiffel Tower & Seine River").
- "activities": (Array of Strings) A list of activities for the day.
- "notes": (String, optional) Any relevant notes for the day (e.g., "Book tickets in advance", "Wear comfortable shoes").

Example of the exact output format expected for a single day object:
{"day": 1, "title": "Arrival and Local Exploration", "activities": ["Arrive at ${destination}", "Check into hotel", "Evening walk around the neighborhood", "Dinner at a local restaurant"], "notes": "Confirm hotel check-in time."}

Provide the full itinerary as a JSON array of these day objects.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let itineraryData;
    try {
        // Try to find the JSON block. It often starts with '{' or '[' and ends with '}' or ']'.
        // This also handles cases where Gemini might wrap JSON in ```json ... ```
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/);
        let cleanedText = "";

        if (jsonMatch) {
            // Prefer content within ```json ... ``` (jsonMatch[1])
            // Otherwise, take the direct array/object match (jsonMatch[2])
            cleanedText = (jsonMatch[1] || jsonMatch[2] || "").trim();
        } else {
            // If no explicit markers, assume the whole text might be JSON (less reliable)
            // This part is risky if Gemini includes any non-JSON preamble/postamble.
            // For now, if no clear JSON block is found, we'll error out rather than trying to parse ambiguous text.
             console.error("No clear JSON block (array or object) found in Gemini response. Text was:", text);
             return res.status(500).json({ message: 'AI response did not contain a clearly identifiable JSON block.', rawResponse: text });
        }
        
        if (cleanedText) {
            itineraryData = JSON.parse(cleanedText);
        } else {
            console.error("No JSON content extracted from Gemini response after cleaning.");
            console.error("Raw Gemini response:", text);
            return res.status(500).json({ message: 'AI response did not yield extractable JSON content.', rawResponse: text });
        }

    } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        console.error("Raw Gemini response was:", text);
        return res.status(500).json({ message: 'Error processing itinerary from AI. The response was not valid JSON. Raw response provided for debugging.', rawResponse: text });
    }

    res.json({ itinerary: itineraryData });

  } catch (err) {
    console.error('Gemini API error:', err);
    // Check for specific Gemini API error types if available in err object
    if (err.message && err.message.includes("API key not valid")) {
        return res.status(401).json({ message: 'Gemini API key is not valid. Please check your configuration.' });
    }
    res.status(500).json({ message: 'Server error while generating itinerary. This could be due to API issues or internal errors.' });
  }
};