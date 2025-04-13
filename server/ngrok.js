import ngrok from 'ngrok';

async function startNgrok() {
    try {
        const url = await ngrok.connect({
            addr: 8080, // Port your server is running on
            authtoken: process.env.NGROK_AUTH_TOKEN // Optional: Your ngrok auth token
        });
        console.log('Ngrok tunnel created:', url);
        console.log('Use this URL for your Coinbase Commerce webhook:', url + '/api/crypto/webhook');
    } catch (error) {
        console.error('Error creating ngrok tunnel:', error);
    }
}

startNgrok(); 