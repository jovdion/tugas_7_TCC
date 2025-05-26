import Catatan from "../models/CatatanModel.js";
import Users from "../models/Usermodel.js";

export const getCatatan = async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    try {
        const response = await Catatan.findAll({
            where: {
                userId: userId
            }
        });
        res.status(200).json(response);
    } catch (error) {
        // Logging error lebih detail untuk debugging
        console.error("Error getting notes:", error);
        res.status(500).json({ message: error.message });
    }
};

// CREATE CATATAN
export const createCatatan = async (req, res) => {
    try {
        const { name, judul, isi_catatan } = req.body;
        const userId = req.userId;  // Get the userId from the JWT

        const newNote = await Catatan.create({
            name,
            judul,
            isi_catatan,
            userId  // Associate the note with the userId
        });

        res.status(201).json(newNote);  // Return the newly created note
    } catch (error) {
        console.error("Error creating catatan:", error);
        res.status(500).json({ msg: "Error creating catatan" });
    }
};


// UPDATE CATATAN
export const updateCatatan = async (req, res) => {
    const userId = req.userId;
    const { judul, isi_catatan } = req.body;

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    // Validasi input di sisi server
    if (!judul || !isi_catatan) {
        return res.status(400).json({ msg: "Judul dan isi catatan diperlukan untuk pembaruan." });
    }

    try {
        const catatan = await Catatan.findOne({
            where: {
                catatan_id: req.params.id,
                userId: userId
            }
        });

        if (!catatan) {
            return res.status(404).json({ msg: "Catatan tidak ditemukan atau Anda tidak memiliki izin untuk mengedit catatan ini." });
        }
        
        await Catatan.update({ judul, isi_catatan }, {
            where: {
                catatan_id: req.params.id,
                userId: userId
            }
        });
        res.status(200).json({ msg: "Catatan berhasil diperbarui" });
    } catch (error) {
        // Logging error lebih detail untuk debugging
        console.error("Error updating note:", error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE CATATAN
export const deleteCatatan = async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    try {
        const catatan = await Catatan.findOne({
            where: {
                catatan_id: req.params.id,
                userId: userId
            }
        });

        if (!catatan) {
            return res.status(404).json({ msg: "Catatan tidak ditemukan atau Anda tidak memiliki izin untuk menghapus catatan ini." });
        }
        
        await Catatan.destroy({
            where: {
                catatan_id: req.params.id,
                userId: userId
            }
        });
        res.status(200).json({ msg: "Catatan berhasil dihapus" });
    } catch (error) {
        // Logging error lebih detail untuk debugging
        console.error("Error deleting note:", error);
        res.status(500).json({ message: error.message });
    }
};
