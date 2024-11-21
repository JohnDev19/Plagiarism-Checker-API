### **API Documentation - Plagiarism Checker**

#### **API Endpoint**  
**URL:** `https://plagiarism-checker-to2x.onrender.com/plagiarism`  
**Method:** `GET`  
**Parameters:**
- `content` (string) - The text content to check for plagiarism.

#### **Response Structure**
The API returns a JSON response structured as follows:

```json
{
  "status": "success",
  "data": {
    "userProvidedContent": {
      "content": "Input text content",
      "textStats": {
        "wordCount": 119,
        "characterCount": 537,
        "sentenceCount": 2,
        "uniqueWordCount": 81,
        "averageWordLength": "4.51",
        "lexicalDensity": "68.07",
        "averageWordsPerSentence": "59.50"
      },
      "sentiment": {
        "score": -5,
        "comparative": -0.0413223140495868,
        "tokens": ["my", "sisters", ...],
        "positive": ["like"],
        "negative": ["hacked", "cheating", ...]
      }
    },
    "plagiarismResults": {
      "sources": [
        {
          "url": "https://www.quora.com/...",
          "title": "Title of source",
          "similarity": 13.98,
          "confidenceScore": 47.95,
          "isPlagiarized": false,
          "snippet": "Short text snippet",
          "metadata": {
            "description": "N/A",
            "keywords": "N/A",
            "author": "Unknown",
            "publishedDate": "N/A",
            "lastModified": "N/A",
            "language": "en"
          }
        }
      ],
      "summary": {
        "maxSimilarity": "13.98",
        "maxConfidence": "47.95",
        "averageSimilarity": "2.96",
        "averageConfidence": "17.34",
        "overallPlagiarized": false,
        "plagiarizedSources": 0,
        "totalSourcesAnalyzed": 5,
        "highConfidenceSources": 0,
        "mostLikelySource": "URL of most likely source",
        "mostLikelySourceConfidence": 47.95
      }
    },
    "timestamp": "2024-11-21T09:23:39.542Z"
  }
}
```

---

### **Python Implementation**

```python
import requests

def check_plagiarism(content):
    url = "https://plagiarism-checker-to2x.onrender.com/plagiarism"
    params = {"content": content}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Example Usage
content = "My Sisters husband was cheating on her..."
result = check_plagiarism(content)
if result:
    print(result)
```

---

### **Node.js Implementation**

```javascript
const axios = require('axios');

async function checkPlagiarism(content) {
    const url = "https://plagiarism-checker-to2x.onrender.com/plagiarism";
    
    try {
        const response = await axios.get(url, {
            params: { content }
        });
        console.log(response.data);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Example Usage
const content = "My Sisters husband was cheating on her...";
checkPlagiarism(content);
```

---

### **JavaScript (Browser) Implementation**

```javascript
async function checkPlagiarism(content) {
    const url = "https://plagiarism-checker-to2x.onrender.com/plagiarism";
    const params = new URLSearchParams({ content });

    try {
        const response = await fetch(`${url}?${params}`, {
            method: "GET"
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Example Usage
const content = "My Sisters husband was cheating on her...";
checkPlagiarism(content);
```

---

### **Notes**
1. Validate the `content` parameter before sending the request to prevent issues with URL encoding or unsupported characters.
2. Handle errors especially network-related issues / invalid responses.
3. Customize the logic based on your application's requirements, such as handling plagiarism or sentiment data.
