import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import db from "../services/database";

export class DoctorController extends BaseController {
  /**
   * Obtener todos los doctores
   */
  async getAllDoctors(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, specialty } = req.query;

      const where = specialty ? { specialty: specialty as string } : {};

      const doctors = await db.prisma.doctor.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: true,
          appointments: {
            include: {
              appointment: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await db.prisma.doctor.count({ where });

      return this.sendSuccess(res, {
        doctors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Doctores obtenidos exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener un doctor por ID
   */
  async getDoctorById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de doctor requerido", 400);
      }

      const doctor = await db.prisma.doctor.findUnique({
        where: { id },
        include: {
          user: true,
          appointments: {
            include: {
              appointment: {
                include: {
                  patient: {
                    include: {
                      patient: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!doctor) {
        return this.sendError(res, "Doctor no encontrado", 404);
      }

      return this.sendSuccess(res, doctor, "Doctor obtenido exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Crear un nuevo doctor
   */
  async createDoctor(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        userId, 
        specialty, 
        licenseNumber, 
        phone 
      } = req.body;

      // Validar datos requeridos
      if (!userId || !specialty || !licenseNumber) {
        return this.sendError(res, "Usuario ID, especialidad y número de licencia son requeridos", 400);
      }

      // Verificar si el usuario existe
      const user = await db.findUserById(userId);
      if (!user) {
        return this.sendError(res, "Usuario no encontrado", 404);
      }

      // Verificar si ya tiene un perfil de doctor
      const existingDoctor = await db.findDoctorByUserId(userId);
      if (existingDoctor) {
        return this.sendError(res, "El usuario ya tiene un perfil de doctor", 400);
      }

      // Verificar si el número de licencia ya existe
      const existingLicense = await db.prisma.doctor.findUnique({
        where: { licenseNumber },
      });
      if (existingLicense) {
        return this.sendError(res, "El número de licencia ya está registrado", 400);
      }

      const doctor = await db.createDoctor({
        userId,
        specialty,
        licenseNumber,
        phone,
      });

      return this.sendSuccess(res, doctor, "Doctor creado exitosamente", 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Actualizar un doctor
   */
  async updateDoctor(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { specialty, licenseNumber, phone } = req.body;

      if (!id) {
        return this.sendError(res, "ID de doctor requerido", 400);
      }

      // Verificar si el doctor existe
      const existingDoctor = await db.prisma.doctor.findUnique({
        where: { id },
      });

      if (!existingDoctor) {
        return this.sendError(res, "Doctor no encontrado", 404);
      }

      // Si se está cambiando el número de licencia, verificar que no exista
      if (licenseNumber && licenseNumber !== existingDoctor.licenseNumber) {
        const licenseExists = await db.prisma.doctor.findUnique({
          where: { licenseNumber },
        });
        if (licenseExists) {
          return this.sendError(res, "El número de licencia ya está registrado", 400);
        }
      }

      const doctor = await db.prisma.doctor.update({
        where: { id },
        data: {
          specialty,
          licenseNumber,
          phone,
        },
        include: {
          user: true,
        },
      });

      return this.sendSuccess(res, doctor, "Doctor actualizado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Eliminar un doctor
   */
  async deleteDoctor(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de doctor requerido", 400);
      }

      // Verificar si el doctor existe
      const existingDoctor = await db.prisma.doctor.findUnique({
        where: { id },
      });

      if (!existingDoctor) {
        return this.sendError(res, "Doctor no encontrado", 404);
      }

      await db.prisma.doctor.delete({
        where: { id },
      });

      return this.sendSuccess(res, null, "Doctor eliminado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener citas de un doctor
   */
  async getDoctorAppointments(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, date, page = 1, limit = 10 } = req.query;

      if (!id) {
        return this.sendError(res, "ID de doctor requerido", 400);
      }

      // Verificar si el doctor existe
      const doctor = await db.prisma.doctor.findUnique({
        where: { id },
      });

      if (!doctor) {
        return this.sendError(res, "Doctor no encontrado", 404);
      }

      const where: any = { doctorId: doctor.userId };
      if (status) {
        where.status = status;
      }
      if (date) {
        const startOfDay = new Date(date as string);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        where.dateTime = {
          gte: startOfDay,
          lt: endOfDay,
        };
      }

      const appointments = await db.prisma.appointment.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          patient: {
            include: {
              patient: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          dateTime: 'asc',
        },
      });

      const total = await db.prisma.appointment.count({ where });

      return this.sendSuccess(res, {
        appointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Citas del doctor obtenidas exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Buscar doctores por especialidad
   */
  async getDoctorsBySpecialty(req: Request, res: Response): Promise<Response> {
    try {
      const { specialty } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!specialty) {
        return this.sendError(res, "Especialidad requerida", 400);
      }

      const doctors = await db.findDoctorsBySpecialty(specialty);
      const total = doctors.length;

      const paginatedDoctors = doctors.slice(
        (Number(page) - 1) * Number(limit),
        Number(page) * Number(limit)
      );

      return this.sendSuccess(res, {
        doctors: paginatedDoctors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Doctores por especialidad obtenidos exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Buscar doctores por nombre o email
   */
  async searchDoctors(req: Request, res: Response): Promise<Response> {
    try {
      const { q, page = 1, limit = 10 } = req.query;

      if (!q) {
        return this.sendError(res, "Parámetro de búsqueda 'q' es requerido", 400);
      }

      const doctors = await db.prisma.doctor.findMany({
        where: {
          OR: [
            {
              user: {
                firstName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                lastName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                email: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              specialty: {
                contains: q as string,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await db.prisma.doctor.count({
        where: {
          OR: [
            {
              user: {
                firstName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                lastName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                email: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              specialty: {
                contains: q as string,
                mode: 'insensitive',
              },
            },
          ],
        },
      });

      return this.sendSuccess(res, {
        doctors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Búsqueda de doctores completada");
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

export const doctorController = new DoctorController();
