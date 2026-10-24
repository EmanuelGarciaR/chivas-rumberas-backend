import { Router } from "express";
import { TravelsController } from "../controllers/travels.controller";

export const createTravelsRouter = (controller: TravelsController): Router => {
  const router = Router();

  /** GET /travels — Público */
  router.get("/", controller.getAll);

  return router;
};
