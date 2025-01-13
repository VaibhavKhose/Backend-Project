import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import{ User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async(req, res, next)=>{

 try {
   const Token =  req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")
 
     if (!Token) {
         throw new ApiError(401, "Unathorized request")
         
     }
       const decodedToken =  jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET)
 
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
       console.log("Decoded Token:", decodedToken);

 
       if (!user) {
         throw new ApiError(401,"Invalid Access Token") 
       }
       req.user = user;
       next()  //user.routes.js line 26 automated run after first one 
 } catch (error) {
  throw new ApiError(401, error?.message || "invaild accessToken")
  
 }
})

export {verifyJWT} 

