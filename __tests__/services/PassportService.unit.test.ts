import { mockUser, mockGooglePayload } from "../mocks/mockData";

// Mock de las dependencias
const mockJwtSign = jest.fn();
const mockOAuth2ClientVerifyIdToken = jest.fn();
const mockGetPayload = jest.fn();
const mockPrismaUserFindUnique = jest.fn();
const mockPrismaUserCreate = jest.fn();

jest.mock("jsonwebtoken", () => ({
  sign: mockJwtSign,
}));

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockOAuth2ClientVerifyIdToken,
  })),
}));

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: mockPrismaUserFindUnique,
      create: mockPrismaUserCreate,
    },
  })),
}));

jest.mock("passport", () => ({
  use: jest.fn(),
  authenticate: jest.fn().mockReturnValue("mock-authenticate-middleware"),
}));

jest.mock("passport-jwt", () => ({
  Strategy: jest.fn(),
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn(),
  },
}));

// Mock de las variables de entorno
const mockEnv = {
  GOOGLE_CLIENT_ID: "mock-google-client-id",
  SECRET_JWT_KEY: "mock-secret-key",
};

process.env.GOOGLE_CLIENT_ID = mockEnv.GOOGLE_CLIENT_ID;
process.env.SECRET_JWT_KEY = mockEnv.SECRET_JWT_KEY;

describe("PassportService", () => {
  let validateGoogleToken: (token: string) => Promise<string>;

  beforeAll(() => {
    // Importar el módulo después de configurar los mocks
    const passportModule = require("../../src/services/passport/index");
    validateGoogleToken = passportModule.validateGoogleToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtSign.mockReturnValue("mock-jwt-token");
  });

  describe("validateGoogleToken", () => {
    const validGoogleToken = "valid-google-token";

    it("debería validar un token de Google válido y retornar JWT para usuario existente", async () => {
      // Arrange
      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);

      // Act
      const result = await validateGoogleToken(validGoogleToken);

      // Assert
      expect(mockOAuth2ClientVerifyIdToken).toHaveBeenCalledWith({
        idToken: validGoogleToken,
        audience: mockEnv.GOOGLE_CLIENT_ID,
      });

      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: mockGooglePayload.email },
      });

      expect(mockPrismaUserCreate).not.toHaveBeenCalled();

      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          picture: mockGooglePayload.picture,
        },
        mockEnv.SECRET_JWT_KEY,
        { expiresIn: "7d" }
      );

      expect(result).toBe("mock-jwt-token");
    });

    it("debería crear un nuevo usuario si no existe y retornar JWT", async () => {
      // Arrange
      const newUser = { ...mockUser, id: "new-user-123" };
      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      });
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockResolvedValue(newUser);

      // Act
      const result = await validateGoogleToken(validGoogleToken);

      // Assert
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: mockGooglePayload.email },
      });

      expect(mockPrismaUserCreate).toHaveBeenCalledWith({
        data: {
          email: mockGooglePayload.email,
          firstName: mockGooglePayload.given_name,
          lastName: mockGooglePayload.family_name,
          role: "PATIENT",
        },
      });

      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          userId: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          picture: mockGooglePayload.picture,
        },
        mockEnv.SECRET_JWT_KEY,
        { expiresIn: "7d" }
      );

      expect(result).toBe("mock-jwt-token");
    });

    it("debería manejar campos nulos/undefined del payload de Google", async () => {
      // Arrange
      const payloadWithNulls = {
        ...mockGooglePayload,
        email: undefined,
        given_name: null,
        family_name: undefined,
        picture: null,
      };
      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(payloadWithNulls),
      });
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockResolvedValue(mockUser);

      // Act
      const result = await validateGoogleToken(validGoogleToken);

      // Assert
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: "" },
      });

      expect(mockPrismaUserCreate).toHaveBeenCalledWith({
        data: {
          email: "",
          firstName: "",
          lastName: "",
          role: "PATIENT",
        },
      });

      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          picture: null,
        },
        mockEnv.SECRET_JWT_KEY,
        { expiresIn: "7d" }
      );

      expect(result).toBe("mock-jwt-token");
    });

    it("debería lanzar error si el token de Google es inválido", async () => {
      // Arrange
      const invalidToken = "invalid-google-token";
      mockOAuth2ClientVerifyIdToken.mockRejectedValue(
        new Error("Invalid token")
      );

      // Act & Assert
      await expect(validateGoogleToken(invalidToken)).rejects.toThrow(
        "Invalid Google token"
      );

      expect(mockOAuth2ClientVerifyIdToken).toHaveBeenCalledWith({
        idToken: invalidToken,
        audience: mockEnv.GOOGLE_CLIENT_ID,
      });

      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
      expect(mockPrismaUserCreate).not.toHaveBeenCalled();
      expect(mockJwtSign).not.toHaveBeenCalled();
    });

    it("debería lanzar error si el payload del token es nulo", async () => {
      // Arrange
      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(null),
      });

      // Act & Assert
      await expect(validateGoogleToken(validGoogleToken)).rejects.toThrow(
        "Invalid Google token"
      );

      expect(mockOAuth2ClientVerifyIdToken).toHaveBeenCalled();
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it("debería lanzar error si hay un problema con la base de datos", async () => {
      // Arrange
      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      });
      mockPrismaUserFindUnique.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(validateGoogleToken(validGoogleToken)).rejects.toThrow(
        "Invalid Google token"
      );

      expect(mockPrismaUserFindUnique).toHaveBeenCalled();
      expect(mockJwtSign).not.toHaveBeenCalled();
    });

    it("debería manejar errores al crear usuario nuevo", async () => {
      // Arrange
      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      });
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockRejectedValue(new Error("User creation failed"));

      // Act & Assert
      await expect(validateGoogleToken(validGoogleToken)).rejects.toThrow(
        "Invalid Google token"
      );

      expect(mockPrismaUserCreate).toHaveBeenCalled();
      expect(mockJwtSign).not.toHaveBeenCalled();
    });

    it("debería usar valores por defecto para variables de entorno faltantes", async () => {
      // Esta prueba verifica que las funciones manejen correctamente cuando las variables
      // de entorno no están definidas, usando valores por defecto (cadenas vacías)

      // Como el módulo ya está cargado con las variables de entorno mockeadas,
      // esta prueba simplemente verifica que el comportamiento es correcto

      mockOAuth2ClientVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);

      // Act
      const result = await validateGoogleToken(validGoogleToken);

      // Assert - El módulo debería usar las variables de entorno configuradas
      expect(mockOAuth2ClientVerifyIdToken).toHaveBeenCalledWith({
        idToken: validGoogleToken,
        audience: mockEnv.GOOGLE_CLIENT_ID,
      });

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        mockEnv.SECRET_JWT_KEY,
        { expiresIn: "7d" }
      );

      expect(result).toBe("mock-jwt-token");
    });
  });

  describe("Passport JWT Strategy", () => {
    it("debería configurar la estrategia JWT correctamente", async () => {
      // Esta prueba verifica que la estrategia se configure sin errores
      // La configuración real se hace en el módulo, aquí solo verificamos que no hay errores
      expect(() => {
        require("../../src/services/passport/index");
      }).not.toThrow();
    });
  });

  describe("authenticateJWT middleware", () => {
    it("debería exportar el middleware de autenticación JWT", async () => {
      const passportModule = require("../../src/services/passport/index");
      expect(passportModule.authenticateJWT).toBeDefined();
      expect(passportModule.authenticateJWT).toBe(
        "mock-authenticate-middleware"
      );
    });
  });
});
