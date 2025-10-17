import { Router } from "express";
import { patientController } from "../controllers/PatientController";

const router = Router();

// Rutas de pacientes
router.get("/", patientController.getAllPatients.bind(patientController));
router.get("/search", patientController.searchPatients.bind(patientController));
router.get("/:id", patientController.getPatientById.bind(patientController));
router.get("/:id/appointments", patientController.getPatientAppointments.bind(patientController));
router.post("/", patientController.createPatient.bind(patientController));
router.put("/:id", patientController.updatePatient.bind(patientController));
router.delete("/:id", patientController.deletePatient.bind(patientController));

export default router;
