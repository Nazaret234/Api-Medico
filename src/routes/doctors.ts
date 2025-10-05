import { Router } from "express";
import { doctorController } from "../controllers/DoctorController";

const router = Router();

// Rutas de doctores
router.get("/", doctorController.getAllDoctors.bind(doctorController));
router.get("/search", doctorController.searchDoctors.bind(doctorController));
router.get("/specialty/:specialty", doctorController.getDoctorsBySpecialty.bind(doctorController));
router.get("/:id", doctorController.getDoctorById.bind(doctorController));
router.get("/:id/appointments", doctorController.getDoctorAppointments.bind(doctorController));
router.post("/", doctorController.createDoctor.bind(doctorController));
router.put("/:id", doctorController.updateDoctor.bind(doctorController));
router.delete("/:id", doctorController.deleteDoctor.bind(doctorController));

export default router;
