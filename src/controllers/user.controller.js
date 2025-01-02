
 import {asyncHandler} from "../utils/asyncHandler.js"
 import{ ApiError} from "../utils/ApiError.js"
import {user}from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser= asyncHandler(async (req, res)=>{
  
    const {fullName,email,userName,password}= req.body
    console.log("email:", email);
   

    if (
       [fullName,email,userName,password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400,"all fields are required")
    }
        user.findOne({
            $or:[{username},{email}]
        })
        if(existerUser){
            throw new ApiError(409,"user with username and eamil already exists")
        }
        const avatarLocalPath = req.files?.avatar[0]?.path
        const coverImageLocalPath = req.files?.avtar[0]?.path

        if (!avatar) {
            throw new ApiError(400,"Avatar file is required")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath) ;

        if (!avatar) {
            throw new ApiError(400,"Avatar file is required")
        }
        const user = await user.create({
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            userName:userName.toLowerCase()
        })

       const createdUser = await user.findById(user._id).select(
        "-password - refreshToken"
       )
       if (!createdUser) {
        throw new ApiError(500,"Something went wrong while regestring the user");
              
       }

       return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )
})






 
export{registerUser}