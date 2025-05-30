import express from "express";
import { getUsers , Register , Login , Logout } from "../controllers/Usercontroller.js";
import { verifyToken } from "../middleware/verifytoken.js";
import { refreshToken } from "../controllers/Refreshtoken.js";

const router = express.Router();

router.get("/users", verifyToken , getUsers);
router.post("/users", Register);
router.post("/login", Login);
router.get("/token", refreshToken);
router.delete("/logout", Logout);

export default router;