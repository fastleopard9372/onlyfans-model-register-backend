const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/:folder/:filename', (req, res) => {
    const {filename, folder} = req.params;
    const filePath = path.join(__dirname, folder, filename);
    console.log(filePath);
    
    return res.download(filePath);
});

module.exports = router;
