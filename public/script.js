// ==================== Dados Iniciais e Variáveis Globais ====================

// Tenta carregar posts e áudios do LocalStorage, caso contrário utiliza valores iniciais
let sharedData = {
    posts: JSON.parse(localStorage.getItem("posts")) || [
        { type: "text", content: "Este é um post de texto." },
        { type: "image", content: "imagem1.jpg" },
        { type: "video", content: "video1.mp4" }
    ],
    audioMap: JSON.parse(localStorage.getItem("audioMap")) || {
        "teste": "teste.mp3",
        "CODE456": "audio2.mp3"
    }
};

const moderatorPassword = "ruulmoran"; // Senha do moderador

// ==================== Socket.io (Atualizações em Tempo Real) ====================

const socket = io();

// Ao receber dados iniciais do servidor, atualiza o sharedData e recarrega a interface
socket.on('initialData', (data) => {
    sharedData.posts = data.posts;
    sharedData.audioMap = data.audioMap;
    savePosts();
    saveAudios();
    loadPosts();
    updateAudioList();
});

// Atualizações de posts enviados pelo servidor
socket.on('updatePosts', (posts) => {
    sharedData.posts = posts;
    savePosts();
    loadPosts();
});

// Atualizações de áudios enviados pelo servidor
socket.on('updateAudios', (audioMap) => {
    sharedData.audioMap = audioMap;
    saveAudios();
    updateAudioList();
});

// ==================== Funções de Armazenamento ====================

function savePosts() {
    localStorage.setItem("posts", JSON.stringify(sharedData.posts));
}

function saveAudios() {
    localStorage.setItem("audioMap", JSON.stringify(sharedData.audioMap));
}

// ==================== Funções de Post ====================

function loadPosts() {
    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = "";

    sharedData.posts.forEach((post, index) => {
        const postElement = document.createElement("div");
        postElement.classList.add("post");

        if (post.type === "text") {
            postElement.innerHTML = `<p>${post.content}</p>`;
        } else if (post.type === "image") {
            postElement.innerHTML = `<img src="${post.content}" alt="Imagem">`;
        } else if (post.type === "video") {
            // Se for link do YouTube ou Google Drive, exibe o embed. Senão, vídeo local.
            if (isYouTubeLink(post.content)) {
                postElement.innerHTML = getYouTubeEmbed(post.content);
            } else if (isGoogleDriveLink(post.content)) {
                postElement.innerHTML = getGoogleDriveEmbed(post.content);
            } else {
                postElement.innerHTML = `<video controls><source src="${post.content}" type="video/mp4"></video>`;
            }
        }

        // Se a área de gerenciamento estiver visível, adiciona os botões de moderador
        if (!document.getElementById("audioManagement").classList.contains("hidden")) {
            const editButton = document.createElement("button");
            editButton.innerText = "Editar";
            editButton.classList.add("edit-button");
            editButton.addEventListener("click", () => editPost(post, index));

            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Excluir";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", () => deletePost(post, index));

            postElement.appendChild(editButton);
            postElement.appendChild(deleteButton);
        }

        postsContainer.appendChild(postElement);
    });
}

// Adiciona um novo post
function addPost() {
    const postType = document.getElementById("postType").value;
    const postContent = document.getElementById("postContent").value;

    if (!postContent) {
        alert("Por favor, insira o conteúdo do post.");
        return;
    }

    const newPost = {
        id: Date.now().toString(), // ID único para integração com o socket
        type: postType,
        content: postContent
    };

    // Se houver conexão via Socket, envia para o servidor; senão, atualiza localmente
    if (socket && socket.connected) {
        socket.emit('addPost', newPost);
    } else {
        sharedData.posts.push(newPost);
        savePosts();
        loadPosts();
    }

    // Limpa o campo de conteúdo
    document.getElementById("postContent").value = "";
}

// Edita um post
function editPost(post, index) {
    const newContent = prompt("Editar conteúdo:", post.content);
    if (newContent) {
        const updatedPost = { ...post, content: newContent };
        // Se o socket estiver ativo, envia a alteração; caso contrário, atualiza localmente
        if (socket && socket.connected) {
            socket.emit('editPost', updatedPost);
        } else {
            sharedData.posts[index] = updatedPost;
            savePosts();
            loadPosts();
        }
    }
}

// Exclui um post
function deletePost(post, index) {
    if (confirm("Tem certeza que deseja excluir este post?")) {
        // Se o socket estiver ativo, envia a solicitação; senão, remove localmente
        if (socket && socket.connected) {
            socket.emit('deletePost', post.id);
        } else {
            sharedData.posts.splice(index, 1);
            savePosts();
            loadPosts();
        }
    }
}

// ==================== Funções para Verificar Links e Embeds ====================

function isYouTubeLink(url) {
    return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbed(url) {
    let videoId = "";
    if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be")) {
        videoId = url.split("youtu.be/")[1];
    }
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

function isGoogleDriveLink(url) {
    return url.includes("drive.google.com");
}

function getGoogleDriveEmbed(url) {
    let fileId = "";
    if (url.includes("/file/d/")) {
        fileId = url.split("/file/d/")[1].split("/")[0];
    } else if (url.includes("id=")) {
        fileId = url.split("id=")[1].split("&")[0];
    }
    return `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="100%" height="315" frameborder="0" allowfullscreen></iframe>`;
}

// ==================== Funções de Áudio ====================

function updateAudioList() {
    const audioList = document.getElementById("audioList");
    audioList.innerHTML = "";
    for (const [code, audio] of Object.entries(sharedData.audioMap)) {
        const audioItem = document.createElement("div");
        audioItem.innerHTML = `
            <span>Código: ${code} - Áudio: ${audio}</span>
            <button onclick="editAudio('${code}')">Editar</button>
            <button onclick="deleteAudio('${code}')">Excluir</button>
        `;
        audioList.appendChild(audioItem);
    }
}

// Adiciona áudio via prompt (para usuários moderadores)
function addAudio() {
    // Se estiver na interface de moderação (LocalStorage) ou no socket, ajusta a coleta de dados
    if (socket && socket.connected) {
        const code = document.getElementById("audioCode").value;
        const audioLink = document.getElementById("audioLink").value;
        if (!code || !audioLink) {
            alert("Por favor, insira o código e o link do áudio.");
            return;
        }
        const newAudio = { code, url: audioLink };
        socket.emit('addAudio', newAudio);
    } else {
        const code = prompt("Digite o código:");
        const audioFile = prompt("Digite o nome do arquivo de áudio (ex: audio.mp3):");
        if (code && audioFile) {
            sharedData.audioMap[code] = audioFile;
            saveAudios();
            updateAudioList();
        }
    }
}

// Edita áudio
function editAudio(code) {
    const newAudioFile = prompt("Digite o novo nome do arquivo de áudio:", sharedData.audioMap[code]);
    if (newAudioFile) {
        if (socket && socket.connected) {
            const updatedAudio = { code, url: newAudioFile };
            socket.emit('editAudio', updatedAudio);
        } else {
            sharedData.audioMap[code] = newAudioFile;
            saveAudios();
            updateAudioList();
        }
    }
}

// Exclui áudio
function deleteAudio(code) {
    if (confirm("Tem certeza que deseja excluir este áudio?")) {
        if (socket && socket.connected) {
            socket.emit('deleteAudio', code);
        } else {
            delete sharedData.audioMap[code];
            saveAudios();
            updateAudioList();
        }
    }
}

// ==================== Funções de Reprodução de Áudio ====================

function checkCode() {
    const codeInput = document.getElementById("codeInput").value;
    const audioPlayer = document.getElementById("audioPlayer");
    const audioElement = document.getElementById("audio");

    if (sharedData.audioMap[codeInput]) {
        audioElement.src = sharedData.audioMap[codeInput];
        audioPlayer.classList.remove("hidden");
    } else {
        alert("Código inválido!");
    }
}

function playAudio() {
    document.getElementById("audio").play();
}

function pauseAudio() {
    document.getElementById("audio").pause();
}

function restartAudio() {
    const audioElement = document.getElementById("audio");
    audioElement.currentTime = 0;
    audioElement.play();
}

// Controle de volume
document.getElementById("volumeControl").addEventListener("input", (e) => {
    document.getElementById("audio").volume = e.target.value;
});

// ==================== Funções de Login e Moderação ====================

function loginModerator() {
    const passwordInput = document.getElementById("moderatorPassword").value;
    if (passwordInput === moderatorPassword) {
        alert("Login realizado com sucesso!");
        document.getElementById("loginModal").classList.add("hidden");
        enableModeration(); // Ativa funcionalidades de moderação
    } else {
        document.getElementById("loginError").classList.remove("hidden");
    }
}

function enableModeration() {
    // Recarrega os posts com botões de edição/exclusão
    loadPosts();
    // Exibe a interface de gerenciamento de áudios
    document.getElementById("audioManagement").classList.remove("hidden");
    // Exibe a seção de adicionar posts (caso esteja oculta)
    document.getElementById("addPostSection").classList.remove("hidden");
}

// ==================== Configurações Iniciais ====================

window.onload = () => {
    loadPosts();
    updateAudioList();
};

// Configurações de modal de login
document.getElementById("moderatorLoginButton").addEventListener("click", () => {
    document.getElementById("loginModal").classList.remove("hidden");
});
document.getElementById("loginModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("loginModal")) {
        document.getElementById("loginModal").classList.add("hidden");
    }
});
document.getElementById("closeModalButton").addEventListener("click", () => {
    document.getElementById("loginModal").classList.add("hidden");
});
