const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stopwords = require('stopwords').english;
const cors = require('cors');
const Sentiment = require('sentiment');

const app = express();
const PORT = process.env.PORT || 3000;

const sentiment = new Sentiment();
const analyzeSentiment = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        comparative: 0,
        tokens: [],
        positive: [],
        negative: []
      };
    }

    const analysis = sentiment.analyze(text);
    return {
      score: analysis.score,
      comparative: analysis.comparative,
      tokens: analysis.tokens,
      positive: analysis.positive,
      negative: analysis.negative
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      score: 0,
      comparative: 0,
      tokens: [],
      positive: [],
      negative: []
    };
  }
};

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  next();
});

const axiosInstance = axios.create({
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  timeout: 5000
});

const processText = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid input text:', text);
      return [];
    }

    const sanitizedText = text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/gi, ' ');

    return tokenizer.tokenize(sanitizedText.toLowerCase())
    .filter(word => word && !stopwords.includes(word) && word.length > 1);
  } catch (error) {
    console.error('Error processing text:', error);
    return [];
  }
};

const analyzeText = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        uniqueWordCount: 0,
        averageWordLength: '0.00',
        lexicalDensity: '0.00',
        averageWordsPerSentence: '0.00'
      };
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const characters = text.replace(/\s/g, '');
    const uniqueWords = new Set(words);

    const wordCount = words.length || 1;
    const sentenceCount = sentences.length || 1;

    return {
      wordCount,
      characterCount: characters.length,
      sentenceCount,
      uniqueWordCount: uniqueWords.size,
      averageWordLength: (characters.length / wordCount).toFixed(2),
      lexicalDensity: ((uniqueWords.size / wordCount) * 100).toFixed(2),
      averageWordsPerSentence: (wordCount / sentenceCount).toFixed(2)
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    return {
      wordCount: 0,
      characterCount: 0,
      sentenceCount: 0,
      uniqueWordCount: 0,
      averageWordLength: '0.00',
      lexicalDensity: '0.00',
      averageWordsPerSentence: '0.00'
    };
  }
};

const cosineSimilarity = (vec1, vec2) => {
  try {
    if (!vec1 || !vec2 || typeof vec1 !== 'object' || typeof vec2 !== 'object') {
      return 0;
    }

    const dotProduct = Object.keys(vec1).reduce((sum, key) =>
      sum + (vec1[key] || 0) * (vec2[key] || 0), 0);
    const mag1 = Math.sqrt(Object.values(vec1).reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(Object.values(vec2).reduce((sum, val) => sum + val * val, 0));
    return mag1 && mag2 ? dotProduct / (mag1 * mag2): 0;
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
};

const calculateConfidenceScore = (similarity, textAnalysis, metadata, originalContent, fetchedContent) => {
  try {
    let score = similarity * 0.5;

    if (originalContent.trim() === fetchedContent.trim()) {
      return 100;
    }

    if (similarity > 0.8) {
      score += 20;
    }

    if (textAnalysis && typeof textAnalysis === 'object') {
      score += Math.min((textAnalysis.wordCount / 1000) * 0.1, 0.15);

      if (textAnalysis.lexicalDensity) {
        score += (parseFloat(textAnalysis.lexicalDensity) / 100) * 0.1;
      }

      if (textAnalysis.averageWordsPerSentence) {
        const sentenceScore = Math.min(Math.abs(20 - textAnalysis.averageWordsPerSentence) / 20, 1) * 0.1;
        score += sentenceScore;
      }
    }

    if (metadata && typeof metadata === 'object') {
      const metadataScore = Object.values(metadata).filter(Boolean).length / Object.keys(metadata).length * 0.15;
      score += metadataScore;
    }

    return Math.min(Math.round(score * 100 * 100) / 100, 100);
  } catch (error) {
    console.error('Error calculating confidence score:', error);
    return 0;
  }
};

const fetchContent = async (url) => {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    return {
      url: url,
      title: $('title').text().trim() || 'Untitled',
      content: $('body').text().trim() || 'N/A',
      metadata: {
        description: $('meta[name="description"]').attr('content') || 'N/A',
        keywords: $('meta[name="keywords"]').attr('content') || 'N/A',
        author: $('meta[name="author"]').attr('content') || 'Unknown',
        publishedDate: $('meta[property="article:published_time"]').attr('content') || 'N/A',
        lastModified: $('meta[property="article:modified_time"]').attr('content') || 'N/A',
        language: $('html').attr('lang') || 'en'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return null;
  }
};

const searchAndFetchContent = async (query) => {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query');
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const response = await axiosInstance.get(searchUrl);
    const $ = cheerio.load(response.data);

    const searchResults = [];
    $('div.g').each((_, element) => {
      const $element = $(element);
      const link = $element.find('a').first().attr('href');
      const title = $element.find('h3').text() || 'Untitled';
      const snippet = $element.find('.VwiC3b').text() || 'N/A';

      if (link && link.startsWith('http')) {
        searchResults.push({
          url: link,
          title: title,
          snippet: snippet
        });
      }
    });

    const contentPromises = searchResults.slice(0,
      5).map(result =>
      fetchContent(result.url).then(content => ({
        ...result,
        ...content
      }))
    );

    const results = await Promise.all(contentPromises);
    return results.filter(Boolean);
  } catch (error) {
    console.error('Error in search and fetch:',
      error);
    return [];
  }
};

app.get('/plagiarism', async (req, res) => {
  try {
    const content = req.query.content;

    if (!content) {
      return res.status(400).json({
        status: 'error',
        message: 'Content parameter is required'
      });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Content must be a string'
      });
    }

    if (content.length < 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Content must be at least 10 characters long'
      });
    }

    const processedText = processText(content);
    const textAnalysis = analyzeText(content);
    const sentimentAnalysis = analyzeSentiment(content);

    if (processedText.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid content to analyze after processing'
      });
    }

    const tfidf = new TfIdf();
    tfidf.addDocument(processedText);

    const textVector = {};
    processedText.forEach(term => {
      textVector[term] = tfidf.tfidf(term, 0);
    });

    const searchResults = await searchAndFetchContent(content.slice(0, 100));

    if (searchResults.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No comparison sources found'
      });
    }

    const plagiarismResults = await Promise.all(searchResults.map(async (fetchedContent) => {
      const processedContent = processText(fetchedContent.content);
      const contentTfidf = new TfIdf();
      contentTfidf.addDocument(processedContent);

      const contentVector = {};
      processedContent.forEach(term => {
        contentVector[term] = contentTfidf.tfidf(term, 0);
      });

      const similarity = cosineSimilarity(textVector, contentVector);
      const contentAnalysis = analyzeText(fetchedContent.content);
      const confidenceScore = calculateConfidenceScore(similarity, contentAnalysis, fetchedContent.metadata, content, fetchedContent.content);

      return {
        url: fetchedContent.url,
        title: fetchedContent.title,
        similarity: Number((similarity * 100).toFixed(2)),
        confidenceScore,
        isPlagiarized: similarity > 0.6,
        metadata: fetchedContent.metadata,
        snippet: fetchedContent.snippet,
        textAnalysis: contentAnalysis,
        sentiment: analyzeSentiment(fetchedContent.content)
      };
    }));

    const validResults = plagiarismResults.filter(Boolean);

    if (validResults.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No valid results found after analysis'
      });
    }

    const maxSimilarity = Math.max(...validResults.map(r => r.similarity));
    const maxConfidence = Math.max(...validResults.map(r => r.confidenceScore));
    const overallPlagiarized = maxSimilarity > 60;

    const averageSimilarity = validResults.reduce((acc, curr) => acc + curr.similarity, 0) / validResults.length;
    const averageConfidence = validResults.reduce((acc, curr) => acc + curr.confidenceScore, 0) / validResults.length;
    const plagiarizedSources = validResults.filter(r => r.isPlagiarized).length;

    const sortedResults = validResults.sort((a, b) => b.confidenceScore - a.confidenceScore);

    res.status(200).json({
      status: 'success',
      data: {
        userProvidedContent: {
          content: content,
          textStats: textAnalysis,
          sentiment: sentimentAnalysis,
          wordCount: processedText.length,
          characterCount: content.length
        },
        plagiarismResults: {
          sources: sortedResults.map(result => ({
            url: result.url,
            title: result.title,
            similarity: result.similarity,
            confidenceScore: result.confidenceScore,
            isPlagiarized: result.isPlagiarized,
            snippet: result.snippet,
            metadata: result.metadata
          })),
          summary: {
            maxSimilarity: maxSimilarity.toFixed(2),
            maxConfidence: maxConfidence.toFixed(2),
            averageSimilarity: averageSimilarity.toFixed(2),
            averageConfidence: averageConfidence.toFixed(2),
            overallPlagiarized,
            plagiarizedSources,
            totalSourcesAnalyzed: validResults.length,
            highConfidenceSources: sortedResults.filter(r => r.confidenceScore > 70).length,
            mostLikelySource: sortedResults[0]?.url || null,
            mostLikelySourceConfidence: sortedResults[0]?.confidenceScore || 0
          }
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in plagiarism check:', error);
    res.status(500).json ({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message: undefined
    });
  }
});

app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  });

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err.details || {}
    }: undefined,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed. Process terminating...');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed. Process terminating...');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
});

module.exports = app;
