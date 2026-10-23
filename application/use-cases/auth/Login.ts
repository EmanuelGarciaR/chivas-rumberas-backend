import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IJwtService } from "../../ports/IJwtService";
import { LoginDto, AuthResponseDto } from "../../dtos/AuthDto";
import { InvalidCredentialsError } from "../../../domain/errors/AuthErrors";
import bcrypt from "bcrypt";

/**
 * Caso de uso: Login del operador/admin.
 *
 * Orquesta:
 * 1. Buscar el usuario por email.
 * 2. Comparar la contraseña con el hash almacenado.
 * 3. Firmar y devolver el JWT.
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    // 1. Buscar usuario — mismo mensaje si no existe o si la contraseña es incorrecta
    const user = await this.userRepository.findUserByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    // 2. Comparar contraseña
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new InvalidCredentialsError();

    // 3. Firmar JWT con el payload mínimo
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
