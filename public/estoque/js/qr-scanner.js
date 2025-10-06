class QRCodeScanner {
  constructor() {
    this.html5QrcodeScanner = null;
    this.isScanning = false;
    this.currentProdutoId = null;
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.modalLeitor = document.getElementById('modalLeitorQR');
    this.btnEscanear = document.getElementById('btnEscanearQR');
    this.btnFecharLeitor = document.getElementById('fecharModalLeitor');
    this.btnPararLeitor = document.getElementById('pararLeitorQR');
  }

  setupEventListeners() {
    this.btnEscanear?.addEventListener('click', () => this.abrirScanner());

    this.btnFecharLeitor?.addEventListener('click', () => this.fecharScanner());
    this.btnPararLeitor?.addEventListener('click', () => this.fecharScanner());
    
    window.addEventListener('click', (e) => {
      if (e.target === this.modalLeitor) this.fecharScanner();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalLeitor?.classList.contains('is-open')) {
        this.fecharScanner();
      }
    });
  }

  abrirScanner() {
    if (!this.modalLeitor) return;
    
    this.modalLeitor.classList.add('is-open');
    
    const readerResults = document.getElementById('qr-reader-results');
    if (readerResults) {
      readerResults.innerHTML = '<p>Iniciando câmera...</p>';
    }
    
    this.iniciarScanner();
  }

  iniciarScanner() {
    if (this.isScanning) return;
    const qrReader = document.getElementById('qr-reader');
    if (qrReader) {
      qrReader.innerHTML = '';
    }
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true
    };

    this.html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader", 
      config, 
      false
    );

    this.html5QrcodeScanner.render(
      (decodedText, decodedResult) => this.onScanSuccess(decodedText, decodedResult),
      (error) => this.onScanFailure(error)
    );

    this.isScanning = true;
    console.log('Scanner QR Code iniciado');
    
    setTimeout(() => {
      const readerResults = document.getElementById('qr-reader-results');
      if (readerResults) {
        readerResults.innerHTML = '<p>Aponte a câmera para o QR Code do produto</p>';
      }
      
      this.traduzirInterfaceScanner();
    }, 1000);
  }

  traduzirInterfaceScanner() {
    const traduzirElemento = (selector, novoTexto) => {
      const elemento = document.querySelector(selector);
      if (elemento) {
        elemento.textContent = novoTexto;
      }
    };

    setTimeout(() => {
      traduzirElemento('#html5-qrcode-button-camera-start', 'Iniciar Câmera');
      traduzirElemento('#html5-qrcode-button-camera-stop', 'Parar Câmera');
      traduzirElemento('#html5-qrcode-button-file-selection', 'Selecionar Arquivo');

      const cameraSelection = document.querySelector('#html5-qrcode-select-camera');
      if (cameraSelection) {
        const options = cameraSelection.querySelectorAll('option');
        options.forEach(option => {
          if (option.value.includes('back')) {
            option.textContent = 'Câmera Traseira';
          } else if (option.value.includes('front')) {
            option.textContent = 'Câmera Frontal';
          }
        });
      }

      const links = document.querySelectorAll('#qr-reader a');
      links.forEach(link => {
        if (link.textContent.includes('Scan an Image File')) {
          link.textContent = 'Escanear um Arquivo de Imagem';
        }
      });
    }, 500);
  }

  async onScanSuccess(decodedText, decodedResult) {
    console.log('QR Code escaneado:', decodedText);
    this.pararScanner();
    
    let produtoId = this.extrairIdDoCodigo(decodedText);
    
    if (produtoId) {
      const produtoExiste = document.querySelector(`tr[data-id="${produtoId}"]`);
      
      if (produtoExiste) {
        this.fecharScanner();
        
        setTimeout(() => {
          if (window.abrirModalPorId) {
            const sucesso = window.abrirModalPorId(produtoId);
            if (sucesso) {
              Swal.fire({
                title: 'Produto encontrado!',
                text: 'Modal de edição aberto.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });
            } else {
              console.warn('Falha ao abrir modal para produto:', produtoId);
            }
          }
        }, 500);
      } else {
        this.fecharScanner();
        setTimeout(() => {
          window.location.href = `/estoque?edit=${produtoId}`;
        }, 200);
      }
    } else {
      this.fecharScanner();
      Swal.fire('Erro', 'QR Code não reconhecido como produto válido.', 'error');
    }
  }

  onScanFailure(error) {
    if (error.includes('NotAllowedError') || error.includes('Permission denied')) {
      const readerResults = document.getElementById('qr-reader-results');
      if (readerResults) {
        readerResults.innerHTML = '<p style="color: red;">Permissão da câmera negada. Permita o acesso à câmera nas configurações do navegador.</p>';
      }
    } else if (error.includes('NotFoundError') || error.includes('No camera found')) {
      const readerResults = document.getElementById('qr-reader-results');
      if (readerResults) {
        readerResults.innerHTML = '<p style="color: orange;">Nenhuma câmera encontrada no dispositivo.</p>';
      }
    }
  }

  extrairIdDoCodigo(decodedText) {
    if (/^\d+$/.test(decodedText)) {
      return decodedText;
    }

    const urlMatch = decodedText.match(/\/produto\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    return null;
  }

  pararScanner() {
    if (this.html5QrcodeScanner && this.isScanning) {
      this.html5QrcodeScanner.clear().then(() => {
        this.html5QrcodeScanner = null;
        this.isScanning = false;
        console.log('Scanner QR Code parado');
  
        const qrReader = document.getElementById('qr-reader');
        if (qrReader) {
          qrReader.innerHTML = '';
        }
        
        const readerResults = document.getElementById('qr-reader-results');
        if (readerResults) {
          readerResults.innerHTML = '<p>Aponte a câmera para o QR Code do produto</p>';
        }
      }).catch(error => {
        console.warn('Erro ao parar scanner:', error);
        this.html5QrcodeScanner = null;
        this.isScanning = false;
        
        const qrReader = document.getElementById('qr-reader');
        if (qrReader) {
          qrReader.innerHTML = '';
        }
      });
    }
  }

  fecharScanner() {
    this.pararScanner();
    if (this.modalLeitor) {
      this.modalLeitor.classList.remove('is-open');
    }

    setTimeout(() => {
      this.currentProdutoId = null;
      const qrReader = document.getElementById('qr-reader');
      if (qrReader) {
        qrReader.innerHTML = '';
      }
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.qrScanner = new QRCodeScanner();
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.textContent) {
              if (node.textContent.includes('Unable to access camera') || node.textContent.includes('Permission denied')) {
                node.textContent = 'Não foi possível acessar a câmera. Verifique as permissões.';
              } else if (node.textContent.includes('Camera not found')) {
                node.textContent = 'Câmera não encontrada.';
              } else if (node.textContent.includes('QR code parse error')) {
                node.textContent = 'Erro ao ler QR Code.';
              } else if (node.textContent.includes('Start scanning')) {
                node.textContent = 'Iniciar escaneamento';
              } else if (node.textContent.includes('Stop scanning')) {
                node.textContent = 'Parar escaneamento';
              }
            }
          }
        });
      }
    });
  });
  
  const qrReaderContainer = document.getElementById('qr-reader');
  if (qrReaderContainer) {
    observer.observe(qrReaderContainer, {
      childList: true,
      subtree: true
    });
  }
});