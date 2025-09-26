
    function gerarQRCodeAlternativo(text) {
      const size = 200;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10`;
      console.log('URL da API QR:', qrCodeUrl);
      return qrCodeUrl;
    }
    
    function gerarQRCode(button) {
      try {
        console.log('Função gerarQRCode chamada');
        
        const produtoId = button.getAttribute('data-produto-id');
        const produtoNome = button.getAttribute('data-produto-nome');
        
        console.log('Dados do produto:', { produtoId, produtoNome }); 
        
        if (!produtoId || !produtoNome) {
          console.error('Dados do produto não encontrados');
          Swal.fire('Erro', 'Dados do produto não encontrados.', 'error');
          return;
        }
        
        const qrData = `${window.location.origin}/produto/${produtoId}`;
        console.log('URL para QR Code:', qrData);
        
        if (typeof QRCode !== 'undefined') {
          console.log('Usando biblioteca QRCode.js');
          Swal.fire({
            title: `QR Code - ${produtoNome}`,
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="qrContainer" style="margin-bottom: 15px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                  <canvas id="qrCanvas"></canvas>
                </div>
                <button id="downloadBtn" data-produto-nome="${produtoNome}" data-type="canvas" class="swal2-confirm swal2-styled" style="margin-top: 10px;">
                  Baixar QR Code
                </button>
              </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: 450,
            didOpen: () => {
              console.log('Modal aberto, gerando QR Code com canvas...');
              const canvas = document.getElementById('qrCanvas');
              if (canvas) {
                QRCode.toCanvas(canvas, qrData, {
                  width: 200,
                  margin: 1,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  }
                }).then(() => {
                  console.log('QR Code gerado com sucesso!');
                }).catch(error => {
                  console.error('Erro ao gerar QR Code:', error);
                });
              }
              
              const downloadBtn = document.getElementById('downloadBtn');
              if (downloadBtn) {
                downloadBtn.addEventListener('click', function() {
                  const produtoNome = this.getAttribute('data-produto-nome');
                  const type = this.getAttribute('data-type');
                  downloadQR(produtoNome, type);
                });
              }
            }
          });
        } else {
          console.log('Usando API alternativa para QR Code');
          const qrImageUrl = gerarQRCodeAlternativo(qrData);
          
          Swal.fire({
            title: `QR Code - ${produtoNome}`,
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="qrContainer" style="margin-bottom: 15px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                  <img id="qrImage" src="${qrImageUrl}" alt="QR Code" style="max-width: 200px; max-height: 200px;" onload="console.log('QR Code imagem carregada')" onerror="console.error('Erro ao carregar QR Code imagem')"/>
                </div>
                <button id="downloadBtn" data-produto-nome="${produtoNome}" data-type="image" class="swal2-confirm swal2-styled" style="margin-top: 10px;">
                  Baixar QR Code
                </button>
              </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: 450,
            didOpen: () => {
              console.log('Modal aberto com QR Code alternativo');
              
              const downloadBtn = document.getElementById('downloadBtn');
              if (downloadBtn) {
                downloadBtn.addEventListener('click', function() {
                  const produtoNome = this.getAttribute('data-produto-nome');
                  const type = this.getAttribute('data-type');
                  downloadQR(produtoNome, type);
                });
              }
            }
          });
        }
        
      } catch (error) {
        console.error('Erro na função gerarQRCode:', error);
        Swal.fire('Erro', 'Ocorreu um erro ao gerar o QR Code: ' + error.message, 'error');
      }
    }
    
    function downloadQR(produtoNome, type) {
      try {
        console.log('Fazendo download do QR Code'); // Debug
        const fileName = `qrcode-${produtoNome.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        
        if (type === 'canvas') {
          const canvas = document.getElementById('qrCanvas');
          if (canvas) {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL();
            link.click();
          }
        } else if (type === 'image') {
          const img = document.getElementById('qrImage');
          if (img) {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = img.src;
            link.click();
          }
        }
      } catch (error) {
        console.error('Erro ao baixar QR Code:', error);
        Swal.fire('Erro', 'Erro ao baixar o QR Code.', 'error');
      }
    }

    window.addEventListener('load', function() {
      console.log('Página carregada');
      console.log('QRCode disponível:', typeof QRCode !== 'undefined');
      console.log('Swal disponível:', typeof Swal !== 'undefined');

      const botoes = document.querySelectorAll('.btn-qr');
      console.log('Botões QR encontrados:', botoes.length);
      
      botoes.forEach(function(botao) {
        botao.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Botão QR Code clicado');
          gerarQRCode(this);
        });
      });
    });