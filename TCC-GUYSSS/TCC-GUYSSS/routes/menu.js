const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const ensureAuth = require('../middlewares/ensureAuth');
const menuController = require('../controllers/menuController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Formato de imagem inválido.'));
    cb(null, true);
  }
});

router.use(ensureAuth);

router.get('/', menuController.renderMenu);
router.post('/create', upload.single('imagem'), menuController.createPrato);
router.post('/edit/:id', upload.single('imagem'), menuController.editarPrato);
router.post(['/delete/:id', '/excluir/:id'], menuController.excluirPrato);

router.patch('/:id', menuController.updateParcial);

router.post('/:id/arquivar', (req, res, next) => { req.body.arquivado = 1; next(); }, menuController.updateParcial);
router.post('/:id/desarquivar', (req, res, next) => { req.body.arquivado = 0; next(); }, menuController.updateParcial);

module.exports = router;
