import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import db from "../services/database";
import { ApiResponse } from "../types";

export class UserController extends BaseController {
  /**
   * Obtener todos los usuarios (solo para administradores)
   */
  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, role } = req.query;
      
      const where = role ? { role: role as 'ADMIN' | 'DOCTOR' | 'PATIENT' } : {};
      
      const users = await db.prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await db.prisma.user.count({ where });

      return this.sendSuccess(res, {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Usuarios obtenidos exitosamente");
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
      const { email, firstName, lastName, role = 'PATIENT' } = req.body;

      // Validar datos requeridos
      if (!email || !firstName || !lastName) {
        return this.sendError(res, "Email, nombre y apellido son requeridos", 400);
      }

      // Verificar si el email ya existe
      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        return this.sendError(res, "El email ya está registrado", 400);
      }

      const user = await db.createUser({
        email,
        firstName,
        lastName,
        role: role as 'PATIENT',
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
      if (role) updateData.role = role as 'ADMIN' | 'DOCTOR' | 'PATIENT';

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
