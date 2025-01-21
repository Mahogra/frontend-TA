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

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

// WebSocket server handler
const serverHandler = async (ws, req) => {
    const clientId = req.socket.remoteAddress;
    const clientType = req.headers.origin ? 'web' : 'device';
    console.log(`New ${clientType} client connected from ${clientId}`);

    try {
        ws.on('message', async (message) => {
            if (clientType === 'web') {
                // Web clients can directly send setpoints
                const setpoint = message.toString();
                const encryptedMessage = JSON.stringify(enkripsi(setpoint));
                console.log(`Received setpoint from web: ${setpoint}`);
                console.log(`Broadcasting encrypted message: ${encryptedMessage}`);
                
                // Send to all authenticated device clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN && authenticatedClients.has(client.clientId)) {
                        client.send(encryptedMessage);
                    }
                });
            } else {
                // Handle device client authentication
                if (!authenticatedClients.has(clientId)) {
                    try {
                        const authData = JSON.parse(message);
                        if (authData.name === "Sean" && authData.password === "bayar10rb") {
                            authenticatedClients.set(clientId, true);
                            ws.clientId = clientId; // Store clientId in ws object for later reference
                            console.log(`Device authenticated successfully: ${clientId}`);
                            ws.send("Selamat datang! Anda terautentikasi.");
                        } else {
                            console.log(`Authentication failed from device: ${clientId}`);
                            ws.close();
                        }
                    } catch (error) {
                        console.log(`Invalid authentication data from device: ${clientId}`);
                        ws.close();
                    }
                }
            }
        });

        ws.on('close', () => {
            if (clientType === 'device') {
                authenticatedClients.delete(clientId);
                console.log(`Device client disconnected: ${clientId}`);
            } else {
                console.log(`Web client disconnected: ${clientId}`);
            }
        });

    } catch (error) {
        console.error(`Connection Error:`, error);
        if (clientType === 'device') {
            authenticatedClients.delete(clientId);
        }
    }
};

// Start server
const PORT = 8765;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

wss.on('connection', serverHandler);