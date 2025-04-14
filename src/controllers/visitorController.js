const User = require('../models/User');
const Photo = require('../models/Photo');

const getUnlockedPhotos = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if(user._id.toString() !== id){
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const photos = await Photo.find({ unlockedBy: user.email });
        res.status(200).json({
            success: true,
            message: "Photos unlocked",
            photos
        });
    } catch (error) {
        next(error);
    }
}   
const getUnlockedPhoto = async (req, res, next) => {
    try {
        const { id, photoId } = req.params;
        const user = req.user;
        
        if(user._id.toString() !== id){
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const visitor = await User.findOne({ _id: id, role: "visitor" });
        if(!visitor){
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const photo = await Photo.findById(photoId);
        if(!photo){
            return res.status(404).json({ success: false, message: "Photo not found" });
        }
        if(photo.unlockedBy.includes(visitor.email)){
            return res.status(200).json({
                success: true,
                message: "Photo unlocked",
                photo
            });
        }
        res.status(403).json({ success: false,   message: "Photo not unlocked" });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    getUnlockedPhotos,
    getUnlockedPhoto
}
