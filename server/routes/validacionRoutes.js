const express = require("express");
const router = express.Router();
const controller = require("../controllers/validacionController");

router.post("/", controller.createValidacion);
router.get("/", controller.getAll);
router.get("/:gestionId", controller.getByGestionId);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
