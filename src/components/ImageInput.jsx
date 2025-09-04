import React, { useState } from 'react';
import { Avatar } from '@mui/material';
import { Upload } from '@mui/icons-material';
import axios from 'axios';
import { toast } from "react-toastify";

function ImageInput({ initialImage, onImageUpload, isEditing, imgId, size = 200 }) {
    const [loading, setLoading] = useState(false);

    const handleImageUpload = async (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.REACT_APP_UPLOAD_PRESET);
        formData.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);

        try {
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
                formData
            );
            onImageUpload(response.data.secure_url);
            toast.success("Image uploaded successfully!");
        } catch (error) {
            toast.error("Failed to upload the image!");
            console.error("Upload error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        if (isEditing) {
            document.getElementById(`image-upload-${imgId}`).click();
        }
    };

    return (
        <div className="imageInputContainer">
            <Avatar
                src={initialImage}
                alt="Uploaded Image"
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '8px',
                    bgcolor: '#143676',
                    cursor: isEditing ? 'pointer' : 'default',
                }}
            />
            {isEditing && (
                <>
                    <div className="imageOverlay" onClick={handleClick}>
                        <Upload sx={{ fontSize: 40 }} />
                    </div>
                    <input
                        id={`image-upload-${imgId}`}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                    />
                </>
            )}
            {loading && (
                <div className="imageOverlay" style={{ opacity: 1 }}>
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
}

export default ImageInput;