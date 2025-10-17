import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import db from "../services/database";
import { ApiResponse } from "../types";
import { User } from '../../dist/types/index';

export class UserController extends BaseController {
  /**
   * Obtener todos los usuarios (solo para administradores)
   */
  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, role } = req.query;

      let where = {};
      if (role) {
        // Buscar el rol por nombre para obtener su ID
        const roleRecord = await db.findRoleByName(role as string);
        if (roleRecord) {
          where = { roleId: roleRecord.id };
        }
      }

      const users = await db.prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          roles: true,
          patient: true,
          doctor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await db.prisma.user.count({ where });

      return this.sendSuccess(
        res,
        {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
        "Usuarios obtenidos exitosamente"
      );
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de usuario requerido", 400);
      }

      const user = await db.findUserById(id);
      if (!user) {
        return this.sendError(res, "Usuario no encontrado", 404);
      }

      return this.sendSuccess(res, user, "Usuario obtenido exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(req: Request, res: Response): Promise<Response> {
    try {
      const { email, firstName, lastName, role = "PATIENT" } = req.body;

      // Validar datos requeridos
      if (!email || !firstName || !lastName) {
        return this.sendError(
          res,
          "Email, nombre y apellido son requeridos",
          400
        );
      }

      // Verificar si el email ya existe
      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        return this.sendError(res, "El email ya está registrado", 400);
      }

      // Buscar el rol por nombre para obtener su ID
      const roleRecord = await db.findRoleByName(role);
      if (!roleRecord) {
        return this.sendError(res, "Rol no válido", 400);
      }

      const user = await db.createUser({
        email,
        firstName,
        lastName,
        roleId: roleRecord.id,
      });

      return this.sendSuccess(res, user, "Usuario creado exitosamente", 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Actualizar un usuario
   */
  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { email, firstName, lastName, role } = req.body;

      if (!id) {
        return this.sendError(res, "ID de usuario requerido", 400);
      }

      // Verificar si el usuario existe
      const existingUser = await db.findUserById(id);
      if (!existingUser) {
        return this.sendError(res, "Usuario no encontrado", 404);
      }

      // Si se está cambiando el email, verificar que no exista
      if (email && email !== existingUser.email) {
        const emailExists = await db.findUserByEmail(email);
        if (emailExists) {
          return this.sendError(res, "El email ya está registrado", 400);
        }
      }

      const updateData: any = {};
      if (email) updateData.email = email;
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;

      if (role) {
        // Buscar el rol por nombre para obtener su ID
        const roleRecord = await db.findRoleByName(role);
        if (!roleRecord) {
          return this.sendError(res, "Rol no válido", 400);
        }
        updateData.roleId = roleRecord.id;
      }

      const user = await db.updateUser(id, updateData);

      return this.sendSuccess(res, user, "Usuario actualizado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Eliminar un usuario
   */
  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de usuario requerido", 400);
      }

      // Verificar si el usuario existe
      const existingUser = await db.findUserById(id);
      if (!existingUser) {
        return this.sendError(res, "Usuario no encontrado", 404);
      }

      await db.deleteUser(id);

      return this.sendSuccess(res, null, "Usuario eliminado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }
  // Nuevo método para eliminar datos del usuario (derecho al olvido)
      async deleteData(req: Request, res: Response): Promise<Response> {

      const { userId } = req.user as { userId: string };
  
      // Validar que userId esté definido y sea una cadena
      if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ message: 'El ID del usuario es obligatorio y debe ser una cadena.' });
      }
  
      try {
          // Verificar si el usuario existe en la base de datos
          const user = await db.prisma.user.findUnique({
              where: { id: userId },
          });
  
          if (!user) {
              return res.status(404).json({ message: 'Usuario no encontrado.' });
          }
  
          // Eliminar al usuario de la base de datos
          await db.prisma.user.delete({
              where: { id: userId },
          });
  
          return res.status(200).json({ message: 'Datos del usuario eliminados correctamente.' });
      } catch (error) {
          console.error('Error al eliminar los datos del usuario:', error);
          return res.status(500).json({ message: 'Error al eliminar los datos del usuario.' });
      }
  };

  // Nuevo método para exportar datos del usuario
      async exportUserData(req: Request, res: Response): Promise<Response> {
      const { userId } = req.params;
  
      // Validar que userId esté definido y sea una cadena
      if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ message: 'El ID del usuario es obligatorio y debe ser una cadena.' });
      }
  
      try {
          // Buscar al usuario en la base de datos
          const user = await db.prisma.user.findUnique({
              where: { id: userId },
          });
  
          if (!user) {
              return res.status(404).json({ message: 'Usuario no encontrado.' });
          }
  
          // Preparar los datos del usuario para exportar
          const userData = {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.roleId
          };
  
          // Configurar el encabezado para la descarga
          res.setHeader('Content-Disposition', `attachment; filename=user_${userId}_data.json`);
          return res.status(200).json(userData);
      } catch (error) {
          console.error('Error al exportar los datos del usuario:', error);
          return res.status(500).json({ message: 'Error al exportar los datos del usuario.' });
      }
  };

  // Nuevo método para otorgar consentimiento
 async giveConsent(req: Request, res: Response): Promise<Response> {
      const { userId } = req.body;
  
      if (!userId) {
          return res.status(400).json({ message: 'El ID del usuario es obligatorio.' });
      }
  
      try {
          // Crear o actualizar el consentimiento en la base de datos
          await db.prisma.userConsent.upsert({
              where: { userId },
              update: { consentGiven: true },
              create: { userId, consentGiven: true },
          });
  
          return res.status(200).json({ message: 'Consentimiento otorgado.' });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error al otorgar el consentimiento.' });
      }
  };

  async withdrawConsent(req: Request, res: Response): Promise<Response> {
      const { userId } = req.body;
  
      if (!userId) {
          return res.status(400).json({ message: 'El ID del usuario es obligatorio.' });
      }
  
      try {
          // Actualizar el consentimiento en la base de datos
          await db.prisma.userConsent.update({
              where: { userId },
              data: { consentGiven: false },
          });
  
          return res.status(200).json({ message: 'Consentimiento retirado.' });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error al retirar el consentimiento.' });
      }
  };
  
  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.sendError(res, "Usuario no autenticado", 401);
      }

      const user = await db.findUserById(userId);
      if (!user) {
        return this.sendError(res, "Usuario no encontrado", 404);
      }

      return this.sendSuccess(res, user, "Perfil obtenido exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

export const userController = new UserController();
