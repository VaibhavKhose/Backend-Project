import { json } from "express"

const asyncHandler = (reqHandler) =>{
(req,res,next)=>{
    promise.resolve(req,res,next).catch((err)=>next(err))
    
}
 }
 export { asyncHandler }


       
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 //try-catch
// const asyncHandler = (fn) = async(req,res,next)=>{
//     try {
//         await fn (req,res,next)
        
//     } catch (error) {
//         res.status(err.code || 500). json({
//             success : false,
//             message : err.message

//         })
//     }
// }
