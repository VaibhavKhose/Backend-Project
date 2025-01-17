
import {asyncHandler} from "../utils/asyncHandler.js"
 import{ ApiError} from "../utils/ApiError.js"
import {User}from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { json } from "express"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
      const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
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


    if (!userName && !email ) {
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
    secure : true
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

         $unset: {
            refreshToken : 1
         }
         },
         {
            new:true
         }
        
        
    )
    const options = {
        httpOnly: true,
        secure : true
    }
    return res.status(200)
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))


    
})


const refreshAccessToken =asyncHandler(async(req,res) =>{
    req.cookies.refreshToken || req.body.refreshToken

    if (!refreshAccessToken) {
        throw new ApiError(400, "Unauthorized access")
    }
try {
      const decodedToken =  jwt.verify(refreshAccessToken,
            process.env.REFRESH_TOKEN_SECRET)
    
             const user = await User.findById(decodedToken?._id)
    
             if (!user) {
                throw new ApiError(401, "Invalid refresh Token")
            }
            if (refreshToken !==user?.refreshToken) {
                throw new ApiError(400, " Refresh Token is Expired or used")
            }
            const options ={
                httpOnly : true,
                secure : true
            }
    
           const {newrefreshToken, accessToken} = await generateRefreshToken(user._id)
    
           return res
           .status(200)
           .cookie("accessToken",newrefreshToken , options)
           .cookie("refresh Token",accessToken , options)
           .json(new ApiResponse(
            200,
            {refreshToken : newrefreshToken, accessToken},"Access refreshTkoen"
    
           ))
    
 
} catch (error) {
    throw new ApiError(401, error?.messsage , "Invalid refresh Token")
    
}
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

      const user = await User.findById(req.user?._id)
      const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

      if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password ")    
      }

      user.password = newPassword
      await user.save({validateBeforeSave:false})

      return res
      .status(200)
      .json(new ApiResponse(200,{}, "Password Change Successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const{fullName,email} = req.body

    if (!fullName || !email){
        throw new ApiError(400,"All fields are required");
        
    }
   const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"),"")
})

const updateUserAvatar = asyncHandler(async(req,res)=>
    {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing");    
    }
       const avatar = await uploadOnCloudinary(avatarLocalPath)

       if (!avatar.url) {
        throw new ApiError(400,"error while uploading on avatar"); 
       }

        await User.findByIdAndUpdate(
        req.User?._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new : true} 
       ).select("-password")
       return res
           .status(200)
           .json(
           new ApiResponse(200,user,"Avatar updated successfully")
           )
    })



const updateUserCoverImage = asyncHandler(async(req,res)=>{

        const coverImageLocalPath = req.file?.path
    
        if (!coverImageLocalPath) {
            throw new ApiError(400,"cover image file is missing");    
        }
           const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
           if (!coverImage.url) {
            throw new ApiError(400,"error while uploading on Cover Image"); 
           }
    
           const user = await User.findByIdAndUpdate(
            req.User?._id,
            {
                $set:{
                    avatar : coverImage.url
                }
            },
            {new : true} 

           ).select("-password")

           return res
           .status(200)
           .json(
           new ApiResponse(200,user,"cover image updated successfully")
           )
     
        })

const getUserChannelProfile = asyncHandler(async(req, res)=>{
   const {userName} =  req.body
//    console.log("hey")
   if (!userName?.trim()) {
    throw new ApiError(400, "username is missing")
   }
   const  channel = await User.aggregate([
  {
    $match:{
        userName : userName?.toLowerCase()
    }
    },
    {
        $lookup:{
            from : "subscriptions",
            localField: "_id",
            foreignField : "channel",
            as : "subscribers"


        }
  },
 
  {
    $lookup:{
        from : "subscriptions",
        localField: "_id",
        foreignField : "subscriber",
        as : "subscriberTo"
    }

  },
  {
    $addFields:{
        subscribersCount:{
            $size : "$subscribers"
        },
        channelSubscribedToCount :{
            $size :"$subscriberTo"
        },
   
        isSubscribed : {
            $cond:{
                if: {$in: [req.user?._id, "$subscribers.subscriber"]},
    
                then:true,
                else : false
                  }
                }
            }
        },
        {
        $project:{
            fullName:1,
            userName:1,
            subscribersCount:1,
            channelSubscribedToCount:1,
            coverImage:1,
            avatar:1,
            email:1,
            isSubscribed:1

        }
    }
    
    ])
    if (!channel?.length) {
        throw new ApiError(400,"channel doesnot exist")   
    } 
    
    return res
    .status(200)
    .json( new ApiResponse(200,channel[0],"User channel fetched successfully"))
    console.log("hey")
}) 

const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([{
        $match : {
            _id : new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup :{
            from : "videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from : "users",
                    localField:"owner",
                    foreignField:"_id",
                    localField:"owner",
                    as:"owner",
                    pipeline:[
                        {
                            fullName:1,
                            userName:1,
                            avatar:1
                        }
                    
                    ]
                }
                },
                {
                    $addFields:{
                        owner : {
                            $first :"owner"
                        }
                    }
                }
            ]

        }
    }
    ])
    return res
    .status(200)
    .json(ApiResponse(200,user[0].watchHistory,"Watch History fetched Successfully"))
})


                    
           

 
export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}