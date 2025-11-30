const express = require('express');
const { onboardingCreate } = require('../controllers/onboardingController');

const router = express.Router();

router.post('/', onboardingCreate);

module.exports = router;


