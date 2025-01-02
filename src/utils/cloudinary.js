import{v2 as cloudinary} from "cloudinary"
import fs from "fs"

import { v2 as cloudinary } from 'cloudinary';



    // Configuration
    cloudinary.config({ 
        cloud_name:  process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });



    const uploadOnCloudinary=async(localFilePath) =>{
        try {
            if(!localFilePath)return null
            //upload file on cloudinary
           const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"})
                //file has been upload succesfully
                console.log("file is upkoaded on cloudinary", response.url)
                return response;
        } catch (error) {
            fs.unlinkSync(localFilePath)  //remove the locallu saved temp file as the upload got failed..
            return null;
            
        }
    }
    export {uploadOnCloudinary}
    
   