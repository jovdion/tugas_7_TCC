import Users from "../models/Usermodel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ["id", "username", "email"],
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

// Register a new user
export const Register = async (req, res) => {
    const { username, email, password, confPassword } = req.body;

    if (!username || !email || !password || !confPassword) {
        return res.status(400).json({ msg: "Semua field harus diisi" });
    }

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }

    try {
        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ msg: "Email sudah terdaftar" });
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        await Users.create({ username, email, password: hashPassword });

        res.json({ msg: "Register Berhasil" });  // Success message
    } catch (error) {
        console.error("Error saat register:", error);
        res.status(500).json({ msg: "Register Gagal" });  // Failure message
    }
};


// Login user
export const Login = async (req, res) => {
    try {
        console.log('Request body:', req.body);  // Log the request body to check values

        const user = await Users.findOne({
            where: { email: req.body.email }
        });

        if (!user) {
            console.log(`Login attempt with non-existing email: ${req.body.email}`);
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
            console.log(`Incorrect password attempt for email: ${req.body.email}`);
            return res.status(400).json({ msg: "Password salah" });
        }

        // JWT token generation
        const accessToken = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        console.log(`Login successful for email: ${req.body.email}`);
        res.json({ accessToken });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ msg: "Login Gagal" });
    }
};


// Logout user
export const Logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204);

        const user = await Users.findOne({
            where: { refresh_token: refreshToken }
        });

        if (!user) return res.sendStatus(204);

        await Users.update({ refresh_token: null }, {
            where: { id: user.id }
        });

        res.clearCookie('refreshToken');
        return res.sendStatus(200);
    } catch (error) {
        console.error("Error saat logout:", error);
        res.sendStatus(500);
    }
};


