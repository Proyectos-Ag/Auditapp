// controllers/ishikawaController.js
const Ishikawa = require('../models/ishikawaSchema');

const crearIshikawa = async (req, res) => {
    try {
        const newIshikawa = new Ishikawa(req.body);
        console.log(req.body);
        await newIshikawa.save();
        res.status(201).json(newIshikawa);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const obtenerIshikawas = async (req, res) => {
    try {
        const ishikawas = await Ishikawa.find();
        res.status(200).json(ishikawas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearIshikawa,
    obtenerIshikawas
};
