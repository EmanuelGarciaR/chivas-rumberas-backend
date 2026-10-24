import { Request, Response, NextFunction } from "express";
import { LoginUseCase } from "../../application/use-cases/auth/Login";
import { LoginDto } from "../../application/dtos/AuthDto";

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: LoginDto = req.body;
      const result = await this.loginUseCase.execute(dto);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
