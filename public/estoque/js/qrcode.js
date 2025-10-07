
    function gerarQRCodeAlternativo(text) {
      const size = 200;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10`;
      return qrCodeUrl;
    }
    
    function gerarQRCode(button) {
      try {
        const produtoId = button.getAttribute('data-produto-id');
        const produtoNome = button.getAttribute('data-produto-nome');
        
        if (!produtoId || !produtoNome) {
          Swal.fire('Erro', 'Dados do produto não encontrados.', 'error');
          return;
        }
        
        const qrData = `${window.location.origin}/produto/${produtoId}`;
        
        if (typeof QRCode !== 'undefined') {
          Swal.fire({
            title: `QR Code - ${produtoNome}`,
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="qrContainer" style="margin-bottom: 15px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                  <canvas id="qrCanvas"></canvas>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                  <button id="downloadPngBtn" data-produto-nome="${produtoNome}" data-type="canvas" class="swal2-confirm swal2-styled">
                    <i class="fas fa-download"></i> Baixar PNG
                  </button>
                  <button id="downloadPdfBtn" data-produto-nome="${produtoNome}" data-type="canvas" class="swal2-cancel swal2-styled">
                    <i class="fas fa-file-pdf"></i> Baixar PDF
                  </button>
                </div>
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
                }).catch(error => {
                });
              }
              
              const downloadPngBtn = document.getElementById('downloadPngBtn');
              const downloadPdfBtn = document.getElementById('downloadPdfBtn');
              
              if (downloadPngBtn) {
                downloadPngBtn.addEventListener('click', function() {
                  const produtoNome = this.getAttribute('data-produto-nome');
                  const type = this.getAttribute('data-type');
                  downloadQR(produtoNome, type, 'png');
                });
              }
              
              if (downloadPdfBtn) {
                downloadPdfBtn.addEventListener('click', function() {
                  const produtoNome = this.getAttribute('data-produto-nome');
                  const type = this.getAttribute('data-type');
                  downloadQR(produtoNome, type, 'pdf');
                });
              }
            }
          });
        } else {
          const qrImageUrl = gerarQRCodeAlternativo(qrData);
          
          Swal.fire({
            title: `QR Code - ${produtoNome}`,
            html: `
                <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="qrContainer" style="margin-bottom: 15px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                  <img id="qrImage" src="${qrImageUrl}" alt="QR Code" style="max-width: 200px; max-height: 200px;"/>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                  <button id="downloadPngBtn" data-produto-nome="${produtoNome}" data-type="image" class="swal2-confirm swal2-styled">
                    <i class="fas fa-download"></i> Baixar PNG
                  </button>
                  <button id="downloadPdfBtn" data-produto-nome="${produtoNome}" data-type="image" class="swal2-cancel swal2-styled">
                    <i class="fas fa-file-pdf"></i> Baixar PDF
                  </button>
                </div>
              </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: 450,
            didOpen: () => {
              console.log('Modal aberto com QR Code alternativo');
              
              const downloadPngBtn = document.getElementById('downloadPngBtn');
              const downloadPdfBtn = document.getElementById('downloadPdfBtn');
              
              if (downloadPngBtn) {
                downloadPngBtn.addEventListener('click', function() {
                  const produtoNome = this.getAttribute('data-produto-nome');
                  const type = this.getAttribute('data-type');
                  downloadQR(produtoNome, type, 'png');
                });
              }
              
              if (downloadPdfBtn) {
                downloadPdfBtn.addEventListener('click', function() {
                  const produtoNome = this.getAttribute('data-produto-nome');
                  const type = this.getAttribute('data-type');
                  downloadQR(produtoNome, type, 'pdf');
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
    
    // Função auxiliar para download PNG
    function downloadAsPng(canvas, fileName, produtoNome) {
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        Swal.fire({
          title: 'Download realizado!',
          text: `QR Code de ${produtoNome} foi baixado como PNG`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        console.log('QR Code baixado como PNG:', fileName);
      }, 'image/png');
    }
    
    function downloadQR(produtoNome, type, format = 'png') {
      try {
        console.log('Fazendo download do QR Code - Formato:', format);
        const fileExtension = format === 'pdf' ? '.pdf' : '.png';
        const fileName = `qrcode-${produtoNome.replace(/[^a-zA-Z0-9]/g, '_')}${fileExtension}`;
        
        if (type === 'canvas') {
          const canvas = document.getElementById('qrCanvas');
          if (canvas) {
            if (format === 'pdf') {
              // Para PDF, precisamos usar jsPDF
              if (typeof jsPDF !== 'undefined') {
                const pdf = new jsPDF();
                const imgData = canvas.toDataURL('image/png');
                
                // Centralizar a imagem no PDF
                const imgWidth = 100; // largura em mm
                const imgHeight = 100; // altura em mm
                const pageWidth = pdf.internal.pageSize.width;
                const pageHeight = pdf.internal.pageSize.height;
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;
                
                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                pdf.save(fileName);
                
                Swal.fire({
                  title: 'Download realizado!',
                  text: `QR Code de ${produtoNome} foi baixado como PDF`,
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false
                });
                
                console.log('QR Code baixado como PDF via canvas:', fileName);
              } else {
                console.error('jsPDF não está disponível');
                Swal.fire('Erro', 'Biblioteca jsPDF não encontrada. Download em PNG será realizado.', 'warning');
                // Fallback para PNG
                downloadAsPng(canvas, fileName, produtoNome);
              }
            } else {
              // Download como PNG
              downloadAsPng(canvas, fileName, produtoNome);
            }
          }
        } else if (type === 'image') {
          const img = document.getElementById('qrImage');
          if (img) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const imgElement = new Image();
            imgElement.crossOrigin = 'anonymous';
            
            imgElement.onload = function() {
              canvas.width = imgElement.width;
              canvas.height = imgElement.height;
              ctx.drawImage(imgElement, 0, 0);
              
              if (format === 'pdf') {
                // Para PDF, precisamos usar jsPDF
                if (typeof jsPDF !== 'undefined' || (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF)) {
                  const { jsPDF: PDF } = window.jspdf || { jsPDF };
                  const pdf = new (PDF || jsPDF)();
                  const imgData = canvas.toDataURL('image/png');
                  
                  // Centralizar a imagem no PDF
                  const imgWidth = 100; // largura em mm
                  const imgHeight = 100; // altura em mm
                  const pageWidth = pdf.internal.pageSize.width;
                  const pageHeight = pdf.internal.pageSize.height;
                  const x = (pageWidth - imgWidth) / 2;
                  const y = (pageHeight - imgHeight) / 2;
                  
                  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                  pdf.save(fileName);
                  
                  Swal.fire({
                    title: 'Download realizado!',
                    text: `QR Code de ${produtoNome} foi baixado como PDF`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                  });
                  
                  console.log('QR Code baixado como PDF via imagem:', fileName);
                } else {
                  console.error('jsPDF não está disponível');
                  Swal.fire('Erro', 'Biblioteca jsPDF não encontrada. Download em PNG será realizado.', 'warning');
                  // Fallback para PNG
                  downloadAsPng(canvas, fileName, produtoNome);
                }
              } else {
                // Download como PNG
                downloadAsPng(canvas, fileName, produtoNome);
              }
            };
            
            imgElement.onerror = function() {
              console.warn('Erro ao carregar imagem, tentando método alternativo');
              fetch(img.src, { mode: 'cors' })
                .then(response => response.blob())
                .then(blob => {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = fileName;
                  link.style.display = 'none';
                  
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  setTimeout(() => URL.revokeObjectURL(url), 100);
                  
                  Swal.fire({
                    title: 'Download realizado!',
                    text: `QR Code de ${produtoNome} foi baixado`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                  });
                })
                .catch(error => {
                  console.error('Erro no fallback:', error);
                  Swal.fire('Erro', 'Não foi possível baixar o QR Code.', 'error');
                });
            };
            
            imgElement.src = img.src;
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
      console.log('jsPDF disponível:', typeof jsPDF !== 'undefined' || (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF));

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