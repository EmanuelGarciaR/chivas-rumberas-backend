import { Request, Response, NextFunction } from "express";
import { GetChivasUseCase } from "../../application/use-cases/chiva/GetChivas";
import { GetChivaByIdUseCase } from "../../application/use-cases/chiva/GetChivaById";
import { ChivaStatus } from "../../domain/models/Chiva";

export class ChivasController {
  constructor(
    private readonly getChivasUseCase: GetChivasUseCase,
    private readonly getChivaByIdUseCase: GetChivaByIdUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as ChivaStatus | undefined;
      const chivas = await this.getChivasUseCase.execute(status);
      res.status(200).json(chivas);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const chiva = await this.getChivaByIdUseCase.execute(id);
      res.status(200).json(chiva);
    } catch (err) {
      next(err);
    }
  };
}
