import { Router } from "express";
import { appointmentController } from "../controllers/AppointmentController";

const router = Router();

// Rutas de citas
router.get("/", appointmentController.getAllAppointments.bind(appointmentController));
router.get("/stats", appointmentController.getAppointmentStats.bind(appointmentController));
router.get("/patient/:patientId", appointmentController.getPatientAppointments.bind(appointmentController));
router.get("/doctor/:doctorId", appointmentController.getDoctorAppointments.bind(appointmentController));
router.get("/:id", appointmentController.getAppointmentById.bind(appointmentController));
router.post("/", appointmentController.createAppointment.bind(appointmentController));
router.put("/:id", appointmentController.updateAppointment.bind(appointmentController));
router.patch("/:id/status", appointmentController.updateAppointmentStatus.bind(appointmentController));
router.delete("/:id", appointmentController.deleteAppointment.bind(appointmentController));

export default router;
