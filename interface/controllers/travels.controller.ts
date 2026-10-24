import { Request, Response, NextFunction } from "express";
import { GetTravelsUseCase } from "../../application/use-cases/travel/GetTravels";

export class TravelsController {
  constructor(private readonly getTravelsUseCase: GetTravelsUseCase) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const travels = await this.getTravelsUseCase.execute();
      res.status(200).json(travels);
    } catch (err) {
      next(err);
    }
  };
}
