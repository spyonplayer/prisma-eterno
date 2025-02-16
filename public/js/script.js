// Função para carregar os posts do servidor
async function carregarFeed() {
    try {
      const response = await fetch('/api/posts');
      const posts = await response.json();
      const feed = document.getElementById('feed');
  
      // Limpa o feed antes de adicionar novos posts
      feed.innerHTML = '';
  
      // Adiciona cada post ao feed
      posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
  
        if (post.tipo === 'imagem') {
          postElement.innerHTML = `
            <img src="${post.conteudo}" alt="Imagem do post">
          `;
        } else if (post.tipo === 'video') {
          postElement.innerHTML = `
            <video src="${post.conteudo}" controls></video>
          `;
        } else {
          postElement.innerHTML = `
            <p>${post.conteudo}</p>
          `;
        }
  
        feed.appendChild(postElement);
      });
    } catch (error) {
      console.error('Erro ao carregar o feed:', error);
    }
  }
  
  // Função para validar o código e carregar o áudio correspondente
  async function validarCodigo() {
    const codigo = document.getElementById('codigo').value;
  
    if (!codigo) {
      alert('Por favor, insira um código.');
      return;
    }
  
    try {
      const response = await fetch(`/api/audios?codigo=${codigo}`);
      const audio = await response.json();
  
      if (audio) {
        const player = document.getElementById('player');
        const audioElement = document.getElementById('audio');
  
        audioElement.src = audio.caminho;
        player.style.display = 'block';
      } else {
        alert('Código inválido!');
      }
    } catch (error) {
      console.error('Erro ao validar o código:', error);
    }
  }
  
  // Função para controlar o player de áudio
  function controlarAudio(acao) {
    const audio = document.getElementById('audio');
  
    switch (acao) {
      case 'play':
        audio.play();
        break;
      case 'pause':
        audio.pause();
        break;
      case 'reiniciar':
        audio.currentTime = 0;
        audio.play();
        break;
      default:
        console.error('Ação inválida');
    }
  }
  
  // Carrega o feed quando a página é carregada
  document.addEventListener('DOMContentLoaded', carregarFeed);