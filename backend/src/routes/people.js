const express = require('express');
const { listPeople, upsertPerson } = require('../controllers/peopleController');

const router = express.Router();

router.get('/', listPeople);
router.post('/', upsertPerson);

module.exports = router;


