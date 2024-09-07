import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'; // Import fs module
import path from 'path'; // Import path module
import imgPath from 'index.js'
// Define the variable for the image path


function uploadImage (imgPath) {
    console.log(imgPath);
    
    (async function() {
        // Configuration
        cloudinary.config({ 
            cloud_name: 'dbxhcgqlx', 
            api_key: '839131268921711', 
            api_secret: 'J23UqE8s3rpPA-qQRvkD25VSZ5s'
        });
    
        // Ensure the image path is provided
        if (!imgPath) {
            console.error('Image path is not set.');
            return;
        }
    
        // Upload the local image
        try {
            const uploadResult = await new Promise((resolve, reject) => {
                fs.createReadStream(imgPath).pipe(
                    cloudinary.uploader.upload_stream({
                        public_id: 'shoes', // Replace with your desired public ID
                    }, (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    })
                );
            });
    
            console.log(uploadResult);
    
            // Optimize delivery by resizing and applying auto-format and auto-quality
            const optimizeUrl = cloudinary.url('shoes', {
                fetch_format: 'auto',
                quality: 'auto'
            });
    
            console.log(optimizeUrl);
    
            // Transform the image: auto-crop to square aspect_ratio
            const autoCropUrl = cloudinary.url('shoes', {
                crop: 'auto',
                gravity: 'auto',
                width: 500,
                height: 500,
            });
    
    
        } catch (error) {
            console.log('Error:', error);
        }
    })();    
}
