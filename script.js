// server.js
const WebSocket = require('ws');
const { enkripsi } = require('./encrypt.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Dictionary to store authentication status for device clients
const authenticatedClients = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
});

// Create WebSocket server with configuration
const wss = new WebSocket.Server({ 
    server,
    // Tambahkan konfigurasi untuk allow origins
    verifyClient: ({ origin }, callback) => {
        // Allow all origins
        callback(true);
    }
});

// Log when server starts
const PORT = 8765;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket server is accessible at ws://YOUR_SERVER_IP:${PORT}`);
});

// Rest of your server code remains the same...
