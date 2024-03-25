import "express-serve-static-core";

interface User {
  id: string
}

declare module "express-serve-static-core" {
  interface Request {
    user: User | undefined
    file: Express.Multer.File
  }
}
