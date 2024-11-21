# Plagiarism Checker API

A simple plagiarism detection API that analyzes text for similarities and provides detailed reports. This API can be used to check documents, articles, or any text content for potential plagiarism.

## Disclaimer

This tool provides a basic level of plagiarism detection. This API doesn't use advanced machine learning models. Instead, it relies only on techniques such as term frequency-inverse document frequency (TF-IDF) and cosine similarity to compare text. As a result, the accuracy of the plagiarism detection may be limited. For critical applications, consider using more advanced plagiarism detection solutions.

## Features

- Check for plagiarism by comparing input text against various sources.
- Detailed reports including similarity scores and text analysis.
- Supports multiple content types (e.g., articles, essays).
- Easy to integrate with other applications.

## Technologies Used

- **Node.js**: JavaScript runtime for building the API.
- **Express**: Web framework for Node.js to handle HTTP requests.
- **Axios**: Promise-based HTTP client for making requests to external sources.
- **Natural**: NLP library for text processing and analysis.
- **TF-IDF**: For calculating term frequency-inverse document frequency.

### How to Use the API
You can use tools like Postman or cURL to make requests to the API. Here’s a simple example using cURL for the plagiarism check endpoint:

Example Request for Plagiarism Check
```bash
curl -X POST http://localhost:3000/plagiarism?content=${yourContentHere}\
-H "Content-Type: application/json"
```

### Contributing
Contributions are welcome! If you have suggestions for improvements or new features, please fork the repository and submit a pull request.

### License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
