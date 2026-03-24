// export const uploadToCloudinary = async (file: File): Promise<string | null> => {
//   const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//   const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

//   if (!cloudName || !uploadPreset) {
//     console.error("Cloudinary environment variables are missing.");
//     return null;
//   }

//   const formData = new FormData();
//   formData.append('file', file);
//   formData.append('upload_preset', uploadPreset);

//   try {
//     const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
//       method: 'POST',
//       body: formData,
//     });

//     const data = await response.json();
    
//     if (!response.ok) {
//       throw new Error(data.error?.message || "Failed to upload image");
//     }

//     // Returns the secure URL of the uploaded file
//     return data.secure_url; 
//   } catch (error) {
//     console.error("Error uploading to Cloudinary:", error);
//     return null;
//   }
// };