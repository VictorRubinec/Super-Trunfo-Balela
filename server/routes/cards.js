const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs   = require('fs');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/cards.json');

function readCards() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function writeCards(cards) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
}

router.get('/', (req, res) => {
    res.json(readCards());
});

router.post('/', (req, res) => {
    const cards   = readCards();
    const newCard = {
        ...req.body,
        id:        uuidv4(),
        criado_em: new Date().toISOString(),
    };
    cards.push(newCard);
    writeCards(cards);
    res.status(201).json(newCard);
});

router.put('/:id', (req, res) => {
    const cards = readCards();
    const idx   = cards.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Carta não encontrada' });

    cards[idx] = { ...cards[idx], ...req.body, id: req.params.id };
    writeCards(cards);
    res.json(cards[idx]);
});

router.delete('/:id', (req, res) => {
    let cards = readCards();
    const initial = cards.length;
    cards = cards.filter(c => c.id !== req.params.id);
    if (cards.length === initial) return res.status(404).json({ error: 'Carta não encontrada' });
    writeCards(cards);
    res.json({ ok: true });
});

module.exports = router;
