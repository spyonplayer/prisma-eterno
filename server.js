const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Dados compartilhados
let sharedData = {
    posts: [],
    audioMap: {}
};

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Conexão do Socket.IO
io.on('connection', (socket) => {
    console.log('Um usuário conectou');

    // Enviar dados atuais para o novo usuário
    socket.emit('initialData', sharedData);

    // Receber atualizações de posts
    socket.on('addPost', (post) => {
        sharedData.posts.push(post);
        io.emit('updatePosts', sharedData.posts); // Enviar para todos os usuários
    });

    socket.on('editPost', (updatedPost) => {
        const index = sharedData.posts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
            sharedData.posts[index] = updatedPost;
            io.emit('updatePosts', sharedData.posts); // Enviar para todos os usuários
        }
    });

    socket.on('deletePost', (postId) => {
        sharedData.posts = sharedData.posts.filter(p => p.id !== postId);
        io.emit('updatePosts', sharedData.posts); // Enviar para todos os usuários
    });

    // Receber atualizações de áudios
    socket.on('addAudio', (audio) => {
        sharedData.audioMap[audio.code] = audio.url;
        io.emit('updateAudios', sharedData.audioMap); // Enviar para todos os usuários
    });

    socket.on('editAudio', (updatedAudio) => {
        sharedData.audioMap[updatedAudio.code] = updatedAudio.url;
        io.emit('updateAudios', sharedData.audioMap); // Enviar para todos os usuários
    });

    socket.on('deleteAudio', (code) => {
        delete sharedData.audioMap[code];
        io.emit('updateAudios', sharedData.audioMap); // Enviar para todos os usuários
    });

    // Desconexão do usuário
    socket.on('disconnect', () => {
        console.log('Um usuário desconectou');
    });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});