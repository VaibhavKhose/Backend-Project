
import {asyncHandler} from "../utils/asyncHandler.js"
 import{ ApiError} from "../utils/ApiError.js"
import {User}from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { json } from "express"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
      const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const generateToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
   await  user.save({validateBeforeSave : false})

   return{accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
        
        
    }
}
const registerUser= asyncHandler(async (req, res)=>{
  
    const {fullName,email,userName,password}= req.body
    console.log("email:", email);
   

    if (
       [fullName,email,userName,password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400,"all fields are required")
    }
        const existedUser= await User.findOne({
            $or:[{userName},{email}]
        })
        if(existedUser){
            throw new ApiError(409,"user with username and eamil already exists")
        }
        
        
        const avatarLocalPath = req.files?.avatar[0]?.path
        //const coverImageLocalPath = req.files?.coverImage[0]?.path

        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        // if (!avatar) {
        //     throw new ApiError(400,"Avatar file is required")
        // }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath) ;

        if (!avatar) {
            throw new ApiError(400,"failed to upload avatar on cloudinary")
        }
        // if (!coverImage) {
        //     throw new ApiError(400,"failed to upload coverImage on cloudinary")
        // }

      
        const user = await User.create({
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            userName:userName.toLowerCase()
        })

        

       const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
       )
       if (!createdUser) {
        throw new ApiError(500,"Something went wrong while regestring the user");
              
       }

       return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )
})

const loginUser = asyncHandler(async(req , res)=>{


    const {userName,password,email} = req.body
    console.log(email);


    if (!userName || !email ) {
        throw new ApiError(400, "username or email is required")
        
    }
     const user = await User.findOne({
        $or:[{userName}, {email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
throw new ApiError(401,"Invalid user Credential");
    
  }

   const {refreshToken, accessToken}=await generateAccessAndRefreshToken(user._id)

 const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

 const options = {
    httpOnly: true,
    secure : ture
 }
 return res
 .status(200)
 .cookie("accessToken",accessToken , options)
 .cookie("refreshToken",refreshToken , options)
 .json(
    new ApiResponse(
        200,
        {
            user : loggedInUser,accessToken,refreshToken 
 
        },
        "user logged in successfully"
    )  
 )
})


const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,{

         $set: {
            refreshToken : undefined
         }
         },
         {
            new:true
         }
        
        
    )
    const options = {
        httpOnly: true,
        secure : ture
    }
    return res.status(200)
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))


    
})








 
export{registerUser,
    loginUser,logoutUser
}